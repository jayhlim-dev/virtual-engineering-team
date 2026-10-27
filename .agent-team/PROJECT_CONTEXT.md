# Project context: virtual-engineering-team

Status: verified during initial build on 2026-10-27.

## Product

Headquarters for a Cursor-native engineering team. It is not a hosted app. It gives Morgan, Elena, Kai, and Sam instructions, a task board, and a tiny demo shop.

## Stack

- Node.js 18+, ESM, no npm dependencies
- Cursor project rules, subagents, and skills
- Vanilla HTML/CSS/JS demo shop

## Conventions

- JavaScript, not TypeScript
- JSON records in `.agent-team/`
- CLI: `node bin/vet.js`

## Constraints

- No custom LLM server
- No dashboard
- Coordination uses Cursor subagents plus files
- Secrets must never be stored in `.agent-team/`
