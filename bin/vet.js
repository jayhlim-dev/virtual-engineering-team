#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { resolveTeamRoot } from "../lib/paths.js";
import {
  collectValidation,
  createTask,
  loadBoard,
  loadTasks,
  recordKarenReview,
  saveHandoff,
  saveReport,
  updateTask,
} from "../lib/store.js";
import { scoreDimensions } from "../lib/karen.js";
import { installUserAgents, onboardProject } from "../lib/init-project.js";
import { AGENTS, SIZES, STATUSES } from "../lib/constants.js";

function usage() {
  return `Virtual Engineering Team CLI

Usage:
  node bin/vet.js onboard [dir]          Create team memory in a project (appends .gitignore)
  node bin/vet.js onboard [dir] --track-team   Keep team files committable (no gitignore)
  node bin/vet.js install-agents         Install Elena/Kai/Sam/Morgan into ~/.cursor/agents
  node bin/vet.js board                  Show the task board
  node bin/vet.js validate               Check board, tasks, handoffs, reports
  node bin/vet.js task new --title T [--size quick|standard|complex] [--request ...]
  node bin/vet.js task show ID
  node bin/vet.js task update ID [--status S] [--owner O] [--claim file] [--verdict V]
  node bin/vet.js handoff --task ID --from A --to B --objective "..."
  node bin/vet.js report --task ID --summary "..." --verdict PASS
  node bin/vet.js score --requirements 9 --technical 8 --verification 9 --ux 8 --security 8 --documentation 7
  node bin/vet.js review --task ID --decision CONDITIONAL --score 7.7 --release NOT_READY --summary "..." --correction "Kai: add failure test"

Agents: morgan, elena, kai, sam, karen, founder
`;
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        i += 1;
      }
    } else {
      args._.push(token);
    }
  }
  return args;
}

