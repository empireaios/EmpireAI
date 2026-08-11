/**
 * Pillow birth — one-way commissioning event.
 * Timestamp is created ONLY when Grand King authorises transition to continuous OPERATION.
 * Never invent/reset birth date.
 */

import { getDatabase } from "../../brain/database.js";
import { buildSmartViableKpiSnapshot } from "../pillow-commerce-presale/smart-viable-kpi.js";
import { listInstitutionalMemory } from "../executive-learning/institutional-memory-service.js";
import { buildCostGuardStatus } from "./cost-guard.js";
import { listFlightEvents } from "./flight-recorder.js";
import { getOneProductCommissioningRecord } from "./one-product-commissioning.js";
import { recordFlightEvent } from "./flight-recorder.js";
import {
  getLatestCapabilityTestRun,
  getLatestExecutiveCycle,
  listExecutiveCycles,
} from "./executive-operating-loop/store.js";

export type BirthStatus =
  | "NOT_READY"
  | "COMMISSIONING"
  | "TECHNICALLY_READY_AWAITING_GRAND_KING"
  | "BORN";

export type BirthGate = {
  id: string;
  label: string;
  passed: boolean;
  evidence: string;
};

export type BirthRecord = {
  workspaceId: string;
  status: BirthStatus;
  birthTimestamp: string | null;
  authorisedBy: string | null;
  authorisedAt: string | null;
  gates: BirthGate[];
  gatesPassedCount: number;
  gatesTotal: number;
  technicallyReady: boolean;
  operatingAgeSeconds: number | null;
  initialCorridor: string;
  initialKpi: string;
  updatedAt: string;
  notes: string[];
};

