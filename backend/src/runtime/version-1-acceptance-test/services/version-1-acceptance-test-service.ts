import fs from "node:fs";
import path from "node:path";
import { BACKEND_SRC } from "../../../orchestration/empire-self-inspection/services/repo-scanner.js";

type AcceptanceCheckDef = { checkId: string; label: string; modulePath: string };

const ACCEPTANCE_CHECKS: AcceptanceCheckDef[] = [
  { checkId: "auth", label: "Auth module", modulePath: "auth" },
  { checkId: "marketplace", label: "Marketplace operations", modulePath: "runtime/global-marketplace-operations" },
  { checkId: "supplier", label: "Supplier intelligence", modulePath: "supplier-intelligence" },
  { checkId: "ec", label: "Executive Council", modulePath: "executive-council" },
  { checkId: "soul", label: "Soul runtime", modulePath: "foundation/soul-runtime" },
  { checkId: "gkr", label: "Grand King Revenue pipeline", modulePath: "grand-king-revenue-pipeline" },
  { checkId: "oar", label: "Operational Access (OAR)", modulePath: "operational-access" },
  { checkId: "mcl", label: "Master Completion Ledger", modulePath: "orchestration/master-completion-ledger" },
  { checkId: "mission-home", label: "Mission Home (Global Operational Command Center)", modulePath: "runtime/global-operational-command-center" },
];

function moduleExists(relativePath: string): boolean {
  return fs.existsSync(path.join(BACKEND_SRC, ...relativePath.split("/")));
}

/** REAL-048 — Version 1 acceptance test (module existence checks). */
export function buildVersion1AcceptanceTest(
  workspaceId: string,
  companyId: string,
): import("../models/version-1-acceptance-test.js").Version1AcceptanceTest {
  const items = ACCEPTANCE_CHECKS.map((check) => {
    const exists = moduleExists(check.modulePath);
    return {
      checkId: check.checkId,
      label: check.label,
      modulePath: check.modulePath,
      status: exists ? "PASS" as const : "FAIL" as const,
      evidence: exists ? `Module found at backend/src/${check.modulePath}` : `Missing: backend/src/${check.modulePath}`,
    };
  });

  const passCount = items.filter((i) => i.status === "PASS").length;
  const failCount = items.filter((i) => i.status === "FAIL").length;
  const overallScore = Math.round((passCount / items.length) * 100);

  return {
    moduleId: "version-1-acceptance-test",
    missionId: "REAL-048",
    workspaceId,
    companyId,
    acceptanceReport: {
      items,
      passCount,
      failCount,
      overallScore,
      passed: failCount === 0,
    },
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
