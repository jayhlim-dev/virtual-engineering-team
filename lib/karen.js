import { APPROVING_DECISIONS, KAREN_DECISIONS, RELEASE_READINESS } from "./constants.js";

export const DIMENSIONS = [
  { id: "requirements", label: "Requirement satisfaction and product correctness", weight: 0.2 },
  { id: "technical", label: "Technical quality, architecture, and maintainability", weight: 0.2 },
  { id: "verification", label: "Functional verification and test reliability", weight: 0.2 },
  { id: "ux", label: "User experience, usability, and accessibility", weight: 0.15 },
  { id: "security", label: "Security, reliability, and failure handling", weight: 0.15 },
  { id: "documentation", label: "Documentation, delivery quality, and completeness", weight: 0.1 },
];

export function roundScore(score) {
  return Math.round(Number(score) * 10) / 10;
}

export function decisionForScore(score) {
  const value = roundScore(score);
  if (value >= 10) return "EXCEPTIONAL";
  if (value >= 9) return "APPROVE";
  if (value >= 7) return "CONDITIONAL";
  return "REJECT";
}

export function requiresKaren(task) {
  return task?.quality_gate === "required";
}

export function scoreDimensions(input = {}) {
  const applicable = [];
  const excluded = [];

  for (const dimension of DIMENSIONS) {
    const raw = input[dimension.id];
    if (raw === undefined || raw === null || raw === "N/A" || raw === "n/a") {
      excluded.push(dimension.id);
      continue;
    }
    const score = Number(raw);
    if (!Number.isFinite(score) || score < 0 || score > 10) {
      throw new Error(`${dimension.id} must be a number from 0 to 10, or N/A`);
    }
    applicable.push({ ...dimension, score });
  }

  if (!applicable.length) {
    throw new Error("at least one dimension score is required");
  }

  const weightSum = applicable.reduce((sum, item) => sum + item.weight, 0);
  const breakdown = applicable.map((item) => {
    const weight = item.weight / weightSum;
    return {
      id: item.id,
      label: item.label,
      score: roundScore(item.score),
      weight: Math.round(weight * 1000) / 1000,
      contribution: Math.round(item.score * weight * 1000) / 1000,
    };
  });
  const weighted = roundScore(breakdown.reduce((sum, item) => sum + item.score * item.weight, 0));

  return {
    score: weighted,
    suggested_decision: decisionForScore(weighted),
    breakdown,
    excluded,
  };
}

export function validateKarenReview(review) {
  const errors = [];
  if (!review || typeof review !== "object") return ["review must be an object"];
  if (!KAREN_DECISIONS.includes(review.decision)) {
    errors.push(`decision must be one of ${KAREN_DECISIONS.join(", ")}`);
  }
  if (!RELEASE_READINESS.includes(review.release_readiness)) {
    errors.push(`release_readiness must be one of ${RELEASE_READINESS.join(", ")}`);
  }
  if (review.decision !== "BLOCKED") {
    if (typeof review.score !== "number" || review.score < 0 || review.score > 10) {
      errors.push("score must be a number from 0 to 10");
    } else if (decisionForScore(review.score) !== review.decision) {
      errors.push(`score ${review.score} maps to ${decisionForScore(review.score)}, not ${review.decision}`);
    }
  }
  const blockers = Array.isArray(review.blockers) ? review.blockers : [];
  if (blockers.length && APPROVING_DECISIONS.includes(review.decision)) {
    errors.push("critical blockers prevent APPROVE and EXCEPTIONAL");
  }
  if (APPROVING_DECISIONS.includes(review.decision) && review.release_readiness !== "READY") {
    errors.push("APPROVE and EXCEPTIONAL require release_readiness READY");
  }
  if (["REJECT", "CONDITIONAL"].includes(review.decision) && review.release_readiness === "READY") {
    errors.push("REJECT and CONDITIONAL cannot be release READY");
  }
  if (review.decision === "BLOCKED" && review.release_readiness !== "BLOCKED") {
    errors.push("BLOCKED decision requires release_readiness BLOCKED");
  }
  const corrections = review.required_corrections || review.findings || [];
  if (["REJECT", "CONDITIONAL"].includes(review.decision) && corrections.length === 0) {
    errors.push("REJECT and CONDITIONAL require findings or required_corrections");
  }
  if (typeof review.summary !== "string" || !review.summary.trim()) {
    errors.push("summary is required");
  }
  return errors;
}
