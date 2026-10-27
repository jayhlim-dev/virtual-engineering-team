import fs from "node:fs";
import path from "node:path";

export const VET_GITIGNORE_MARKER = "# Virtual Engineering Team (local — added by vet onboard)";

export const VET_GITIGNORE_LINES = [
  ".agent-team/",
  ".cursor/agents/morgan.md",
  ".cursor/agents/elena.md",
  ".cursor/agents/kai.md",
  ".cursor/agents/sam.md",
  ".cursor/agents/karen.md",
  ".cursor/rules/00-morgan-orchestrator.mdc",
  ".cursor/rules/01-safety.mdc",
  ".cursor/rules/02-handoffs.mdc",
  ".cursor/rules/03-voice-identity.mdc",
  ".cursor/skills/virtual-engineering-team/",
  ".cursor/skills/onboard-project/",
];

export function vetGitignoreBlock() {
  return `${VET_GITIGNORE_MARKER}\n${VET_GITIGNORE_LINES.join("\n")}\n`;
}

export function ensureVetGitignore(projectRoot, { skip = false } = {}) {
  if (skip) {
    return { updated: false, path: null, reason: "skipped" };
  }

  const gitignorePath = path.join(projectRoot, ".gitignore");
  let content = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, "utf8") : "";

  if (content.includes(VET_GITIGNORE_MARKER)) {
    const present = new Set(content.split("\n"));
    const missing = VET_GITIGNORE_LINES.filter((line) => !present.has(line));
    if (!missing.length) {
      return { updated: false, path: gitignorePath, reason: "already_present" };
    }
    const next = `${content.endsWith("\n") ? content : `${content}\n`}${missing.join("\n")}\n`;
    fs.writeFileSync(gitignorePath, next);
    return { updated: true, path: gitignorePath, reason: "updated" };
  }

  const block = vetGitignoreBlock();
  if (content.length > 0 && !content.endsWith("\n")) {
    content += "\n";
  }
  if (content.length > 0) {
    content += "\n";
  }
  content += block;

  fs.writeFileSync(gitignorePath, content);
  return { updated: true, path: gitignorePath, reason: "appended" };
}
