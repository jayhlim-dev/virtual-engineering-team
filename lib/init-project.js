import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureVetGitignore } from "./gitignore.js";
import { ensureTeamLayout } from "./store.js";

const HQ_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function copyFile(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(src, dest);
    } else {
      copyFile(src, dest);
    }
  }
}

export function copyCursorIntegration(targetRoot) {
  copyDir(path.join(HQ_ROOT, ".cursor", "agents"), path.join(targetRoot, ".cursor", "agents"));
  copyDir(path.join(HQ_ROOT, ".cursor", "rules"), path.join(targetRoot, ".cursor", "rules"));
  copyDir(path.join(HQ_ROOT, ".cursor", "skills"), path.join(targetRoot, ".cursor", "skills"));
}

export function copyAgentPrompts(targetRoot) {
  copyDir(path.join(HQ_ROOT, ".agent-team", "agents"), path.join(targetRoot, ".agent-team", "agents"));
  const files = ["TEAM_RULES.md", "README.md"];
  for (const name of files) {
    const src = path.join(HQ_ROOT, ".agent-team", name);
    if (fs.existsSync(src)) {
      copyFile(src, path.join(targetRoot, ".agent-team", name));
    }
  }
}

export function writeStarterDocs(targetRoot, projectName) {
  const team = path.join(targetRoot, ".agent-team");
  const context = path.join(team, "PROJECT_CONTEXT.md");
  const architecture = path.join(team, "ARCHITECTURE.md");
  const decisions = path.join(team, "DECISIONS.md");

  if (!fs.existsSync(context)) {
    fs.writeFileSync(
      context,
      `# Project context: ${projectName}\n\nStatus: not yet onboarded.\n\nInspect the real repository before planning work. Record only verified facts.\n\n## Product\n\nUnknown.\n\n## Stack\n\nUnknown.\n\n## Conventions\n\nUnknown.\n\n## Constraints\n\nUnknown.\n`
    );
  }
  if (!fs.existsSync(architecture)) {
    fs.writeFileSync(
      architecture,
      `# Architecture: ${projectName}\n\nStatus: not yet inspected.\n\nDo not invent modules, APIs, or data stores.\n\n## Verified findings\n\n- None yet.\n\n## Unknowns\n\n- Entry points\n- Data flow\n- Test command\n`
    );
  }
  if (!fs.existsSync(decisions)) {
    fs.writeFileSync(
      decisions,
      `# Decisions: ${projectName}\n\nRecord only decisions that affect future work.\n\n| Date | Decision | Why | Task |\n| --- | --- | --- | --- |\n`
    );
  }
}

export function assertProjectRoot(targetRoot) {
  const resolved = path.resolve(targetRoot);
  const home = process.env.HOME ? path.resolve(process.env.HOME) : "";
  if (home && resolved === home) {
    throw new Error(
      "Refusing to onboard your home folder.\n" +
        "cd into the project first, then run:\n" +
        "  node ~/Documents/virtual-engineering-team/bin/vet.js onboard .\n" +
        "Or pass the project path:\n" +
        "  node ~/Documents/virtual-engineering-team/bin/vet.js onboard /full/path/to/project"
    );
  }
  return resolved;
}

export function onboardProject(targetRoot, { installCursor = true, trackInGit = false } = {}) {
  const resolved = assertProjectRoot(targetRoot);
  const projectName = path.basename(resolved);
  const isHq = resolved === HQ_ROOT;

  ensureTeamLayout(resolved, projectName);
  copyAgentPrompts(resolved);
  writeStarterDocs(resolved, projectName);
  if (installCursor) {
    copyCursorIntegration(resolved);
  }

  const gitignore = ensureVetGitignore(resolved, {
    skip: isHq || trackInGit,
  });

  return {
    root: resolved,
    projectName,
    teamDir: path.join(resolved, ".agent-team"),
    gitignore,
  };
}

export function installUserAgents() {
  const homeAgents = path.join(process.env.HOME || "", ".cursor", "agents");
  if (!process.env.HOME) {
    throw new Error("HOME is not set; cannot install user-level agents.");
  }
  copyDir(path.join(HQ_ROOT, ".cursor", "agents"), homeAgents);
  return homeAgents;
}

export { HQ_ROOT };
