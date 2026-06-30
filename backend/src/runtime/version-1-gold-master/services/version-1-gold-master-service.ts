import { randomUUID } from "node:crypto";
import path from "node:path";
import {
  BACKEND_SRC,
  deterministicHash,
  extractDatabaseTables,
  listDirectories,
  readText,
} from "../../../orchestration/empire-self-inspection/services/repo-scanner.js";
import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { buildVersion1AcceptanceTest } from "../../version-1-acceptance-test/services/version-1-acceptance-test-service.js";
import type { Version1GoldMaster } from "../models/version-1-gold-master.js";

const GOLD_MISSION_INVENTORY = [
  { missionId: "REAL-036", moduleId: "grand-king-live-operations-mode" },
  { missionId: "REAL-037", moduleId: "global-operational-command-center" },
  { missionId: "REAL-038", moduleId: "global-advertising-intelligence" },
  { missionId: "REAL-039", moduleId: "first-order-operations" },
  { missionId: "REAL-040", moduleId: "global-order-intelligence" },
  { missionId: "REAL-041", moduleId: "post-purchase-intelligence" },
  { missionId: "REAL-042", moduleId: "global-knowledge-evolution" },
  { missionId: "REAL-043", moduleId: "ai-strategic-memory" },
  { missionId: "REAL-044", moduleId: "empire-playbook-engine" },
  { missionId: "REAL-045", moduleId: "global-risk-command" },
  { missionId: "REAL-046", moduleId: "founder-platform-readiness" },
  { missionId: "REAL-047", moduleId: "production-hardening" },
  { missionId: "REAL-048", moduleId: "version-1-acceptance-test" },
  { missionId: "REAL-049", moduleId: "grand-king-go-live-checklist" },
  { missionId: "REAL-050", moduleId: "version-1-gold-master" },
];

const CONSTITUTION_INVENTORY = [
  "CONSTITUTION-021", "CONSTITUTION-030", "CONSTITUTION-033",
  "Grand King remains unique from Founder",
  "Soul never bypasses Grand King",
  "Net profit required before scaling",
];

/** REAL-050 — Version 1 gold master (extends REAL-025 lockdown concept). */
export function buildVersion1GoldMaster(
  workspaceId: string,
  companyId: string,
): Version1GoldMaster {
  const acceptance = buildVersion1AcceptanceTest(workspaceId, companyId);
  const acceptanceScore = acceptance.acceptanceReport.overallScore;
  const runtimeModules = listDirectories(path.join(BACKEND_SRC, "runtime"));
  const dbContent = readText(path.join(BACKEND_SRC, "brain", "database.ts"));
  const tables = extractDatabaseTables(dbContent);

  let doctrineInventory: string[] = [];
  try {
    const doctrineDir = path.join(BACKEND_SRC, "foundation", "doctrine-engine");
    doctrineInventory = listDirectories(doctrineDir).length > 0
      ? ["doctrine-engine", "policy-engine", "empire-governance", "promise-register"]
      : ["doctrine-engine"];
  } catch {
    doctrineInventory = ["doctrine-engine"];
  }

  const baselinePayload = {
    version: "1.0.0-gold",
    acceptanceScore,
    programCount: PROGRAM_CATALOG.length,
    runtimeModuleCount: runtimeModules.length,
    missions: GOLD_MISSION_INVENTORY,
    tables: tables.length,
  };

  const baselineHash = deterministicHash(baselinePayload);
  const issuedAt = new Date().toISOString();

  return {
    moduleId: "version-1-gold-master",
    missionId: "REAL-050",
    workspaceId,
    companyId,
    version: "1.0.0-gold",
    versionLock: {
      locked: true,
      baselineHash,
      futureChangesPolicy: "Version 1.0.0-gold is the canonical gold master — all post-gold changes require Version 2+ designation.",
    },
    version1Certificate: {
      certificateId: randomUUID(),
      version: "1.0.0-gold",
      issuedAt,
      acceptanceScore,
      goldMaster: true,
    },
    doctrineInventory,
    constitutionInventory: CONSTITUTION_INVENTORY,
    missionInventory: GOLD_MISSION_INVENTORY,
    programCount: PROGRAM_CATALOG.length,
    runtimeModuleCount: runtimeModules.length,
    acceptanceScore,
    reusedModules: ["empire-self-inspection", "master-completion-ledger", "version-1-acceptance-test", "version-1-lockdown"],
    architectureComplete: acceptanceScore >= 80,
    computedAt: issuedAt,
  };
}
