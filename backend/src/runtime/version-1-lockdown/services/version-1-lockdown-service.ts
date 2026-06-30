import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  BACKEND_SRC,
  deterministicHash,
  extractDatabaseTables,
  extractValidationSuites,
  FRONTEND_PAGE_REGISTRY,
  listDirectories,
  readText,
} from "../../../orchestration/empire-self-inspection/services/repo-scanner.js";
import { EMPIRE_ACCESS_PLATFORMS } from "../../../operational-access/models/empire-platform-catalog.js";
import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { buildVersion1ReadinessAudit } from "../../version-1-readiness-audit/services/version-1-readiness-audit-service.js";
import type { Version1Lockdown } from "../models/version-1-lockdown.js";

const V1_RUNTIME_MODULES = [
  { moduleId: "empire-economics", missionIds: ["REAL-019"] },
  { moduleId: "grand-king-financial-command-center", missionIds: ["REAL-020"] },
  { moduleId: "founder-platform-preparation", missionIds: ["REAL-021"] },
  { moduleId: "ai-self-improvement-engine", missionIds: ["REAL-022"] },
  { moduleId: "version-2-backlog-engine", missionIds: ["REAL-023"] },
  { moduleId: "version-1-readiness-audit", missionIds: ["REAL-024"] },
  { moduleId: "version-1-lockdown", missionIds: ["REAL-025"] },
  { moduleId: "global-command-center", missionIds: ["REAL-013", "REAL-014", "REAL-015", "REAL-016", "REAL-017", "REAL-018"] },
  { moduleId: "live-product-intelligence", missionIds: ["REAL-013"] },
  { moduleId: "global-marketplace-operations", missionIds: ["REAL-008", "REAL-009", "REAL-010", "REAL-011", "REAL-012"] },
];

function collectApiRoutes(): string[] {
  const routes: string[] = [
    "/empire-economics/dashboard",
    "/grand-king-financial-command-center/dashboard",
    "/global-command-center/dashboard",
    "/version-1-readiness-audit/dashboard",
    "/version-1-lockdown/baseline",
    "/version-2-backlog-engine/dashboard",
  ];
  const routesDir = path.join(BACKEND_SRC, "runtime");
  if (!fs.existsSync(routesDir)) return routes;
  for (const entry of fs.readdirSync(routesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const routeFile = path.join(routesDir, entry.name, "routes");
    if (!fs.existsSync(routeFile)) continue;
    for (const f of fs.readdirSync(routeFile)) {
      if (!f.endsWith("-routes.ts")) continue;
      const content = readText(path.join(routeFile, f));
      const re = /app\.(get|post)\(\s*["'`]([^"'`]+)["'`]/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(content)) !== null) {
        if (m[2]) routes.push(m[2]);
      }
    }
  }
  return [...new Set(routes)].sort();
}

/** REAL-025 — Version 1 baseline lock (never silently change V1). */
export function buildVersion1Lockdown(
  workspaceId: string,
  companyId: string,
): Version1Lockdown {
  const readiness = buildVersion1ReadinessAudit(workspaceId, companyId);
  const dbContent = readText(path.join(BACKEND_SRC, "brain", "database.ts"));
  const tables = extractDatabaseTables(dbContent);
  const apis = collectApiRoutes();
  const dashboards = FRONTEND_PAGE_REGISTRY.map((p) => `${p.route} — ${p.title}`);
  const runtimeDirs = listDirectories(path.join(BACKEND_SRC, "runtime"));

  const baselinePayload = {
    readinessScore: readiness.version1ReadinessScore,
    modules: V1_RUNTIME_MODULES,
    tables,
    apis: apis.length,
    dashboards,
  };

  const baseline = {
    baselineId: randomUUID(),
    version: "1.0.0" as const,
    lockedAt: new Date().toISOString(),
    architectureSnapshot: {
      readinessScore: readiness.version1ReadinessScore,
      programCount: PROGRAM_CATALOG.length,
      runtimeModuleCount: runtimeDirs.length,
    },
    moduleInventory: V1_RUNTIME_MODULES,
    databaseInventory: tables,
    apiInventory: apis,
    dashboardInventory: dashboards,
    executiveInventory: ["ceo", "cco", "cfo", "csco", "cmo-marketplace", "cmo-marketing", "cxo", "cro", "cto", "cko", "cao", "clo"],
    marketplaceInventory: EMPIRE_ACCESS_PLATFORMS.filter((p) => p.category === "marketplace").map((p) => p.platformId),
    supplierInventory: EMPIRE_ACCESS_PLATFORMS.filter((p) => p.category === "supplier").map((p) => p.platformId),
    operationalAccessInventory: EMPIRE_ACCESS_PLATFORMS.map((p) => p.platformId),
    versionLock: {
      locked: true as const,
      futureChangesPolicy: "All post-lock changes require Version 2+ designation — never silently mutate Version 1 baseline.",
      baselineHash: deterministicHash(baselinePayload),
    },
  };

  return {
    moduleId: "version-1-lockdown",
    missionId: "REAL-025",
    workspaceId,
    companyId,
    baseline,
    architectureComplete: readiness.version1ReadinessScore >= 70,
    computedAt: new Date().toISOString(),
  };
}

export function getVersion1ValidationSuiteCount(): number {
  return extractValidationSuites().length;
}
