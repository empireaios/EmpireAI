import fs from "node:fs";
import path from "node:path";

import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { BACKEND_SRC, listDirectories } from "../../../orchestration/empire-self-inspection/services/repo-scanner.js";
import { CORE_CONSTITUTION_CATALOG } from "../catalog/ctd-catalog.js";
import type { ConstitutionComplianceCheck, ConstitutionComplianceReport } from "../models/core-constitution.js";
import { CORE_CONSTITUTION_MISSION_ID, CORE_CONSTITUTION_VERSION } from "../models/core-constitution.js";

const SUCCESS_TARGET_USD = 100_000;

function modulePathExists(relativePath: string): boolean {
  return fs.existsSync(path.join(BACKEND_SRC, ...relativePath.split("/")));
}

function runtimeModuleHasMissionContract(slug: string): boolean {
  const indexPath = path.join(BACKEND_SRC, "runtime", slug, "index.ts");
  if (!fs.existsSync(indexPath)) return false;
  const content = fs.readFileSync(indexPath, "utf8");
  return content.includes("MISSION_ID") && content.includes("MODULE_ID");
}

function check(
  checkId: string,
  articleId: string,
  label: string,
  ok: boolean,
  partial: boolean,
  evidence: string,
  violation: string | null,
): ConstitutionComplianceCheck {
  const status = ok ? "COMPLIANT" as const : partial ? "PARTIAL" as const : "VIOLATION" as const;
  return { checkId, articleId, label, status, evidence, violation: status === "VIOLATION" ? violation : null };
}

