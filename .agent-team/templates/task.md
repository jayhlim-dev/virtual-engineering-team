# Task template

Use JSON in `.agent-team/tasks/VET-XXX.json`. This markdown is the human map.

Required fields:

- id, title, size (`quick` | `standard` | `complex`)
- status, owner
- request, requirements, assumptions, non_goals
- acceptance_criteria[] with id, text, verified, evidence
- files_claimed[]
- qa_verdict
- blocked_reason
