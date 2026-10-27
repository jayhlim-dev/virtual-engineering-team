# Decisions: virtual-engineering-team

| Date | Decision | Why | Task |
| --- | --- | --- | --- |
| 2026-10-27 | Use Cursor subagents + files + a Node CLI. No framework, server, or dashboard. | Cursor already runs agents, edits files, and executes commands. Extra infrastructure would not add a real capability. | bootstrap |
| 2026-10-27 | Parent agent is Morgan. Elena, Kai, and Sam are subagents. | The spec forbids a fifth specialist. Orchestration is the PM role. | bootstrap |
| 2026-10-27 | JavaScript, zero npm dependencies. | The founder asked for JS unless TS is requested. Built-in `node:test` is enough to test the board. | bootstrap |
| 2026-10-27 | `done` requires Sam's PASS or PASS_WITH_WARNINGS plus verified criteria. | Prevents marking work complete on the implementer's word. | bootstrap |
| 2026-10-27 | Active tasks cannot share `files_claimed`. | Stops two specialists from editing the same file without coordination. | bootstrap |
| 2026-10-27 | Karen judges after Sam on standard and complex tasks. | Sam proves behavior. Karen decides whether the result is good enough. A score under 9 cannot close the task. | karen |
| 2026-10-27 | User-level install copies agents to `~/.cursor/agents`. | Specialists can then be used inside real project workspaces, not only this HQ repo. | bootstrap |