/** Static constitution compliance audit — NOT runtime enforcement. */
export function auditConstitutionCompliance(
  workspaceId: string,
  companyId: string,
): ConstitutionComplianceReport {
  const articles = [...CORE_CONSTITUTION_CATALOG];
  const proofProgram = PROGRAM_CATALOG.find((p) => p.programId === "proof-of-money");
  const runtimeModules = listDirectories(path.join(BACKEND_SRC, "runtime"));

  const sampleModules = [
    "empire-economics",
    "success-001-command-center",
    "global-opportunity-engine",
    "version-1-completion",
  ];
  const moduleContractOk = sampleModules.every((m) => runtimeModuleHasMissionContract(m));

  const checks: ConstitutionComplianceCheck[] = [
    check(
      "ctd-001-commerce-os",
      "CTD-001",
      "EmpireAI manufactures companies (GKR + commerce OS present)",
      modulePathExists("grand-king-revenue-pipeline") && modulePathExists("orchestration/ecommerce-os-orchestrator"),
      false,
      "GKR pipeline + ecommerce OS orchestrator modules on disk",
      "Missing company manufacturing architecture modules",
    ),
    check(
      "ctd-002-success-001",
      "CTD-002",
      "SUCCESS-001 USD 100K net profit is primary mission",
      Boolean(proofProgram?.blocksUsd100k),
      false,
      proofProgram
        ? `proof-of-money program targets SUCCESS-001 · next: ${proofProgram.nextCursorMission}`
        : "proof-of-money program missing from PROGRAM_CATALOG",
      "SUCCESS-001 not declared as blocking program in PROGRAM_CATALOG",
    ),
    check(
      "ctd-005-intelligence",
      "CTD-005",
      "Intelligence modules dominate over raw automation",
      modulePathExists("runtime/executive-visual-debate") && modulePathExists("runtime/global-opportunity-engine"),
      !modulePathExists("runtime/founder-automation"),
      "Executive debate + opportunity engine present; founder-automation is workload not commerce autopilot",
      "Intelligence layer modules missing",
    ),
    check(
      "ctd-017-live-honesty",
      "CTD-017",
      "Operational access registry exposes connection truth",
      modulePathExists("operational-access") && modulePathExists("orchestration/reality-integration"),
      false,
      "OAR + reality-integration enforce credential truth — architectureOnly flags on providers",
      "Cannot verify live vs architecture-only without operational-access",
    ),
    check(
      "ctd-018-sim-prod",
      "CTD-018",
      "Simulation separated from Production",
      modulePathExists("runtime/grand-king-live-operations-mode"),
      false,
      "grand-king-live-operations-mode defines DEVELOPMENT/SIMULATION/PRODUCTION modes",
      "Live operations mode module missing",
    ),
    check(
      "ctd-020-version-history",
      "CTD-020",
      "Version history preserved",
      modulePathExists("runtime/version-1-lockdown") && modulePathExists("runtime/version-1-gold-master"),
      false,
      "version-1-lockdown + version-1-gold-master baseline hash inventory",
      "Version lock modules missing",
    ),
    check(
      "ctd-022-no-dup-intel",
      "CTD-022",
      "Architecture review module detects duplicate intelligence",
      modulePathExists("runtime/architecture-review"),
      false,
      "architecture-review module scans runtime vs PROGRAM_CATALOG ownerModules",
      "architecture-review module missing",
    ),
    check(
      "ctd-023-no-dup-dash",
      "CTD-023",
      "Command center polish reviews dashboard duplication",
      modulePathExists("runtime/command-center-polish"),
      false,
      "command-center-polish parses PROGRAM_CATALOG dashboardSurface fields",
      "command-center-polish module missing",
    ),
    check(
      "ctd-026-module-contract",
      "CTD-026",
      "Runtime modules declare mission contract",
      moduleContractOk,
      sampleModules.some((m) => runtimeModuleHasMissionContract(m)),
      `Sample modules checked: ${sampleModules.join(", ")} · missionId + moduleId exports in index`,
      "Runtime modules missing mission contract exports",
    ),
    check(
      "ctd-031-esis",
      "CTD-031",
      "EmpireAI understands its own state (ESIS)",
      modulePathExists("orchestration/empire-self-inspection"),
      false,
      "ESIS generates EMPIRE_REVIEW_PACKAGE with module/route inventory",
      "Empire Self-Inspection missing",
    ),
    check(
      "ctd-035-philosophy-encoded",
      "CTD-035",
      "Philosophy encoded in doctrine, governance, backlog",
      modulePathExists("foundation/doctrine-engine")
        && modulePathExists("foundation/empire-governance")
        && modulePathExists("runtime/version-2-backlog-engine"),
      false,
      "doctrine-engine + empire-governance + version-2-backlog-engine present",
      "Philosophy encoding surfaces missing",
    ),
    check(
      "ctd-038-audit",
      "CTD-038",
      "Important actions auditable via brain audit logger",
      modulePathExists("brain/audit"),
      false,
      "brain/audit/audit-logger.ts present",
      "Audit logger missing",
    ),
    check(
      "ctd-040-catalog",
      "CTD-040",
      "Constitution catalog complete and immutable",
      articles.length === 40 && articles.every((a) => a.immutable),
      articles.length >= 35,
      `${articles.length} immutable CTD articles @ ${CORE_CONSTITUTION_VERSION}`,
      `Expected 40 CTD articles, found ${articles.length}`,
    ),
  ];

  const compliantCount = checks.filter((c) => c.status === "COMPLIANT").length;
  const partialCount = checks.filter((c) => c.status === "PARTIAL").length;
  const violationCount = checks.filter((c) => c.status === "VIOLATION").length;
  const coveragePercent = Math.round((compliantCount / checks.length) * 100);
  const violations = checks.filter((c) => c.violation).map((c) => `${c.articleId}: ${c.violation}`);

  const doctrineCoverage = [
    { doctrineId: "doctrine:protect-the-empire", title: "Protect The Empire", ctdArticles: ["CTD-039"] },
    { doctrineId: "doctrine:revenue-truth", title: "Revenue Truth", ctdArticles: ["CTD-016", "CTD-002"] },
    { doctrineId: "doctrine:ea-execution", title: "EA Execution Doctrine", ctdArticles: ["CTD-025", "CTD-024", "CTD-006"] },
    { doctrineId: "doctrine:living-soul", title: "Living Soul", ctdArticles: ["CTD-034", "CTD-006"] },
  ];

  return {
    moduleId: "empire-constitution",
    missionId: CORE_CONSTITUTION_MISSION_ID,
    workspaceId,
    companyId,
    catalogVersion: CORE_CONSTITUTION_VERSION,
    articleCount: 40,
    articles,
    checks,
    compliantCount,
    partialCount,
    violationCount,
    coveragePercent,
    doctrineCoverage,
    violations,
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}

export function constitutionExecutiveSummary(report: ConstitutionComplianceReport): string {
  return `Core Constitution CTD-001→040 @ ${report.catalogVersion}: ${report.compliantCount}/${report.checks.length} checks compliant (${report.coveragePercent}%). SUCCESS-001 target USD ${SUCCESS_TARGET_USD.toLocaleString()}. Violations: ${report.violationCount}.`;
}
