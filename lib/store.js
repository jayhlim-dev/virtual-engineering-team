import fs from "node:fs";
import path from "node:path";
import { boardPath, handoffsDir, reportsDir, taskFile, tasksDir, teamDir } from "./paths.js";
import { validateBoard, validateHandoff, validateReport, validateTask, validateTransition } from "./validate.js";
import { APPROVING_DECISIONS, PASSING_VERDICTS } from "./constants.js";
import { requiresKaren, validateKarenReview } from "./karen.js";

function now() {
  return new Date().toISOString();
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

export function emptyBoard(projectName) {
  return {
    version: 1,
    project: projectName,
    updated_at: now(),
    next_id: 1,
    tasks: [],
  };
}

export function loadBoard(root) {
  const file = boardPath(root);
  if (!fs.existsSync(file)) {
    throw new Error(`No task board at ${file}. Run: node bin/vet.js init`);
  }
  return readJson(file);
}

export function loadTasks(root, board) {
  const tasks = {};
  for (const entry of board.tasks) {
    const file = taskFile(root, entry.id);
    if (fs.existsSync(file)) {
      tasks[entry.id] = readJson(file);
    }
  }
  return tasks;
}

export function saveBoard(root, board) {
  board.updated_at = now();
  writeJson(boardPath(root), board);
}

export function saveTask(root, task) {
  task.updated_at = now();
  writeJson(taskFile(root, task.id), task);
}

export function nextTaskId(board) {
  const id = `VET-${String(board.next_id).padStart(3, "0")}`;
  board.next_id += 1;
  return id;
}

export function createTask(root, input) {
  const board = loadBoard(root);
  const id = nextTaskId(board);
  const timestamp = now();
  const task = {
    id,
    title: input.title,
    size: input.size || "standard",
    status: "draft",
    owner: input.owner || "morgan",
    created_at: timestamp,
    updated_at: timestamp,
    request: input.request || input.title,
    requirements: input.requirements || [],
    assumptions: input.assumptions || [],
    non_goals: input.non_goals || [],
    acceptance_criteria: input.acceptance_criteria || [
      {
        id: "AC-1",
        text: "Requested outcome is implemented and independently verified.",
        verified: false,
        evidence: "",
      },
    ],
    dependencies: input.dependencies || [],
    files_claimed: input.files_claimed || [],
    evidence: [],
    defects: [],
    qa_verdict: null,
    quality_gate: input.quality_gate || ((input.size || "standard") === "quick" ? "waived" : "required"),
    karen_decision: null,
    karen_score: null,
    release_readiness: null,
    karen_reviews: [],
    blocked_reason: "",
    specialists: {
      elena: input.size === "quick" ? "skipped" : "pending",
      kai: "pending",
      sam: "pending",
      karen: (input.size || "standard") === "quick" ? "skipped" : "pending",
    },
  };

  const errors = validateTask(task);
  if (errors.length) {
    throw new Error(errors.join("\n"));
  }

  board.tasks.push({
    id,
    title: task.title,
    status: task.status,
    owner: task.owner,
    size: task.size,
  });
  saveTask(root, task);
  saveBoard(root, board);
  return task;
}

export function updateTask(root, id, patch) {
  const board = loadBoard(root);
  const tasks = loadTasks(root, board);
  const task = tasks[id];
  if (!task) {
    throw new Error(`Unknown task ${id}`);
  }

  if (patch.status && patch.status !== task.status) {
    const transitionErrors = validateTransition(task.status, patch.status);
    if (transitionErrors.length) {
      throw new Error(transitionErrors.join("\n"));
    }
    if (patch.status === "done") {
      const verdict = patch.qa_verdict || task.qa_verdict;
      if (!PASSING_VERDICTS.includes(verdict)) {
        throw new Error("done requires qa_verdict PASS or PASS_WITH_WARNINGS");
      }
      const gate = patch.quality_gate || task.quality_gate;
      const decision = patch.karen_decision || task.karen_decision;
      const release = patch.release_readiness || task.release_readiness;
      if (gate === "required" && task.status !== "quality_review") {
        throw new Error("standard work must enter quality_review before done");
      }
      if (requiresKaren({ ...task, ...patch, quality_gate: gate }) && !APPROVING_DECISIONS.includes(decision)) {
        throw new Error("done requires Karen decision APPROVE or EXCEPTIONAL");
      }
      if (requiresKaren({ quality_gate: gate }) && release !== "READY") {
        throw new Error("done requires release_readiness READY");
      }
    }
  }

  Object.assign(task, patch);
  const errors = validateTask(task);
  if (errors.length) {
    throw new Error(errors.join("\n"));
  }

  const entry = board.tasks.find((item) => item.id === id);
  entry.title = task.title;
  entry.status = task.status;
  entry.owner = task.owner;
  entry.size = task.size;

  const boardErrors = validateBoard(board, { ...tasks, [id]: task });
  if (boardErrors.length) {
    throw new Error(boardErrors.join("\n"));
  }

  saveTask(root, task);
  saveBoard(root, board);
  return task;
}

export function recordKarenReview(root, id, review) {
  const errors = validateKarenReview(review);
  if (errors.length) throw new Error(errors.join("\n"));

  const board = loadBoard(root);
  const task = loadTasks(root, board)[id];
  if (!task) throw new Error(`Unknown task ${id}`);
  if (!["qa", "quality_review"].includes(task.status)) {
    throw new Error("Karen reviews a task only from qa or quality_review");
  }
  if (task.quality_gate === "waived") {
    throw new Error("quality gate is waived for this task");
  }

  const entry = {
    ...review,
    reviewed_at: now(),
  };
  const karen_reviews = [...(task.karen_reviews || []), entry];
  const patch = {
    status: "quality_review",
    owner: "karen",
    karen_decision: review.decision,
    karen_score: review.decision === "BLOCKED" ? null : review.score,
    release_readiness: review.release_readiness,
    karen_reviews,
    specialists: { ...task.specialists, karen: review.decision },
  };

  if (["REJECT", "CONDITIONAL"].includes(review.decision)) {
    patch.status = "needs_fix";
    patch.owner = review.return_to || "morgan";
  } else if (review.decision === "BLOCKED") {
    patch.status = "blocked";
    patch.owner = "karen";
    patch.blocked_reason = review.summary;
  }

  if (task.status === "qa" && patch.status !== "quality_review") {
    updateTask(root, id, { status: "quality_review", owner: "karen" });
  }
  const reviewed = updateTask(root, id, patch);
  const criteriaVerified = (reviewed.acceptance_criteria || []).every((item) => item.verified);
  if (
    APPROVING_DECISIONS.includes(reviewed.karen_decision) &&
    reviewed.release_readiness === "READY" &&
    PASSING_VERDICTS.includes(reviewed.qa_verdict) &&
    criteriaVerified
  ) {
    return updateTask(root, id, { status: "done", owner: "morgan" });
  }
  return reviewed;
}

export function saveHandoff(root, handoff) {
  const errors = validateHandoff(handoff);
  if (errors.length) {
    throw new Error(errors.join("\n"));
  }
  const stamp = now().replace(/[:.]/g, "-");
  const file = path.join(
    handoffsDir(root),
    `${handoff.task_id}-${handoff.sender}-to-${handoff.recipient}-${stamp}.json`
  );
  writeJson(file, { ...handoff, created_at: now() });
  return file;
}

export function saveReport(root, report) {
  const errors = validateReport(report);
  if (errors.length) {
    throw new Error(errors.join("\n"));
  }
  const file = path.join(reportsDir(root), `${report.task_id}.json`);
  writeJson(file, { ...report, created_at: now() });
  return file;
}

export function collectValidation(root) {
  const board = loadBoard(root);
  const tasks = loadTasks(root, board);
  const errors = validateBoard(board, tasks);

  const handoffRoot = handoffsDir(root);
  if (fs.existsSync(handoffRoot)) {
    for (const name of fs.readdirSync(handoffRoot).filter((file) => file.endsWith(".json"))) {
      const handoff = readJson(path.join(handoffRoot, name));
      errors.push(...validateHandoff(handoff, { path: name }));
    }
  }

  const reportRoot = reportsDir(root);
  if (fs.existsSync(reportRoot)) {
    for (const name of fs.readdirSync(reportRoot).filter((file) => file.endsWith(".json"))) {
      const report = readJson(path.join(reportRoot, name));
      errors.push(...validateReport(report, { path: name }));
    }
  }

  return { board, tasks, errors };
}

export function ensureTeamLayout(root, projectName) {
  const dirs = [
    teamDir(root),
    tasksDir(root),
    handoffsDir(root),
    reportsDir(root),
    path.join(teamDir(root), "agents"),
  ];
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(boardPath(root))) {
    writeJson(boardPath(root), emptyBoard(projectName));
  }
}
