# Forge

**Describe it. Forge it.**

Forge translates human ideas into working software. No code required — just describe your problem or need in plain English.

> "It's hard to find the cheapest car rental" → working web app, instantly

---

## How it works

```
You: "I need a shopping list that tracks my budget"
         ↓
   Forge understands what you need
   Forge builds it
         ↓
Working app — ready to use
```

The translation layer (spec, compilation) is invisible. You describe; Forge creates.

---

## Use it

### Option 1 — Web app (no setup)
Visit **[forge.app](https://forge.app)** *(coming soon — deploy your own below)*

Enter your Anthropic API key once, then describe anything you want built.

### Option 2 — Claude Desktop (MCP)

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "forge": {
      "command": "npx",
      "args": ["-y", "@forge-ai/mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "your-key-here"
      }
    }
  }
}
```

Restart Claude Desktop. Then just describe what you need — Claude will use Forge automatically.

### Option 3 — CLI

```bash
cd cli
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...

python forge.py new "I need a budget tracker"
python forge.py build budget_tracker.intent
python forge.py test budget_tracker.intent
```

---

## Deploy your own

### One-click on Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. Fork this repo
2. Click the button above
3. Set `ANTHROPIC_API_KEY` in Render dashboard (optional — users can bring their own)
4. Share your URL

### Manual deploy

```bash
git clone https://github.com/your-username/forge
cd forge/web
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...
gunicorn app:app --worker-class=gevent --bind=0.0.0.0:5001
```

---

## What Forge actually does

Traditional AI coding asks the AI to simultaneously figure out *what* you need and *how* to build it. That's where misunderstandings happen.

Forge separates them:

1. **Translate** — your description becomes a plain-English specification. You can read and edit it.
2. **Build** — the specification becomes working software. Guaranteed to match what you approved.
3. **Verify** — examples from the spec run as automatic tests.

The specification is the contract. If the spec is right, the software is right.

---

## The philosophy

Forge is not a programming language. It's a creation system.

The internal translation layers (the Forge spec format, the Axon execution layer) are Forge's organs — useful to understand, never necessary to touch.

What matters: you described something. Forge built it.

---

## Project structure

```
forge/
  web/       Flask web UI — the browser interface
  mcp/       MCP server — connects Forge to any AI tool
  cli/       Command-line interface — for developers
  examples/  Sample .intent specs and generated apps
```

---

## Roadmap

- [ ] Publish `@forge-ai/mcp` to npm
- [ ] Hosted web app at forge.app
- [ ] Axon runtime — the AI-native execution layer
- [ ] Iterative refinement ("change X in my app")
- [ ] App gallery — share what you've forged

---

## License

MIT
