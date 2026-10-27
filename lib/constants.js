export const AGENTS = {
  morgan: {
    id: "morgan",
    name: "Morgan",
    role: "Project Manager",
    file: ".agent-team/agents/project-manager.md",
  },
  elena: {
    id: "elena",
    name: "Elena",
    role: "UI/UX Engineer",
    file: ".agent-team/agents/ui-ux-engineer.md",
  },
  kai: {
    id: "kai",
    name: "Kai",
    role: "Software Engineer",
    file: ".agent-team/agents/software-engineer.md",
  },
  sam: {
    id: "sam",
    name: "Sam",
    role: "QA Engineer",
    file: ".agent-team/agents/qa-engineer.md",
  },
  karen: {
    id: "karen",
    name: "Karen",
    role: "Chief Quality Judge",
    file: ".agent-team/agents/chief-quality-judge.md",
  },
  founder: {
    id: "founder",
    name: "Founder",
    role: "Product Owner",
    file: null,
  },
};

export const STATUSES = [
  "draft",
  "planned",
  "in_progress",
  "in_review",
  "qa",
  "quality_review",
  "needs_fix",
  "done",
  "blocked",
  "cancelled",
];

export const ACTIVE_STATUSES = ["in_progress", "in_review", "qa", "quality_review", "needs_fix"];

export const SIZES = ["quick", "standard", "complex"];

export const OWNERS = Object.keys(AGENTS);

export const QA_VERDICTS = ["PASS", "PASS_WITH_WARNINGS", "FAIL", "BLOCKED", null];

export const SEVERITIES = ["P0", "P1", "P2", "P3"];

export const TRANSITIONS = {
  draft: ["planned", "cancelled"],
  planned: ["in_progress", "blocked", "cancelled"],
  in_progress: ["in_review", "qa", "blocked", "cancelled"],
  in_review: ["in_progress", "qa", "needs_fix", "blocked"],
  qa: ["quality_review", "done", "needs_fix", "blocked"],
  quality_review: ["done", "needs_fix", "qa", "blocked"],
  needs_fix: ["in_progress", "qa", "blocked", "cancelled"],
  done: [],
  blocked: ["planned", "in_progress", "qa", "quality_review", "cancelled"],
  cancelled: [],
};

// QA can move to done only with a passing verdict. Represented in validateTask.
export const PASSING_VERDICTS = ["PASS", "PASS_WITH_WARNINGS"];

export const KAREN_DECISIONS = ["REJECT", "CONDITIONAL", "APPROVE", "EXCEPTIONAL", "BLOCKED"];

export const APPROVING_DECISIONS = ["APPROVE", "EXCEPTIONAL"];

export const RELEASE_READINESS = ["READY", "NOT_READY", "BLOCKED"];

export const QUALITY_GATES = ["required", "waived"];
