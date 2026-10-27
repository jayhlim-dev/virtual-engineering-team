import {
  ACTIVE_STATUSES,
  APPROVING_DECISIONS,
  KAREN_DECISIONS,
  OWNERS,
  PASSING_VERDICTS,
  QA_VERDICTS,
  RELEASE_READINESS,
  SEVERITIES,
  SIZES,
  STATUSES,
  TRANSITIONS,
} from "./constants.js";
import { requiresKaren } from "./karen.js";

function fail(errors, message, path = "") {
  errors.push(path ? `${path}: ${message}` : message);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDate(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function validateTask(task, { path = "task" } = {}) {
  const errors = [];
  if (!task || typeof task !== "object") {
    return [`${path}: must be an object`];
  }

  if (!/^VET-\d{3,}$/.test(task.id || "")) {
    fail(errors, "id must match VET-001 format", path);
  }
  if (!isNonEmptyString(task.title)) fail(errors, "title is required", path);
  if (!SIZES.includes(task.size)) fail(errors, `size must be one of ${SIZES.join(", ")}`, path);
  if (!STATUSES.includes(task.status)) fail(errors, `status must be one of ${STATUSES.join(", ")}`, path);
  if (!OWNERS.includes(task.owner)) fail(errors, `owner must be one of ${OWNERS.join(", ")}`, path);
  if (!isNonEmptyString(task.request)) fail(errors, "request is required", path);
  if (!Array.isArray(task.requirements)) fail(errors, "requirements must be an array", path);
  if (!Array.isArray(task.assumptions)) fail(errors, "assumptions must be an array", path);
  if (!Array.isArray(task.non_goals)) fail(errors, "non_goals must be an array", path);
  if (!Array.isArray(task.files_claimed)) fail(errors, "files_claimed must be an array", path);
  if (!Array.isArray(task.evidence)) fail(errors, "evidence must be an array", path);
  if (!isIsoDate(task.created_at)) fail(errors, "created_at must be an ISO date", path);
  if (!isIsoDate(task.updated_at)) fail(errors, "updated_at must be an ISO date", path);

  if (!Array.isArray(task.acceptance_criteria) || task.acceptance_criteria.length === 0) {
    fail(errors, "acceptance_criteria must contain at least one item", path);
  } else {
    task.acceptance_criteria.forEach((criterion, index) => {
      const cpath = `${path}.acceptance_criteria[${index}]`;
      if (!isNonEmptyString(criterion.id)) fail(errors, "id is required", cpath);
      if (!isNonEmptyString(criterion.text)) fail(errors, "text is required", cpath);
      if (typeof criterion.verified !== "boolean") fail(errors, "verified must be boolean", cpath);
      if (criterion.verified && !isNonEmptyString(criterion.evidence)) {
        fail(errors, "verified criteria need evidence", cpath);
      }
    });
  }

  if (task.qa_verdict !== undefined && !QA_VERDICTS.includes(task.qa_verdict)) {
    fail(errors, `qa_verdict must be one of ${QA_VERDICTS.filter(Boolean).join(", ")} or null`, path);
  }
  if (task.karen_decision !== undefined && task.karen_decision !== null && !KAREN_DECISIONS.includes(task.karen_decision)) {
    fail(errors, `karen_decision must be one of ${KAREN_DECISIONS.join(", ")}`, path);
  }
  if (
    task.release_readiness !== undefined &&
    task.release_readiness !== null &&
    !RELEASE_READINESS.includes(task.release_readiness)
  ) {
    fail(errors, `release_readiness must be one of ${RELEASE_READINESS.join(", ")}`, path);
  }

  if (task.status === "done") {
    const unverified = (task.acceptance_criteria || []).filter((item) => !item.verified);
    if (unverified.length > 0) {
      fail(errors, `cannot be done while criteria remain unverified: ${unverified.map((i) => i.id).join(", ")}`, path);
    }
    if (!PASSING_VERDICTS.includes(task.qa_verdict)) {
      fail(errors, "done requires qa_verdict PASS or PASS_WITH_WARNINGS", path);
    }
    if (requiresKaren(task)) {
      if (!APPROVING_DECISIONS.includes(task.karen_decision)) {
        fail(errors, "done requires Karen decision APPROVE or EXCEPTIONAL", path);
      }
      if (task.release_readiness !== "READY") {
        fail(errors, "done requires release_readiness READY", path);
      }
    }
  }

  if (task.status === "blocked" && !isNonEmptyString(task.blocked_reason)) {
    fail(errors, "blocked tasks need blocked_reason", path);
  }

  return errors;
}

export function canTransition(from, to) {
  if (from === to) return true;
  return (TRANSITIONS[from] || []).includes(to);
}

export function validateTransition(from, to) {
  if (canTransition(from, to)) return [];
  return [`illegal status transition: ${from} -> ${to}`];
}

export function validateHandoff(handoff, { path = "handoff" } = {}) {
  const errors = [];
  if (!handoff || typeof handoff !== "object") {
    return [`${path}: must be an object`];
  }

  const required = [
    "task_id",
    "sender",
    "recipient",
    "objective",
    "findings",
    "files",
    "decisions",
    "constraints",
    "expected_deliverable",
    "acceptance_criteria",
    "unresolved_questions",
  ];

  for (const field of required) {
    if (handoff[field] === undefined || handoff[field] === null) {
      fail(errors, `${field} is required`, path);
    }
  }

  if (handoff.task_id && !/^VET-\d{3,}$/.test(handoff.task_id)) {
    fail(errors, "task_id must match VET-001 format", path);
  }
  if (handoff.sender && !OWNERS.includes(handoff.sender)) {
    fail(errors, `sender must be one of ${OWNERS.join(", ")}`, path);
  }
  if (handoff.recipient && !OWNERS.includes(handoff.recipient)) {
    fail(errors, `recipient must be one of ${OWNERS.join(", ")}`, path);
  }
  if (handoff.sender && handoff.recipient && handoff.sender === handoff.recipient) {
    fail(errors, "sender and recipient must be different", path);
  }

  for (const field of ["findings", "files", "decisions", "constraints", "acceptance_criteria", "unresolved_questions"]) {
    if (handoff[field] !== undefined && !Array.isArray(handoff[field])) {
      fail(errors, `${field} must be an array`, path);
    }
  }

  return errors;
}

export function validateBoard(board, tasksById = {}) {
  const errors = [];
  if (!board || typeof board !== "object") {
    return ["board: must be an object"];
  }
  if (board.version !== 1) fail(errors, "version must be 1", "board");
  if (!Array.isArray(board.tasks)) {
    fail(errors, "tasks must be an array", "board");
    return errors;
  }

  const seen = new Set();
  const claimed = new Map();

  board.tasks.forEach((entry, index) => {
    const path = `board.tasks[${index}]`;
    if (!entry?.id) {
      fail(errors, "id is required", path);
      return;
    }
    if (seen.has(entry.id)) fail(errors, `duplicate task ${entry.id}`, path);
    seen.add(entry.id);

    const task = tasksById[entry.id];
    if (!task) {
      fail(errors, `missing task file for ${entry.id}`, path);
      return;
    }

    errors.push(...validateTask(task, { path: entry.id }));

    if (entry.status && entry.status !== task.status) {
      fail(errors, `status ${entry.status} does not match task file ${task.status}`, path);
    }
    if (entry.owner && entry.owner !== task.owner) {
      fail(errors, `owner ${entry.owner} does not match task file ${task.owner}`, path);
    }

    if (ACTIVE_STATUSES.includes(task.status)) {
      for (const file of task.files_claimed || []) {
        const holder = claimed.get(file);
        if (holder && holder !== task.id) {
          fail(
            errors,
            `file ${file} is claimed by both ${holder} and ${task.id} while both are active`,
            "board"
          );
        } else {
          claimed.set(file, task.id);
        }
      }
    }
  });

  return errors;
}

export function validateDefect(defect, { path = "defect" } = {}) {
  const errors = [];
  if (!isNonEmptyString(defect?.id)) fail(errors, "id is required", path);
  if (!SEVERITIES.includes(defect?.severity)) {
    fail(errors, `severity must be one of ${SEVERITIES.join(", ")}`, path);
  }
  if (!isNonEmptyString(defect?.title)) fail(errors, "title is required", path);
  if (!isNonEmptyString(defect?.expected)) fail(errors, "expected is required", path);
  if (!isNonEmptyString(defect?.actual)) fail(errors, "actual is required", path);
  if (!Array.isArray(defect?.steps) || defect.steps.length === 0) {
    fail(errors, "steps must be a non-empty array", path);
  }
  if (!OWNERS.includes(defect?.owner)) fail(errors, "owner is required", path);
  return errors;
}

export function validateReport(report, { path = "report" } = {}) {
  const errors = [];
  const required = ["task_id", "summary", "files_changed", "quality_verification", "qa_verdict", "risks", "decisions_needed"];
  for (const field of required) {
    if (report?.[field] === undefined) fail(errors, `${field} is required`, path);
  }
  if (report?.qa_verdict && !QA_VERDICTS.filter(Boolean).includes(report.qa_verdict)) {
    fail(errors, "qa_verdict is invalid", path);
  }
  if (report?.files_changed && !Array.isArray(report.files_changed)) {
    fail(errors, "files_changed must be an array", path);
  }
  if (report?.quality_verification && !Array.isArray(report.quality_verification)) {
    fail(errors, "quality_verification must be an array", path);
  }
  return errors;
}
