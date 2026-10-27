import fs from "node:fs";
import path from "node:path";

export function resolveTeamRoot(startDir = process.cwd()) {
  let dir = path.resolve(startDir);
  while (true) {
    if (fs.existsSync(path.join(dir, ".agent-team"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return path.resolve(startDir);
    }
    dir = parent;
  }
}

export function teamDir(root) {
  return path.join(root, ".agent-team");
}

export function boardPath(root) {
  return path.join(teamDir(root), "task-board.json");
}

export function tasksDir(root) {
  return path.join(teamDir(root), "tasks");
}

export function handoffsDir(root) {
  return path.join(teamDir(root), "handoffs");
}

export function reportsDir(root) {
  return path.join(teamDir(root), "reports");
}

export function taskFile(root, id) {
  return path.join(tasksDir(root), `${id}.json`);
}
