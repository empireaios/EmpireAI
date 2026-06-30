import path from "node:path";
import {
  BACKEND_SRC,
  extractValidationSuites,
  listDirectories,
} from "../../../orchestration/empire-self-inspection/services/repo-scanner.js";
import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import type { ProductionHardening } from "../models/production-hardening.js";

const STATIC_DRIFT_ITEMS: ProductionHardening["potentialDriftItems"] = [
  { itemId: "drift-001", category: "credentials", description: "Live OAR credentials not yet VERIFIED on all revenue-blocking platforms", severity: "HIGH" },
  { itemId: "drift-002", category: "deployment", description: "Production env vars on Vercel may differ from local .env", severity: "MEDIUM" },
  { itemId: "drift-003", category: "commerce", description: "Runtime plugin activation gates may block publish path", severity: "HIGH" },
  { itemId: "drift-004", category: "testing", description: "Validation suites may not cover newest REAL-038→REAL-050 modules", severity: "LOW" },
  { itemId: "drift-005", category: "mcl", description: "PROGRAM_CATALOG completion percentages are static metadata — verify against live state", severity: "MEDIUM" },
];

/** REAL-047 — Production hardening report (repo-scanner + static drift list). */
export function buildProductionHardening(
  workspaceId: string,
  companyId: string,
): ProductionHardening {
  const runtimeDir = path.join(BACKEND_SRC, "runtime");
  const runtimeModules = listDirectories(runtimeDir);
  const validationSuites = extractValidationSuites();
  const blockingPrograms = PROGRAM_CATALOG.filter((p) => p.blocksUsd100k);

  const driftItems = [...STATIC_DRIFT_ITEMS];
  if (blockingPrograms.length > 0) {
    driftItems.push({
      itemId: "drift-006",
      category: "success-001",
      description: `${blockingPrograms.length} MCL programs still blocking USD 100K target`,
      severity: "HIGH",
    });
  }

  return {
    moduleId: "production-hardening",
    missionId: "REAL-047",
    workspaceId,
    companyId,
    moduleCount: runtimeModules.length,
    validationSuiteCount: validationSuites.length,
    validationSuites: validationSuites.slice(0, 20),
    runtimeModules: runtimeModules.slice(0, 30),
    potentialDriftItems: driftItems,
    reusedModules: ["empire-self-inspection", "master-completion-ledger"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
