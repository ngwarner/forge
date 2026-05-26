#!/usr/bin/env node
/**
 * Forge MCP Server
 *
 * Translates human ideas into working software.
 * Any AI that supports MCP can use this server.
 *
 * Tools:
 *   forge_describe  — human description → Forge spec
 *   forge_build     — Forge spec → working implementation
 *   forge_verify    — spec + implementation → pass/fail report
 *   forge_ship      — human description → working implementation (one shot)
 */

import Anthropic from '@anthropic-ai/sdk';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { SPEC_PROMPT, BUILD_PROMPT, VERIFY_PROMPT } from './prompts.js';

const MODEL = 'claude-sonnet-4-6';

const client = new Anthropic();

// ── Core functions ────────────────────────────────────────────────────────────

async function callClaude(system: string, userMsg: string, maxTokens: number): Promise<string> {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: userMsg }],
  });
  const block = msg.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude');
  return block.text.trim();
}

async function describeToSpec(description: string): Promise<string> {
  return callClaude(SPEC_PROMPT, description, 4096);
}

async function specToApp(spec: string): Promise<string> {
  return callClaude(BUILD_PROMPT, spec, 8096);
}

async function verifyApp(spec: string, implementation: string): Promise<string> {
  return callClaude(
    VERIFY_PROMPT,
    `SPEC:\n${spec}\n\nIMPLEMENTATION:\n${implementation}`,
    2048,
  );
}

// ── MCP Server ────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'forge',
  version: '0.1.0',
});

// Tool 1: Translate description → spec
server.tool(
  'forge_describe',
  'Translate a human problem description into a Forge specification. ' +
  'The spec captures what the human needs, all assumptions, and concrete examples. ' +
  'Use this before forge_build to inspect or edit the spec.',
  { description: z.string().describe('What the human wants to build or solve, in plain English') },
  async ({ description }) => {
    const spec = await describeToSpec(description);
    return {
      content: [{ type: 'text', text: spec }],
    };
  },
);

// Tool 2: Build implementation from spec
server.tool(
  'forge_build',
  'Generate a complete, working implementation from a Forge specification. ' +
  'Returns raw code (HTML for web apps, Python for scripts). ' +
  'The implementation satisfies every ensures clause and passes every example.',
  { spec: z.string().describe('A Forge specification produced by forge_describe') },
  async ({ spec }) => {
    const implementation = await specToApp(spec);
    return {
      content: [{ type: 'text', text: implementation }],
    };
  },
);

// Tool 3: Verify implementation against spec
server.tool(
  'forge_verify',
  'Verify that an implementation satisfies its Forge specification. ' +
  'Returns a report showing which examples pass/fail and which ensures clauses are met.',
  {
    spec:           z.string().describe('The Forge specification'),
    implementation: z.string().describe('The implementation to verify'),
  },
  async ({ spec, implementation }) => {
    const report = await verifyApp(spec, implementation);
    return {
      content: [{ type: 'text', text: report }],
    };
  },
);

// Tool 4: One-shot — description → working app
server.tool(
  'forge_ship',
  'The primary Forge tool. Takes a human description and returns a complete working application. ' +
  'No technical knowledge required — just describe the problem or idea in plain English. ' +
  'Returns HTML (for web/UI apps) or Python (for scripts/automation). ' +
  'Examples: "a shopping list that tracks my budget", ' +
  '"send me a daily summary of my unread emails", ' +
  '"a timer that plays a sound when my pasta is done".',
  {
    description: z.string().describe(
      'The human\'s idea or problem in plain English. ' +
      'No technical terms needed — describe it the way you would explain it to a friend.'
    ),
  },
  async ({ description }) => {
    // Step 1: translate to spec (internal — not returned to user)
    const spec = await describeToSpec(description);

    // Step 2: build implementation from spec
    const implementation = await specToApp(spec);

    // Return both so the calling AI can expose the spec if helpful
    return {
      content: [
        {
          type: 'text',
          text: implementation,
        },
      ],
      // Attach spec as metadata so the AI can show it if the human wants to understand what was built
      _meta: { spec },
    };
  },
);

// ── Start ─────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
