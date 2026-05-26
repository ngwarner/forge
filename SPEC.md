# The Forge Specification
**Version 0.1**

Forge is a human-AI creation protocol. It defines a common language between what humans need and what AI builds — ensuring both sides agree before anything is created.

This document specifies the format so any AI, tool, or developer can implement Forge-compatible software.

---

## The Core Loop

```
Human describes a need (natural language)
        ↓
Forge translates it into a spec (structured, readable)
        ↓
Human reviews and approves the spec
        ↓
Forge builds from the spec (code, app, or script)
        ↓
Spec examples run as automatic verification
```

The spec is the contract. If the spec is right, the output is right.

---

## The .intent Format

A `.intent` file is a plain-text specification. It captures what something must do without specifying how.

### Structure

```
define <ComponentName>
  purpose: one sentence describing what this component does for the human
  input:
    field_name: TypeName
  output:
    field_name: TypeName
  requires:
    - precondition in plain English
  ensures:
    - postcondition the implementation MUST guarantee
  effects: [list, of, permitted, side, effects]
  example:
    given:   concrete input values
    returns: concrete output values
```

### Rules

- A `.intent` file contains one or more `define` blocks
- `purpose` is one sentence in plain English — never technical jargon
- `requires` states what the implementation may assume (preconditions)
- `ensures` states what the implementation must guarantee (postconditions)
- `effects` declares every side effect permitted — nothing outside this list is allowed
- `example` blocks are executable — they define test cases, not documentation
- Everything is plain English. No code in `.intent` files.

### Permitted Effects

| Effect | Meaning |
|---|---|
| `device.geolocation` | Read the device's physical location |
| `http.get` | Make outbound HTTP GET requests |
| `http.post` | Make outbound HTTP POST requests |
| `external.api` | Call any third-party API |
| `dom.write` | Modify the browser UI |
| `db.read` | Read from a database |
| `db.write` | Write to a database |
| `file.read` | Read from the filesystem |
| `file.write` | Write to the filesystem |
| `email.send` | Send email |
| `slack.read` | Read Slack messages |
| `slack.write` | Send Slack messages |

An implementation that performs an effect not listed in `effects` violates the spec.

### Example

```
define FindCheapFlight
  purpose: Help the user compare flight prices across major booking sites

  input:
    origin:      AirportCode
    destination: AirportCode
    depart_date: Date
    return_date: Date

  output:
    links: [BookingURL] where |links| >= 4

  requires:
    - return_date is after depart_date

  ensures:
    - opens Kayak, Google Flights, Expedia, and Skyscanner
    - each link is pre-filled with the trip details
    - if return_date is missing: searches one-way only

  effects: [dom.write]

  example:
    given:   origin = "JFK", destination = "LAX", depart_date = "2026-07-01"
    returns: 4 booking site links opened, all pre-filled with JFK→LAX on July 1
```

---

## The Axon Execution Layer

Axon is the AI-generated implementation language — the layer between the `.intent` spec and compiled output. It is designed for AI to generate reliably, not for humans to write.

**Axon files use the `.ax` extension.**

### Design Principles

- **Explicit effects** — every side effect is declared in the function signature and enforced by the language. It is impossible to perform an undeclared effect.
- **Total functions** — every function handles every possible input. No unhandled exceptions, no undefined behavior.
- **One canonical form** — there is one correct way to express each concept. No style decisions, no idioms, no ambiguity.
- **Refinement types** — types carry constraints: `Int where self > 0`, `Text where not_empty`.
- **No implicit behavior** — no implicit imports, no implicit coercions, no hidden state.

### Basic Syntax

```
// Type definitions
type Location = {
  lat: Float where -90.0 <= self <= 90.0
  lon: Float where -180.0 <= self <= 180.0
}

type WeatherCondition = Clear | Cloudy | Rain | Snow | Storm

// Function with effect annotation
fn fetch_weather
  :: Location →[http.get] Weather | ServiceUnavailable

// Pattern matching (exhaustive — all cases required)
fn describe_condition :: WeatherCondition → Text
  match condition {
    Clear   → "Clear skies"
    Cloudy  → "Overcast"
    Rain    → "Raining"
    Snow    → "Snowing"
    Storm   → "Thunderstorm"
  }
```

### The Connection to .intent

Each `.ax` function implements a `define` block from the corresponding `.intent` file:

- `ensures` clauses become type-level constraints verified at compile time
- `requires` clauses become function preconditions in the type signature
- `effects` declarations are enforced — the compiler rejects undeclared effects
- `example` blocks become test cases that must pass before the build succeeds

---

## Implementation Guide

### For AI systems

To be Forge-compatible, an AI system must:

1. Accept natural language descriptions as input
2. Produce a `.intent` spec before generating any implementation
3. Allow human review and editing of the spec
4. Generate implementations that satisfy every `ensures` clause
5. Only perform effects listed in the `effects` block
6. Verify that `example` blocks pass against the generated implementation

### For tool builders

The minimum viable Forge implementation:

```python
def forge_new(description: str) -> str:
    """Natural language → .intent spec"""
    return call_llm(SPEC_PROMPT, description)

def forge_build(spec: str) -> str:
    """Spec → implementation"""
    return call_llm(BUILD_PROMPT, spec)

def forge_verify(spec: str, implementation: str) -> str:
    """Spec + implementation → pass/fail report"""
    return call_llm(VERIFY_PROMPT, f"{spec}\n\n{implementation}")
```

See `SYSTEM_PROMPT.md` for ready-to-use prompts.

### For MCP servers

Expose these four tools:

| Tool | Input | Output |
|---|---|---|
| `forge_ship` | Natural language description | Working implementation (one shot) |
| `forge_describe` | Natural language description | `.intent` spec |
| `forge_build` | `.intent` spec | Implementation |
| `forge_verify` | Spec + implementation | Verification report |

---

## Versioning

This is Forge Spec version 0.1. Breaking changes increment the major version. The spec version is declared at the top of `.intent` files once the format stabilizes.

---

## License

The Forge specification is open. Anyone may implement it. MIT license.
