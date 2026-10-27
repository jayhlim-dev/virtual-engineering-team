# Architecture: virtual-engineering-team

Status: verified from the files in this repo.

## What actually runs

1. **Parent Cursor agent = Morgan** via `.cursor/rules/00-morgan-orchestrator.mdc`.
2. **Specialist subagents** in `.cursor/agents/`:
   - `morgan` for isolated planning
   - `elena` for UI/UX
   - `kai` for implementation
   - `sam` for independent QA
3. **Skills** tell Morgan when to load the workflow.
4. **`.agent-team/`** is durable memory for one project.
5. **`bin/vet.js`** is the only executable orchestration. It validates status changes, file locks, handoffs, and reports.

## What does not exist

- No background workers
- No inter-agent chat bus
- No extra LLM API
- No enforced sandbox beyond Cursor's own permission prompts

Subagents do not see prior chat. Morgan must put the task, files, and criteria in the delegate prompt.

## Data flow

Founder request -> Morgan inspects repo -> task JSON -> Elena/Kai/Sam subagents -> handoff JSON -> Sam verdict -> report JSON.

## Demo

`demo/` is a static shop. Catalog logic is in `demo/catalog.js` so Node can test it without a browser.
