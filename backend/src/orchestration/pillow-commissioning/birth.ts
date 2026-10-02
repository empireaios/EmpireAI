/**
 * Current Birth authority with preserved legacy commissioning history.
 * Historical timestamps never grant current authority or get rewritten.
 */

import { getDatabase } from "../../brain/database.js";
import { buildSmartViableKpiSnapshot } from "../pillow-commerce-presale/smart-viable-kpi.js";
import { listInstitutionalMemory } from "../executive-learning/institutional-memory-service.js";
import { buildCostGuardStatus } from "./cost-guard.js";
import { listFlightEvents } from "./flight-recorder.js";
import { getOneProductCommissioningRecord } from "./one-product-commissioning.js";
import { getPillowAuthority, type PillowAuthority } from "./pillow-authority.js";
import { hasCompleteSandboxCapabilityPass } from "./executive-operating-loop/capability-run-evidence.js";
import {
  getLatestCapabilityTestRun,
  getLatestExecutiveCycle,
  listExecutiveCycles,
} from "./executive-operating-loop/store.js";

export type BirthStatus =
  | "NOT_BORN"
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

export type LegacyBirthHistory = {
  status: string | null;
  birthTimestamp: string | null;
  authorisedBy: string | null;
  authorisedAt: string | null;
  evidenceClass: "LEGACY_UNVERIFIED";
};

export type BirthRecord = {
  workspaceId: string;
  status: BirthStatus;
  authority: PillowAuthority;
  legacyHistory: LegacyBirthHistory | null;
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
  const capabilityHarnessPass = hasCompleteSandboxCapabilityPass(capRun);

  return [
    {
      id: "independent_v53_certification",
      label: "Independently accepted replacement certification evidence",
      passed: getPillowAuthority().technicallyReady,
      evidence: getPillowAuthority().reason,
    },
    {
      id: "ux_baseline",
      label: "Current production UX evidence",
      passed: false,
      evidence: "UNVERIFIED: historical engineering baseline 69f5bdfe is not current-release production UX evidence.",
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
      label: "Actual provider costs reconciled",
      passed: false,
      evidence: "UNVERIFIED: a Cost Control Centre or billing exposure register does not prove actual provider charges were reconciled.",
    },
    {
      id: "cost_guard_exists",
      label: "Current budget enforcement verified",
      passed: false,
      evidence: `UNVERIFIED: Cost Guard reports level=${cost.level}; unconfigured=${cost.unconfiguredLimitKeys.length}. Configuration/status alone is not scoped enforcement evidence.`,
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
      label: "Deployed publish/spend boundary verified",
      passed: false,
      evidence: "UNVERIFIED: canonical commerce is LOCKED; this policy projection does not prove every deployed side-effect boundary has been independently exercised.",
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
  const row = getDatabase()
    .prepare(`SELECT status, birth_timestamp, authorised_by, authorised_at FROM pillow_birth_record WHERE workspace_id = @workspaceId`)
    .get({ workspaceId }) as {
      status: string | null;
      birth_timestamp: string | null;
      authorised_by: string | null;
      authorised_at: string | null;
    } | undefined;

  const authority = getPillowAuthority();
  const gates = evaluateBirthGates(workspaceId);
  // Read-only projection: retain the original table/JSON byte-for-byte as
  // historical evidence. Never promote even a stored BORN record into authority.
  return {
    workspaceId,
    status: authority.birthStatus,
    authority,
    legacyHistory: row ? {
      status: row.status,
      birthTimestamp: row.birth_timestamp,
      authorisedBy: row.authorised_by,
      authorisedAt: row.authorised_at,
      evidenceClass: "LEGACY_UNVERIFIED",
    } : null,
    birthTimestamp: null,
    authorisedBy: null,
    authorisedAt: null,
    gates,
    gatesPassedCount: gates.filter((gate) => gate.passed).length,
    gatesTotal: gates.length,
    technicallyReady: authority.technicallyReady,
    operatingAgeSeconds: null,
    initialCorridor: "CJdropshipping × Amazon US",
    initialKpi: "1,000 SMART viable listings",
    updatedAt: new Date().toISOString(),
    notes: [
      authority.reason,
      "Legacy gate diagnostics remain available but do not constitute independent certification or unlock live commerce.",
      ...(row ? ["Historical commissioning fields are preserved separately as LEGACY_UNVERIFIED; their timestamp is not a certified operating age."] : []),
    ],
  };
}

/** Legacy owner button fails closed until independent receipt acceptance exists. */
export function authorisePillowBirth(
  workspaceId: string,
  actor: string,
): { ok: boolean; record: BirthRecord; error?: string } {
  void actor;
  const record = getBirthRecord(workspaceId);
  return {
    ok: false,
    record,
    error: record.authority.reason,
  };
}