function printBoard(board, tasks) {
  if (!board.tasks.length) {
    console.log("No tasks.");
    return;
  }
  console.log(`${board.project}  updated ${board.updated_at}`);
  for (const entry of board.tasks) {
    const task = tasks[entry.id];
    const verdict = task?.qa_verdict ? `  qa=${task.qa_verdict}` : "";
    const karen = task?.karen_decision ? `  karen=${task.karen_decision}` : "";
    console.log(`${entry.id}  ${entry.status.padEnd(16)}  ${entry.owner.padEnd(8)}  ${entry.title}${verdict}${karen}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];

  if (!command || command === "help" || args.help) {
    console.log(usage());
    return;
  }

  if (command === "onboard") {
    const target = path.resolve(args._[1] || process.cwd());
    const result = onboardProject(target, {
      installCursor: args["skip-cursor"] ? false : true,
      trackInGit: Boolean(args["track-team"]),
    });
    console.log(`Team memory ready at ${result.teamDir}`);
    if (result.gitignore?.updated) {
      console.log(`Added team paths to ${result.gitignore.path}`);
    } else if (result.gitignore?.reason === "already_present") {
      console.log(`Team paths already in ${result.gitignore.path}`);
    } else if (result.gitignore?.reason === "skipped") {
      console.log("Skipped .gitignore (HQ repo or --track-team).");
    }
    return;
  }

  if (command === "install-agents") {
    const dest = installUserAgents();
    console.log(`Installed Cursor subagents at ${dest}`);
    console.log("They are available in every project on this Mac.");
    return;
  }

  const root = resolveTeamRoot(args.root || process.cwd());

  if (command === "board") {
    const board = loadBoard(root);
    printBoard(board, loadTasks(root, board));
    return;
  }

  if (command === "validate") {
    const { errors } = collectValidation(root);
    if (errors.length) {
      console.error("INVALID");
      for (const error of errors) console.error(`- ${error}`);
      process.exitCode = 1;
      return;
    }
    console.log("VALID");
    return;
  }

  if (command === "task") {
    const action = args._[1];
    if (action === "new") {
      if (!args.title) throw new Error("--title is required");
      if (args.size && !SIZES.includes(args.size)) throw new Error("invalid --size");
      const criteria = args.criterion
        ? String(args.criterion)
            .split("||")
            .map((text, index) => ({
              id: `AC-${index + 1}`,
              text: text.trim(),
              verified: false,
              evidence: "",
            }))
        : undefined;
      const task = createTask(root, {
        title: args.title,
        size: args.size,
        request: args.request,
        owner: args.owner,
        acceptance_criteria: criteria,
      });
      console.log(task.id);
      return;
    }
    if (action === "show") {
      const id = args._[2];
      const board = loadBoard(root);
      const task = loadTasks(root, board)[id];
      if (!task) throw new Error(`Unknown task ${id}`);
      console.log(JSON.stringify(task, null, 2));
      return;
    }
    if (action === "update") {
      const id = args._[2];
      if (!id) throw new Error("task id is required");
      if (args.status && !STATUSES.includes(args.status)) throw new Error("invalid --status");
      if (args.owner && !AGENTS[args.owner]) throw new Error("invalid --owner");
      const board = loadBoard(root);
      const current = loadTasks(root, board)[id];
      if (!current) throw new Error(`Unknown task ${id}`);
      const patch = {};
      if (args.status) patch.status = args.status;
      if (args.owner) patch.owner = args.owner;
      if (args.verdict) patch.qa_verdict = args.verdict;
      if (args.blocked) patch.blocked_reason = args.blocked;
      if (args.claim) {
        const files = String(args.claim).split(",").map((item) => item.trim()).filter(Boolean);
        patch.files_claimed = Array.from(new Set([...(current.files_claimed || []), ...files]));
      }
      if (args["verify-ac"]) {
        patch.acceptance_criteria = current.acceptance_criteria.map((item) =>
          item.id === args["verify-ac"]
            ? { ...item, verified: true, evidence: args.evidence || item.evidence }
            : item
        );
      }
      const task = updateTask(root, id, patch);
      console.log(`${task.id} ${task.status} ${task.owner}`);
      return;
    }
    throw new Error("Unknown task action. Use new, show, or update.");
  }

  if (command === "score") {
    const scored = scoreDimensions({
      requirements: args.requirements,
      technical: args.technical,
      verification: args.verification,
      ux: args.ux,
      security: args.security,
      documentation: args.documentation,
    });
    console.log(JSON.stringify(scored, null, 2));
    return;
  }

  if (command === "review") {
    const dimensions = args.requirements || args.technical || args.verification
      ? scoreDimensions({
          requirements: args.requirements,
          technical: args.technical,
          verification: args.verification,
          ux: args.ux,
          security: args.security,
          documentation: args.documentation,
        })
      : null;
    const score = args.score ? Number(args.score) : dimensions?.score;
    const task = recordKarenReview(root, args.task, {
      decision: args.decision,
      score,
      release_readiness: args.release,
      summary: args.summary,
      breakdown: dimensions?.breakdown || [],
      blockers: splitList(args.blockers),
      findings: splitList(args.finding),
      required_corrections: splitList(args.correction),
      return_to: args["return-to"],
    });
    console.log(`${task.id} ${task.status} karen=${task.karen_decision} release=${task.release_readiness}`);
    return;
  }

  if (command === "handoff") {
    const file = saveHandoff(root, {
      task_id: args.task,
      sender: args.from,
      recipient: args.to,
      objective: args.objective,
      findings: splitList(args.findings),
      files: splitList(args.files),
      decisions: splitList(args.decisions),
      constraints: splitList(args.constraints),
      expected_deliverable: args.deliverable || args.objective,
      acceptance_criteria: splitList(args.criteria),
      unresolved_questions: splitList(args.questions),
      verification_evidence: splitList(args.evidence),
    });
    console.log(file);
    return;
  }

  if (command === "report") {
    const file = saveReport(root, {
      task_id: args.task,
      summary: args.summary,
      files_changed: splitList(args.files).map((item) => {
        const [pathName, ...purpose] = item.split(":");
        return { path: pathName, purpose: purpose.join(":") || "" };
      }),
      quality_verification: splitList(args.checks).map((item) => {
        const [commandName, result] = item.split("=>");
        return { command: commandName, result: result || "not recorded" };
      }),
      qa_verdict: args.verdict,
      risks: splitList(args.risks),
      decisions_needed: splitList(args.decisions),
    });
    console.log(file);
    return;
  }

  throw new Error(`Unknown command: ${command}\n${usage()}`);
}

function splitList(value) {
  if (!value || value === true) return [];
  return String(value)
    .split("||")
    .map((item) => item.trim())
    .filter(Boolean);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
