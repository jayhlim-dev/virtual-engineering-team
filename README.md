# Virtual Engineering Team

You get four specialists on your Mac:

- **Morgan** — Project Manager
- **Elena** — UI/UX
- **Kai** — Software Engineer
- **Sam** — QA
- **Karen** — Chief Quality Judge

They work in Cursor. They read your real project. They edit real files. They run real commands.

This is not a chatbot skit.

## 1. Put the team on this Mac

In Terminal:

```bash
cd ~/Documents/virtual-engineering-team
node bin/vet.js install-agents
```

That copies the four agents into `~/.cursor/agents`.

Open this folder in Cursor if it is not already open.

## 2. Give them a job

Type a normal request. Talk to Morgan.

Examples:

- `Morgan, fix the typo on the settings page.`
- `Have the team add a category filter to the shop.`
- `Onboard this repo, then plan a login screen.`

Morgan will:

1. Look at the project
2. Make a task
3. Call Elena, Kai, and Sam when needed
4. Give you a short report

You can also name a specialist:

- `Elena, spec the empty state.`
- `Kai, implement VET-001.`
- `Sam, test VET-001. Do not trust Kai.`

## 3. Use them on another project

Go **into the project folder**. Do not run this from `~`.

```bash
cd /path/to/your-project
node ~/Documents/virtual-engineering-team/bin/vet.js onboard .
```

You can also pass the path:

```bash
node ~/Documents/virtual-engineering-team/bin/vet.js onboard /path/to/your-project
```

That adds `.agent-team/` inside **that** project.

`onboard` also appends a marked block to that project's `.gitignore` so team files stay local and are not committed. Run `onboard` again after HQ updates; it will not duplicate the block. Use `--track-team` if you want team files in git.

Then **open that project in Cursor** (File → Open Folder). Ask Morgan to inspect it and do the work.

If Cursor is still in home or in the team HQ folder, the agents cannot see your app.

## 4. Task board

```bash
node bin/vet.js board
node bin/vet.js validate
node bin/vet.js task new --title "Add filters" --size standard --request "Filter products by category"
```

Statuses: `draft` → `planned` → `in_progress` → `qa` → `quality_review` → `done`

A task cannot be `done` until Sam records `PASS` or `PASS_WITH_WARNINGS` and the acceptance checks have evidence.

Standard and complex tasks also wait for Karen. She scores the work from 0 to 10.

| Score | Her decision |
| --- | --- |
| Under 7 | REJECT |
| 7 to 8.9 | CONDITIONAL |
| 9 to 9.9 | APPROVE |
| 10 | EXCEPTIONAL |

Only APPROVE and EXCEPTIONAL can finish the task, and the release must be READY. Quick tasks skip her unless you ask.

Ask her directly: `Karen, review VET-002.`

Or record a judgment:

```bash
node bin/vet.js review --task VET-002 --decision APPROVE --score 9.2 --release READY --summary "Criteria and failure tests hold."
```

If she rejects it, the task returns to `needs_fix`. Fix it, have Sam retest, then ask Karen again.

## 5. How they talk

They do not IM each other.

They use:

- Cursor subagents (isolated work)
- `.agent-team/handoffs/*.json`
- `.agent-team/tasks/*.json`

Required handoff fields: task id, from, to, objective, findings, files, decisions, constraints, deliverable, criteria, open questions.

## 6. What they may do alone

Routine, reversible work: read code, edit files, run tests, write reports.

## 7. What needs you

- Destroying git history or user work
- Deploy / publish
- Paid services
- Data-destroying migrations
- Exposing private data
- Bigger scope than you asked for

Cursor's own permission popups are the real stop signs.

## 8. Demo

`demo/` is a tiny shop with category filters.

```bash
npm test
```

Open `demo/index.html` in a browser to see the page.

The first real team task is `VET-001` in `.agent-team/`.

## 9. Limits

- Subagents start with a blank memory. Morgan must pass context.
- They are not a daemon. They work when you chat.
- Browser checks happen only when Cursor browser tools work.
- User-level agents help in every project. Project memory exists only after `onboard`.
- This CLI cannot force an agent to obey. Cursor loads the prompts. The status machine only protects the board files.
