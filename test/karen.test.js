import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { decisionForScore, scoreDimensions, validateKarenReview } from "../lib/karen.js";
import { createTask, ensureTeamLayout, recordKarenReview, updateTask } from "../lib/store.js";

test("score bands match the rubric", () => {
  assert.equal(decisionForScore(5.8), "REJECT");
  assert.equal(decisionForScore(8), "CONDITIONAL");
  assert.equal(decisionForScore(9.2), "APPROVE");
  assert.equal(decisionForScore(10), "EXCEPTIONAL");
});

test("weights redistribute when UX is N/A", () => {
  const scored = scoreDimensions({
    requirements: 10,
    technical: 10,
    verification: 10,
    ux: "N/A",
    security: 10,
    documentation: 10,
  });
  assert.equal(scored.score, 10);
  assert.deepEqual(scored.excluded, ["ux"]);
});

test("approval cannot hide a blocker or a low score", () => {
  assert.ok(
    validateKarenReview({
      decision: "APPROVE",
      score: 9.2,
      release_readiness: "READY",
      summary: "Looks fine",
      blockers: ["broken core requirement"],
    }).some((error) => error.includes("blockers"))
  );
  assert.ok(
    validateKarenReview({
      decision: "APPROVE",
      score: 8,
      release_readiness: "READY",
      summary: "Looks fine",
    }).some((error) => error.includes("maps to"))
  );
});

test("conditional review returns the task for correction", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vet-karen-"));
  ensureTeamLayout(root, "fixture");
  const task = createTask(root, { title: "Add filter", request: "Add filter" });
  updateTask(root, task.id, { status: "planned" });
  updateTask(root, task.id, { status: "in_progress", owner: "kai" });
  updateTask(root, task.id, { status: "qa", owner: "sam", qa_verdict: "PASS" });
  const reviewed = recordKarenReview(root, task.id, {
    decision: "CONDITIONAL",
    score: 7.7,
    release_readiness: "NOT_READY",
    summary: "Failure path is untested.",
    required_corrections: ["Kai: add a failing-response test"],
    return_to: "kai",
  });
  assert.equal(reviewed.status, "needs_fix");
  assert.equal(reviewed.owner, "kai");
  assert.equal(reviewed.karen_reviews.length, 1);
});
