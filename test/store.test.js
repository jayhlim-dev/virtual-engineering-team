import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createTask, ensureTeamLayout, loadBoard, saveHandoff, updateTask } from "../lib/store.js";

function tempProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vet-"));
  ensureTeamLayout(root, "fixture");
  return root;
}

test("createTask assigns VET ids and starts in draft", () => {
  const root = tempProject();
  const task = createTask(root, { title: "Fix spacing", size: "quick", request: "Tighten header gap" });
  assert.equal(task.id, "VET-001");
  assert.equal(task.status, "draft");
  assert.equal(loadBoard(root).next_id, 2);
});

test("updateTask blocks done without QA", () => {
  const root = tempProject();
  const task = createTask(root, { title: "Add filter", request: "Add filter" });
  updateTask(root, task.id, { status: "planned" });
  updateTask(root, task.id, { status: "in_progress", owner: "kai" });
  updateTask(root, task.id, { status: "qa", owner: "sam" });
  assert.throws(() => updateTask(root, task.id, { status: "done" }), /qa_verdict/);
});

test("standard work cannot skip Karen", () => {
  const root = tempProject();
  const task = createTask(root, { title: "Add filter", request: "Add filter" });
  updateTask(root, task.id, { status: "planned" });
  updateTask(root, task.id, { status: "in_progress", owner: "kai" });
  updateTask(root, task.id, { status: "qa", owner: "sam" });
  assert.throws(
    () =>
      updateTask(root, task.id, {
        status: "done",
        owner: "morgan",
        qa_verdict: "PASS",
        acceptance_criteria: [
          {
            id: "AC-1",
            text: "Requested outcome is implemented and independently verified.",
            verified: true,
            evidence: "node --test",
          },
        ],
      }),
    /quality_review/
  );
});

test("file claim conflicts are rejected", () => {
  const root = tempProject();
  const first = createTask(root, { title: "One", request: "One", files_claimed: ["demo/app.js"] });
  const second = createTask(root, { title: "Two", request: "Two", files_claimed: ["demo/app.js"] });
  updateTask(root, first.id, { status: "planned" });
  updateTask(root, first.id, { status: "in_progress", owner: "kai" });
  updateTask(root, second.id, { status: "planned" });
  assert.throws(
    () => updateTask(root, second.id, { status: "in_progress", owner: "elena" }),
    /claimed by both/
  );
});

test("handoff writer rejects incomplete records", () => {
  const root = tempProject();
  assert.throws(() => saveHandoff(root, { task_id: "VET-001" }), /required/);
});
