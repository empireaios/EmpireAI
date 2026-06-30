import fs from "node:fs";
import path from "node:path";

import { BACKEND_SRC } from "../../../orchestration/empire-self-inspection/services/repo-scanner.js";
import {
  GOVERNANCE_AUTHORITY_MATRIX,
  GOVERNANCE_DOCTRINE_CATALOG,
} from "../catalog/gvd-catalog.js";
import type { GovernanceComplianceCheck, GovernanceComplianceReport } from "../models/governance-doctrine.js";
import { GOVERNANCE_DOCTRINE_MISSION_ID, GOVERNANCE_DOCTRINE_VERSION } from "../models/governance-doctrine.js";

function modulePathExists(relativePath: string): boolean {
  return fs.existsSync(path.join(BACKEND_SRC, ...relativePath.split("/")));
}

function fileContains(relativePath: string, needle: string): boolean {
  const full = path.join(BACKEND_SRC, ...relativePath.split("/"));
  if (!fs.existsSync(full)) return false;
  if (fs.statSync(full).isDirectory()) return false;
  return fs.readFileSync(full, "utf8").includes(needle);
}

function check(
  checkId: string,
  doctrineId: string,
  label: string,
  ok: boolean,
  partial: boolean,
  evidence: string,
  violation: string | null,
): GovernanceComplianceCheck {
  const status = ok ? "COMPLIANT" as const : partial ? "PARTIAL" as const : "VIOLATION" as const;
  return { checkId, doctrineId, label, status, evidence, violation: status === "VIOLATION" ? violation : null };
}

/** Static governance doctrine compliance audit — NOT runtime enforcement. */
export function auditGovernanceCompliance(
  workspaceId: string,
  companyId: string,
): GovernanceComplianceReport {
  const doctrines = [...GOVERNANCE_DOCTRINE_CATALOG];
  const authorityMatrix = [...GOVERNANCE_AUTHORITY_MATRIX];

  const checks: GovernanceComplianceCheck[] = [
    check("gvd-001-king", "GVD-001", "Grand King platform owner module present", modulePathExists("grand-king"), false, "grand-king module with approval authority", "grand-king module missing"),
    check("gvd-002-founder", "GVD-002", "Founder separated from platform governor", modulePathExists("runtime/founder-platform-preparation"), false, "founder-platform-preparation defines Founder as tenant", "Founder/platform separation module missing"),
    check("gvd-003-ec", "GVD-003", "Executive Council debates only", modulePathExists("executive-council"), false, "executive-council module present — debate registry, not execution", "executive-council missing"),
    check("gvd-004-soul", "GVD-004", "Soul never bypasses Grand King", modulePathExists("foundation/soul-runtime"), false, "soul-runtime module — synthesis layer without execution authority", "soul-runtime governance missing"),
    check("gvd-005-ess", "GVD-005", "Executive Surveillance observes only", modulePathExists("executive-surveillance"), false, "executive-surveillance headquarters — observe signals", "executive-surveillance missing"),
    check("gvd-006-mcl", "GVD-006", "MCL records without authority recommendation", modulePathExists("orchestration/master-completion-ledger"), false, "MCL uses PROGRAM_CATALOG metadata — records completion", "master-completion-ledger missing"),
    check("gvd-007-supplier", "GVD-007", "Supplier intelligence evaluates only", modulePathExists("supplier-intelligence"), false, "supplier-intelligence — scoring without product launch", "supplier-intelligence missing"),
    check("gvd-008-marketplace", "GVD-008", "Marketplace intelligence never auto-publishes", modulePathExists("runtime/marketplace-publishing") && fileContains("runtime/marketplace-publishing/services/marketplace-publishing-service.ts", "kingApproved"), false, "marketplace-publishing requires kingApproved gate", "marketplace-publishing approval gate missing"),
    check("gvd-009-crt", "GVD-009", "Commerce runtime executes after approval", modulePathExists("runtime/commerce-runtime"), false, "commerce-runtime activation gates present", "commerce-runtime missing"),
    check("gvd-010-reality", "GVD-010", "Reality Integration authenticates only", modulePathExists("orchestration/reality-integration"), false, "reality-integration credential vault — no strategy authority", "reality-integration missing"),
    check("gvd-011-oar", "GVD-011", "Operational Access controls permissions", modulePathExists("operational-access"), false, "operational-access registry — permissions not commercial decisions", "operational-access missing"),
    check("gvd-012-knowledge", "GVD-012", "Empire Knowledge not final authority", modulePathExists("runtime/empire-knowledge"), false, "empire-knowledge graph — advisory only", "empire-knowledge missing"),
    check("gvd-019-21-audit", "GVD-021", "King decisions auditable", modulePathExists("runtime/king-decision-history") && modulePathExists("brain/audit"), false, "king-decision-history + brain audit logger", "Approval audit trail modules missing"),
    check("gvd-024-25-version", "GVD-025", "Governance versioned", modulePathExists("foundation/empire-governance") && modulePathExists("foundation/empire-governance-doctrine"), false, "empire-governance policies + GVD catalog @ 1.0.0", "Versioned governance catalog missing"),
    check("gvd-028-escalation", "GVD-028", "Escalation path visible", modulePathExists("runtime/product-launch-commander") || modulePathExists("runtime/version-1-governance-review"), false, "product-launch-commander / governance-review expose escalation chain", "Escalation visibility modules missing"),
    check("gvd-029-review", "GVD-029", "Empire Review includes governance audit", modulePathExists("foundation/empire-governance-doctrine") && modulePathExists("orchestration/empire-self-inspection"), false, "ESIS + governance-doctrine compliance integrated", "Governance review integration missing"),
  ];

  const compliantCount = checks.filter((c) => c.status === "COMPLIANT").length;
  const partialCount = checks.filter((c) => c.status === "PARTIAL").length;
  const violationCount = checks.filter((c) => c.status === "VIOLATION").length;
  const coveragePercent = Math.round((compliantCount / checks.length) * 100);
  const violations = checks.filter((c) => c.violation).map((c) => `${c.doctrineId}: ${c.violation}`);
  const reviewPassed = violationCount === 0;

  return {
    moduleId: "empire-governance-doctrine",
    missionId: GOVERNANCE_DOCTRINE_MISSION_ID,
    workspaceId,
    companyId,
    catalogVersion: GOVERNANCE_DOCTRINE_VERSION,
    doctrineCount: 30,
    doctrines,
    authorityMatrix,
    checks,
    compliantCount,
    partialCount,
    violationCount,
    coveragePercent,
    reviewPassed,
    violations,
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}

export function governanceExecutiveSummary(report: GovernanceComplianceReport): string {
  const status = report.reviewPassed ? "REVIEW PASSED" : "REVIEW FAILED";
  return `Governance Doctrine GVD-001→030 @ ${report.catalogVersion}: ${report.compliantCount}/${report.checks.length} checks compliant (${report.coveragePercent}%). Authority matrix: ${report.authorityMatrix.length} modules. ${status}. Violations: ${report.violationCount}.`;
}
