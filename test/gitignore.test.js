import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { ensureVetGitignore, VET_GITIGNORE_MARKER } from "../lib/gitignore.js";

test("ensureVetGitignore appends block once", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vet-gitignore-"));
  const first = ensureVetGitignore(root);
  assert.equal(first.updated, true);
  const text = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
  assert.ok(text.includes(VET_GITIGNORE_MARKER));
  assert.ok(text.includes(".agent-team/"));

  const second = ensureVetGitignore(root);
  assert.equal(second.updated, false);
  assert.equal(second.reason, "already_present");
});

test("ensureVetGitignore can be skipped", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vet-gitignore-skip-"));
  const result = ensureVetGitignore(root, { skip: true });
  assert.equal(result.updated, false);
  assert.equal(fs.existsSync(path.join(root, ".gitignore")), false);
});