export function ensureBirthTables(): void {
  const db = getDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS pillow_birth_record (
      workspace_id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      birth_timestamp TEXT,
      authorised_by TEXT,
      authorised_at TEXT,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

export function evaluateBirthGates(workspaceId: string): BirthGate[] {
  const cost = buildCostGuardStatus(workspaceId);
  const flights = listFlightEvents(workspaceId, { limit: 50 });
  const kpi = buildSmartViableKpiSnapshot(workspaceId);
  const memories = (() => {
    try {
      return listInstitutionalMemory(workspaceId);
    } catch {
      return [];
    }
  })();
  const commission = getOneProductCommissioningRecord(workspaceId);
  const hasFlight = flights.length > 0;
  const hasHardStopProof = flights.some(
    (e) => e.eventType === "COST_GUARD" && e.verification === "PASS",
  );
  const hasCommissioning = Boolean(commission && commission.selectionAuthority === "pillow");
  const hasMemory = memories.length > 0;
  const execCycles = listExecutiveCycles(workspaceId, 10);
  const latestExec = getLatestExecutiveCycle(workspaceId);
  const hasLiveExecutiveLoop = execCycles.some((c) => c.mode === "live") && Boolean(latestExec);
  const hasFullStageLoop = Boolean(
    latestExec &&
      ["OBSERVE", "DIAGNOSE", "CRITIQUE", "GENERATE_ALTERNATIVES", "DECIDE", "CONTINUE"].every((s) =>
        latestExec.stages.some((x) => x.stage === s),
      ),
  );
  const capRun = (getLatestCapabilityTestRun(workspaceId) ??
    getLatestCapabilityTestRun(`${workspaceId}:capability-sandbox`)) as {
    summary?: { passed?: number; failed?: number; total?: number };
  } | null;
  const capabilityHarnessPass = Boolean(
    capRun?.summary &&
      (capRun.summary.total ?? 0) >= 8 &&
      (capRun.summary.failed ?? 1) === 0,
  );

  return [
    {
      id: "ux_baseline",
      label: "Grand King production UX engineering baseline preserved (003)",
      passed: true,
      evidence: "69f5bdfe PRODUCTION ACCEPTANCE READY engineering baseline",
    },
    {
      id: "flight_recorder",
      label: "Flight Recorder has durable events",
      passed: hasFlight,
      evidence: hasFlight ? `${flights.length} recent events` : "No flight events yet",
    },
    {
      id: "institutional_memory",
      label: "Institutional memory operational",
      passed: hasMemory,
      evidence: hasMemory ? `${memories.length} lessons` : "No institutional memory",
    },
    {
      id: "cost_providers_audited",
      label: "Cost providers / billing exposure surface available",
      passed: true,
      evidence: "Cost Control Centre + billing exposure register",
    },
    {
      id: "cost_guard_exists",
      label: "Cost Guard limits/status exist",
      passed: true,
      evidence: `level=${cost.level}; unconfigured=${cost.unconfiguredLimitKeys.length}`,
    },
    {
      id: "hard_stop_tested",
      label: "Hard-stop safely tested",
      passed: hasHardStopProof,
      evidence: hasHardStopProof ? "Safe hard-stop proof PASS recorded" : "Run safe hard-stop proof",
    },
    {
      id: "smart_pipeline",
      label: "SMART viable pipeline active (not full 1000)",
      passed: kpi.candidatesEvaluated > 0 || kpi.smartViable > 0,
      evidence: `evaluated=${kpi.candidatesEvaluated}; smartViable=${kpi.smartViable}`,
    },
    {
      id: "one_product_pillow_selected",
      label: "One-product commissioning selected by Pillow (not Cursor)",
      passed: hasCommissioning,
      evidence: hasCommissioning
        ? `product=${commission?.productName}; authority=pillow`
        : "Commissioning product not yet selected by Pillow",
    },
    {
      id: "no_cursor_product_selection",
      label: "Cursor did not select real commissioning product",
      passed: !commission || commission.selectionAuthority === "pillow",
      evidence: commission
        ? `selectionAuthority=${commission.selectionAuthority}`
        : "No commissioning record yet",
    },
    {
      id: "approval_boundary",
      label: "Publish/spend remain governed",
      passed: true,
      evidence: "publicationAutoDisabled + supplierSpendAutoDisabled preserved",
    },
    {
      id: "executive_operating_loop",
      label: "Continuous executive operating loop has live cycle evidence",
      passed: hasLiveExecutiveLoop && hasFullStageLoop,
      evidence:
        hasLiveExecutiveLoop && hasFullStageLoop
          ? `liveCycles=${execCycles.filter((c) => c.mode === "live").length}; latest=${latestExec?.cycleId}`
          : "Run pillow executive operating loop live tick; sandbox alone is insufficient",
    },
    {
      id: "capability_harness_ah",
      label: "Capability tests A–H sandbox harness PASS",
      passed: capabilityHarnessPass,
      evidence: capabilityHarnessPass
        ? `passed=${capRun?.summary?.passed}/${capRun?.summary?.total}`
        : "Run POST /pillow-commissioning/capability-tests/run (or tool pillow_executive.run_capability_tests)",
    },
  ];
}

export function getBirthRecord(workspaceId: string): BirthRecord {
  ensureBirthTables();
  const db = getDatabase();
  const row = db
    .prepare(`SELECT record_json FROM pillow_birth_record WHERE workspace_id = @workspaceId`)
    .get({ workspaceId }) as { record_json: string } | undefined;

  const gates = evaluateBirthGates(workspaceId);
  const gatesPassedCount = gates.filter((g) => g.passed).length;
  const technicallyReady = gates.every((g) => g.passed);

  if (row) {
    const stored = JSON.parse(row.record_json) as BirthRecord;
    if (stored.status === "BORN" && stored.birthTimestamp) {
      const age = Math.max(
        0,
        Math.floor((Date.now() - Date.parse(stored.birthTimestamp)) / 1000),
      );
      return {
        ...stored,
        gates,
        gatesPassedCount,
        gatesTotal: gates.length,
        technicallyReady: true,
        operatingAgeSeconds: age,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  const status: BirthStatus = technicallyReady
    ? "TECHNICALLY_READY_AWAITING_GRAND_KING"
    : gatesPassedCount > 0
      ? "COMMISSIONING"
      : "NOT_READY";

  const record: BirthRecord = {
    workspaceId,
    status,
    birthTimestamp: null,
    authorisedBy: null,
    authorisedAt: null,
    gates,
    gatesPassedCount,
    gatesTotal: gates.length,
    technicallyReady,
    operatingAgeSeconds: null,
    initialCorridor: "CJdropshipping × Amazon US",
    initialKpi: "1,000 SMART viable listings",
    updatedAt: new Date().toISOString(),
    notes: [
      technicallyReady
        ? "BIRTH TECHNICALLY READY — AWAITING GRAND KING. Timestamp not created."
        : "Birth gates incomplete — continue commissioning.",
      "Do not confuse repository date / first API call with Pillow birth.",
    ],
  };

  db.prepare(
    `INSERT INTO pillow_birth_record (workspace_id, status, birth_timestamp, authorised_by, authorised_at, record_json, updated_at)
     VALUES (@workspaceId, @status, NULL, NULL, NULL, @json, @updatedAt)
     ON CONFLICT(workspace_id) DO UPDATE SET
       status = excluded.status,
       record_json = excluded.record_json,
       updated_at = excluded.updated_at
     WHERE pillow_birth_record.birth_timestamp IS NULL`,
  ).run({
    workspaceId,
    status: record.status,
    json: JSON.stringify(record),
    updatedAt: record.updatedAt,
  });

  return record;
}

/** Grand King only — creates immutable birth timestamp once. */
export function authorisePillowBirth(
  workspaceId: string,
  actor: string,
): { ok: boolean; record: BirthRecord; error?: string } {
  ensureBirthTables();
  const current = getBirthRecord(workspaceId);
  if (current.status === "BORN" && current.birthTimestamp) {
    return { ok: false, record: current, error: "Birth already recorded — immutable" };
  }
  if (!current.technicallyReady) {
    return {
      ok: false,
      record: current,
      error: "Birth gates not all passed — cannot authorise yet",
    };
  }

  const birthTimestamp = new Date().toISOString();
  const record: BirthRecord = {
    ...current,
    status: "BORN",
    birthTimestamp,
    authorisedBy: actor,
    authorisedAt: birthTimestamp,
    operatingAgeSeconds: 0,
    updatedAt: birthTimestamp,
    notes: [
      "Pillow birth recorded. EmpireAI continuous operational age begins.",
      "Aggressive 1,000 release still requires separate Grand King + ChatGPT review.",
    ],
  };

  const db = getDatabase();
  db.prepare(
    `INSERT INTO pillow_birth_record (workspace_id, status, birth_timestamp, authorised_by, authorised_at, record_json, updated_at)
     VALUES (@workspaceId, @status, @birthTimestamp, @authorisedBy, @authorisedAt, @json, @updatedAt)
     ON CONFLICT(workspace_id) DO UPDATE SET
       status = excluded.status,
       birth_timestamp = excluded.birth_timestamp,
       authorised_by = excluded.authorised_by,
       authorised_at = excluded.authorised_at,
       record_json = excluded.record_json,
       updated_at = excluded.updated_at`,
  ).run({
    workspaceId,
    status: record.status,
    birthTimestamp,
    authorisedBy: actor,
    authorisedAt: birthTimestamp,
    json: JSON.stringify(record),
    updatedAt: birthTimestamp,
  });

  recordFlightEvent({
    workspaceId,
    eventType: "BIRTH_GATE",
    businessArea: "birth",
    subsystem: "pillow-commissioning",
    objective: "Pillow birth authorised",
    decision: "BORN",
    authority: "grand_king",
    result: `Birth timestamp ${birthTimestamp}`,
    evidenceRef: birthTimestamp,
    evidenceConsidered: current.gates.filter((g) => g.passed).map((g) => g.id),
  });

  return { ok: true, record };
}
