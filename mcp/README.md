# forge-mcp

MCP server for [Forge](https://github.com/ngwarner/forge) — translates human ideas into working software.

## What it does

Connect Forge to Claude Desktop (or any MCP-compatible AI). Then just describe what you need — no code required.

```
You: "I need a shopping list that tracks my budget"
Claude calls → forge_ship("I need a shopping list that tracks my budget")
Returns → complete working web app
```

## Install

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "forge": {
      "command": "npx",
      "args": ["-y", "forge-mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "your-anthropic-key"
      }
    }
  }
}
```

Restart Claude Desktop. Then describe anything you want built.

## Tools

| Tool | What it does |
|---|---|
| `forge_ship` | Description → working app (one shot) |
| `forge_describe` | Description → Forge spec (inspect before building) |
| `forge_build` | Forge spec → implementation |
| `forge_verify` | Spec + implementation → pass/fail report |

## Requirements

- Node.js 18+
- `ANTHROPIC_API_KEY` environment variable

## License

MIT
