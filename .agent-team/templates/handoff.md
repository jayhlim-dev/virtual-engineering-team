# Handoff template

Create JSON with:

```json
{
  "task_id": "VET-001",
  "sender": "elena",
  "recipient": "kai",
  "objective": "",
  "findings": [],
  "files": [],
  "decisions": [],
  "constraints": [],
  "expected_deliverable": "",
  "acceptance_criteria": [],
  "unresolved_questions": [],
  "verification_evidence": []
}
```

Or run:

`node bin/vet.js handoff --task VET-001 --from elena --to kai --objective "..." --findings "..." --files "..." --criteria "..."`

Separate list items with `||`.
