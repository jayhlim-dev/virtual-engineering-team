import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const hq = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vet = path.join(hq, "bin/vet.js");

function run(cwd, args) {
  return execFileSync("node", [vet, ...args], { cwd, encoding: "utf8" });
}

test("onboard refuses the home folder", () => {
  assert.throws(
    () => run(os.homedir(), ["onboard", os.homedir(), "--skip-cursor"]),
    /home folder/
  );
});

test("onboard + task lifecycle validates", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vet-cli-"));
  run(root, ["onboard", root, "--skip-cursor"]);
  const id = run(root, ["task", "new", "--title", "Add filter", "--size", "standard", "--request", "Filter products"]).trim();
  assert.equal(id, "VET-001");
  run(root, ["task", "update", id, "--status", "planned", "--owner", "elena"]);
  run(root, ["task", "update", id, "--status", "in_progress", "--owner", "kai", "--claim", "demo/app.js"]);
  run(root, ["task", "update", id, "--status", "qa", "--owner", "sam"]);
  run(root, [
    "task",
    "update",
    id,
    "--verdict",
    "PASS",
    "--verify-ac",
    "AC-1",
    "--evidence",
    "node --test demo/catalog.test.js",
  ]);
  const reviewed = run(root, [
    "review",
    "--task",
    id,
    "--decision",
    "APPROVE",
    "--score",
    "9.2",
    "--release",
    "READY",
    "--summary",
    "The criterion is verified and no blocker remains.",
  ]);
  assert.match(reviewed, /done/);
  const out = run(root, ["validate"]);
  assert.match(out, /VALID/);
});
