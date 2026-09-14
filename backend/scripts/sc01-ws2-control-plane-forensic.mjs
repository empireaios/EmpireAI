/**
 * SC-01 WS2 — control-plane / DB forensic (pre-integration production state +
 * post-integration local admission proof).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { admitAndExecuteShadowCeoFromChat } from "../src/orchestration/shadow-ceo-integration/chat-admission.js";
import {
  openShadowCeoRepository,
  loadChain,
} from "../src/orchestration/shadow-ceo/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outPath = path.join(
  ROOT,
  "docs/audits/capability-extraction/SC01_WS2_CONTROL_PLANE_FORENSIC.json",
);

const SC01_PRODUCTION = {
  requestId: "pcr_196de6fd0e00452d",
  runningSha: "0f98cdd5dba6a850e36c756c5bb8290393216a08",
  deploymentId: "318bfc92-93ac-4719-afa1-3ab5f74a9dd5",
  chatKind: "llm",
  forensicHypothesis: "A_chatBypassedShadowCeo",
  recordsCreatedOnProduction: {
    Objective: { created: false, id: null },
    ExecutiveAssessment: { created: false, id: null },
    PriorityDecision: { created: false, id: null },
    ExecutiveDecision: { created: false, id: null },
    Approval: { created: false, id: null },
    Task: { created: false, id: null },
    Action: { created: false, id: null },
    Outcome: { created: false, id: null },
    Lesson: { created: false, id: null },
    Intervention: { created: false, id: null },
    ExecutiveReturnBrief: { created: false, id: null },
    CostCentre: { created: false, note: "fixture exists; not bound to SC-01 episode" },
    ProfitLedger: { created: false, note: "no chat-admitted ledger row for SC-01" },
  },
  evidence:
    "WS1 production chat returned kind=llm with prose Episode/Objective ID 'SC-01 — …' (not obj_*). Cockpit without objectiveId returned only run instructions. No Shadow CEO imports on pillow chat path at SHA 0f98cdd5.",
};

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sc01-ws2-"));
process.env.SHADOW_CEO_DATA_DIR = tmp;

const beforeRepo = openShadowCeoRepository({
  dbPath: path.join(tmp, "shadow-ceo.db"),
});
const beforeCount = beforeRepo.listRecentObjectives(50).length;
beforeRepo.close();

const message =
  "Operate through the production Shadow CEO environment under SYNTHETIC mode. " +
  "Achieve cumulative realised synthetic net profit from the available synthetic Amazon US " +
  "commerce environment. Assess, prioritize, delegate and proceed autonomously.";

const admission = admitAndExecuteShadowCeoFromChat({
  message,
  workspaceId: "ws_ws2_forensic",
  correlationId: "corr_ws2_forensic",
});

const afterRepo = openShadowCeoRepository({
  dbPath: path.join(tmp, "shadow-ceo.db"),
});
const chain =
  admission.admitted && admission.objectiveId
    ? loadChain(afterRepo, admission.objectiveId)
    : null;
const afterCount = afterRepo.listRecentObjectives(50).length;
afterRepo.close();

const report = {
  document: "SC01_WS2_CONTROL_PLANE_FORENSIC",
  generatedAt: new Date().toISOString(),
  productionSc01BeforeIntegration: SC01_PRODUCTION,
  localAfterAdmission: {
    admitted: admission.admitted,
    blocked: admission.admitted ? admission.blocked : null,
    objectiveId: admission.admitted ? admission.objectiveId : null,
    beforeObjectiveCount: beforeCount,
    afterObjectiveCount: afterCount,
    createdOperatingEpisode: Boolean(chain),
    records: chain
      ? {
          Objective: {
            created: true,
            id: chain.objective.id,
            timestamp: chain.objective.createdAt,
            status: chain.objective.completion.status,
            mode: chain.objective.mode,
          },
          ExecutiveAssessment: {
            created: Boolean(chain.assessment),
            id: chain.assessment?.id ?? null,
            timestamp: chain.assessment?.createdAt ?? null,
            status: chain.assessment?.completion.status ?? null,
          },
          PriorityDecision: {
            created: chain.priorities.length > 0,
            ids: chain.priorities.map((p) => p.id),
            count: chain.priorities.length,
          },
          ExecutiveDecision: {
            created: Boolean(chain.decision),
            id: chain.decision?.id ?? null,
            disposition: chain.decision?.disposition ?? null,
          },
          Approval: {
            created: chain.approvals.length > 0,
            ids: chain.approvals.map((a) => a.id),
            statuses: chain.approvals.map((a) => a.approvalStatus),
          },
          Task: {
            created: chain.tasks.length > 0,
            ids: chain.tasks.map((t) => t.id),
            statuses: chain.tasks.map((t) => t.completion.status),
          },
          Action: {
            created: chain.actions.length > 0,
            ids: chain.actions.map((a) => a.id),
            executionStatuses: chain.actions.map((a) => a.executionStatus),
          },
          Outcome: {
            created: Boolean(chain.outcome),
            id: chain.outcome?.id ?? null,
          },
          Lesson: {
            created: Boolean(chain.lesson),
            id: chain.lesson?.id ?? null,
          },
          ExecutiveReturnBrief: {
            created: Boolean(chain.brief),
            id: chain.brief?.id ?? null,
          },
        }
      : null,
  },
  verdict:
    "Production SC-01 created no operating episode (chat bypass). Post-integration chat admission creates a durable linked chain in the shared Shadow CEO DB.",
  WAVE_CREDIT: 0,
  BIRTH_STATUS: "NOT_BORN",
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ wrote: outPath, local: report.localAfterAdmission }, null, 2));
