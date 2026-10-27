import assert from "node:assert/strict";
import test from "node:test";
import {
  canTransition,
  validateBoard,
  validateHandoff,
  validateReport,
  validateTask,
  validateTransition,
} from "../lib/validate.js";

function validTask(overrides = {}) {
  return {
    id: "VET-001",
    title: "Add product filters",
    size: "standard",
    status: "planned",
    owner: "elena",
    created_at: "2026-10-27T00:00:00.000Z",
    updated_at: "2026-10-27T00:00:00.000Z",
    request: "Users must filter products by category.",
    requirements: ["Filter by category"],
    assumptions: ["Existing product data is enough"],
    non_goals: ["Search"],
    acceptance_criteria: [
      {
        id: "AC-1",
        text: "Choosing a category shows only matching products.",
        verified: false,
        evidence: "",
      },
    ],
    files_claimed: ["demo/app.js"],
    evidence: [],
    qa_verdict: null,
    blocked_reason: "",
    ...overrides,
  };
}

test("valid task passes", () => {
  assert.deepEqual(validateTask(validTask()), []);
});

test("done requires verified criteria and a passing QA verdict", () => {
  const errors = validateTask(
    validTask({
      status: "done",
      qa_verdict: "PASS",
    })
  );
  assert.ok(errors.some((item) => item.includes("unverified")));
});

test("verified criteria without evidence fail", () => {
  const errors = validateTask(
    validTask({
      acceptance_criteria: [
        { id: "AC-1", text: "Works", verified: true, evidence: "" },
      ],
    })
  );
  assert.ok(errors.some((item) => item.includes("evidence")));
});

test("handoff requires sender, recipient, and objective", () => {
  const errors = validateHandoff({
    task_id: "VET-001",
    sender: "elena",
    recipient: "kai",
    objective: "Implement the filter spec",
    findings: ["Current list has no filter control"],
    files: ["demo/app.js"],
    decisions: ["Use a native select"],
    constraints: ["Do not redesign the page"],
    expected_deliverable: "Working category filter",
    acceptance_criteria: ["Empty state when no matches"],
    unresolved_questions: [],
  });
  assert.deepEqual(errors, []);
});

test("handoff rejects same sender and recipient", () => {
  const errors = validateHandoff({
    task_id: "VET-001",
    sender: "kai",
    recipient: "kai",
    objective: "x",
    findings: [],
    files: [],
    decisions: [],
    constraints: [],
    expected_deliverable: "x",
    acceptance_criteria: [],
    unresolved_questions: [],
  });
  assert.ok(errors.some((item) => item.includes("different")));
});

test("board detects overlapping file claims on active tasks", () => {
  const one = validTask({ id: "VET-001", status: "in_progress", owner: "kai" });
  const two = validTask({ id: "VET-002", status: "in_progress", owner: "elena" });
  const errors = validateBoard(
    {
      version: 1,
      tasks: [
        { id: "VET-001", status: "in_progress", owner: "kai" },
        { id: "VET-002", status: "in_progress", owner: "elena" },
      ],
    },
    { "VET-001": one, "VET-002": two }
  );
  assert.ok(errors.some((item) => item.includes("claimed by both")));
});

test("inactive tasks may mention the same files", () => {
  const one = validTask({ id: "VET-001", status: "done", owner: "morgan", qa_verdict: "PASS", acceptance_criteria: [{ id: "AC-1", text: "Works", verified: true, evidence: "manual check" }] });
  const two = validTask({ id: "VET-002", status: "planned", owner: "kai" });
  const errors = validateBoard(
    {
      version: 1,
      tasks: [
        { id: "VET-001", status: "done", owner: "morgan" },
        { id: "VET-002", status: "planned", owner: "kai" },
      ],
    },
    { "VET-001": one, "VET-002": two }
  );
  assert.deepEqual(errors, []);
});

test("illegal transitions are rejected", () => {
  assert.equal(canTransition("draft", "done"), false);
  assert.deepEqual(validateTransition("qa", "done"), []);
  assert.ok(validateTransition("done", "in_progress").length > 0);
});

test("report requires a QA verdict", () => {
  const errors = validateReport({
    task_id: "VET-001",
    summary: "Filter added",
    files_changed: [{ path: "demo/app.js", purpose: "filter logic" }],
    quality_verification: [{ command: "npm test", result: "pass" }],
    qa_verdict: "PASS",
    risks: [],
    decisions_needed: [],
  });
  assert.deepEqual(errors, []);
  assert.ok(validateReport({}).some((item) => item.includes("qa_verdict")));
});
