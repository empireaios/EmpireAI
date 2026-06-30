import { randomUUID } from "node:crypto";

import type { EsisInspectionReport } from "../models/esis-inspection.js";
import { inspectBackend, listAllBrainTools, listAllDatabaseTables, listAllRestRoutes } from "./backend-inspector.js";
import { inspectCommerce } from "./commerce-inspector.js";
import { inspectConnectors } from "./connector-inspector.js";
import { inspectLiveCommerceFoundation } from "./live-commerce-esis-inspector.js";
import { inspectOperationalAccessCoverage } from "../../../operational-access/services/operational-access-esis-inspector.js";
import { inspectFrontend } from "./frontend-inspector.js";
import { inspectProduction } from "./production-inspector.js";
import { deterministicHash } from "./repo-scanner.js";
import { generateVisualMaps } from "./visual-map-generator.js";
import { writeReviewPackage } from "./review-package-writer.js";
import { auditConstitutionCompliance, constitutionExecutiveSummary } from "../../../foundation/empire-constitution/services/constitution-compliance-audit.js";
import { auditGovernanceCompliance, governanceExecutiveSummary } from "../../../foundation/empire-governance-doctrine/services/governance-compliance-audit.js";
import { auditArchitectureCompliance, architectureExecutiveSummary } from "../../../foundation/empire-architecture-constraints/services/architecture-compliance-audit.js";
import { auditUxIdentityCompliance, uxIdentityExecutiveSummary } from "../../../foundation/empire-ux-identity-doctrine/services/ux-identity-compliance-audit.js";
import { auditCommercialBusinessCompliance, commercialBusinessExecutiveSummary } from "../../../foundation/empire-commercial-business-doctrine/services/commercial-compliance-audit.js";

export type RunEsisInspectionInput = {
  workspaceId?: string;
  companyId?: string;
  runValidation?: boolean;
  skipSlowTests?: boolean;
  writePackage?: boolean;
};

function buildExecutiveSummary(report: {
  backend: { modules: { length: number }; routeCount: number };
  frontend: { routeCount: number; pages: { missingImplementation: string[] }[]; unroutedPages: string[] };
  commerce: { stages: { status: string }[]; canonCompliance: string };
  connectors: { entries: { blocked: boolean }[] };
  production: { typecheck: { status: string }; tests: { status: string }; build: { status: string } };
}): string {
  const blockedCommerce = report.commerce.stages.filter((s) => s.status === "BLOCKED").length;
  const blockedConnectors = report.connectors.entries.filter((c) => c.blocked).length;
  const pagesWithGaps = report.frontend.pages.filter((p) => p.missingImplementation.length > 0).length;

  return [
    `EmpireAI self-inspection complete: ${report.backend.modules.length} backend modules, ${report.frontend.routeCount} frontend routes, ${report.connectors.entries.length} connectors.`,
    `${blockedCommerce} commerce stages blocked; ${blockedConnectors} connectors blocked from execution; ${pagesWithGaps} frontend pages with known gaps.`,
    `Production: typecheck=${report.production.typecheck.status}, tests=${report.production.tests.status}, build=${report.production.build.status}.`,
    report.commerce.canonCompliance,
  ].join(" ");
}

function buildRisks(report: {
  production: { commercialBlockers: string[]; tests: { status: string } };
  commerce: { stages: { module: string; status: string }[] };
  connectors: { entries: { providerId: string; blocked: boolean }[] };
  frontend: { unroutedPages: string[] };
}): string[] {
  const risks: string[] = [];
  if (report.production.commercialBlockers.length > 0) {
    risks.push(...report.production.commercialBlockers.map((b) => `Commercial: ${b}`));
  }
  if (report.commerce.stages.some((s) => s.module === "product-publishing-engine" && s.status === "BLOCKED")) {
    risks.push("Publication blocked — no live marketplace listing capability");
  }
  if (report.connectors.entries.filter((c) => c.providerId === "shopify" && c.blocked).length > 0) {
    risks.push("Shopify connector blocked — first sale path incomplete");
  }
  if (report.production.tests.status === "FAIL") {
    risks.push("Test suite failing — regression risk");
  }
  if (report.frontend.unroutedPages.length > 0) {
    risks.push(`${report.frontend.unroutedPages.length} unrouted dashboard pages — incomplete UX surface`);
  }
  return [...new Set(risks)].sort();
}

function buildRecommendedPriority(report: {
  production: { productionBlockers: string[] };
  commerce: { stages: { status: string }[] };
}): string {
  if (report.production.productionBlockers.length > 0) {
    return `Fix production blockers first: ${report.production.productionBlockers.join(", ")}`;
  }
  if (report.commerce.stages.some((s) => s.status === "BLOCKED")) {
    return "Implement Project Reality Phase 1–2: governance unlock + Shopify publish adapter for first real sale";
  }
  return "Run npm run empire:review with validation; connect Stripe and CJ; approve first product for launch";
}

export function runEsisInspection(input: RunEsisInspectionInput = {}): EsisInspectionReport {
  const workspaceId = input.workspaceId ?? "ws_empire_1";
  const companyId = input.companyId ?? "co-grand-king";

  const frontend = inspectFrontend();
  const backend = inspectBackend();
  const commerce = inspectCommerce(workspaceId, companyId);
  const connectors = inspectConnectors(workspaceId);
  const liveCommerce = inspectLiveCommerceFoundation(workspaceId);
  const operationalAccess = inspectOperationalAccessCoverage(workspaceId, companyId);
  const production = inspectProduction({
    runValidation: input.runValidation ?? false,
    skipSlowTests: input.skipSlowTests ?? false,
  });

  const scanBase = { frontend, backend, commerce, connectors, production };
  const visualMaps = generateVisualMaps(scanBase);
  const risks = buildRisks({ ...scanBase, frontend: { ...frontend, unroutedPages: frontend.unroutedPages } });
  if (liveCommerce.activationReadiness.blocked > 0) {
    risks.push(`Live Commerce: ${liveCommerce.activationReadiness.blocked} marketplace providers blocked from runtime activation`);
  }
  if (liveCommerce.missingApprovals.length > 0) {
    risks.push(`Live Commerce: ${liveCommerce.missingApprovals.length} providers awaiting founder approval for runtime activation`);
  }
  if (liveCommerce.credentialHealth.expiringSoon > 0) {
    risks.push(`Live Commerce: ${liveCommerce.credentialHealth.expiringSoon} credentials expiring within 7 days`);
  }
  if (operationalAccess.revenueBlockingGaps > 0) {
    risks.push(`Operational Access: ${operationalAccess.revenueBlockingGaps} revenue-blocking platform gaps`);
  }
  if (!operationalAccess.architectureComplete) {
    risks.push("Operational Access: Version 1 architecture incomplete");
  }
  const recommendedNextPriority = buildRecommendedPriority(scanBase);
  const constitutionReport = auditConstitutionCompliance(workspaceId, companyId);
  const constitution = {
    summary: constitutionExecutiveSummary(constitutionReport),
    coveragePercent: constitutionReport.coveragePercent,
    compliantCount: constitutionReport.compliantCount,
    partialCount: constitutionReport.partialCount,
    violationCount: constitutionReport.violationCount,
    articleCount: constitutionReport.articleCount,
    violations: constitutionReport.violations,
  };
  if (constitutionReport.violationCount > 0) {
    risks.push(`Constitution: ${constitutionReport.violationCount} CTD compliance violation(s)`);
  }
  const governanceReport = auditGovernanceCompliance(workspaceId, companyId);
  const governance = {
    summary: governanceExecutiveSummary(governanceReport),
    coveragePercent: governanceReport.coveragePercent,
    compliantCount: governanceReport.compliantCount,
    partialCount: governanceReport.partialCount,
    violationCount: governanceReport.violationCount,
    doctrineCount: governanceReport.doctrineCount,
    authorityMatrixCount: governanceReport.authorityMatrix.length,
    reviewPassed: governanceReport.reviewPassed,
    violations: governanceReport.violations,
  };
  if (!governanceReport.reviewPassed) {
    risks.push(`Governance: ${governanceReport.violationCount} GVD compliance violation(s) — Empire Review FAILED per GVD-029`);
  }
  const architectureReport = auditArchitectureCompliance(workspaceId, companyId);
  const architecture = {
    summary: architectureExecutiveSummary(architectureReport),
    coveragePercent: architectureReport.coveragePercent,
    compliantCount: architectureReport.compliantCount,
    partialCount: architectureReport.partialCount,
    violationCount: architectureReport.violationCount,
    constraintCount: architectureReport.constraintCount,
    dependencyReviewCount: architectureReport.dependencyReview.length,
    reviewPassed: architectureReport.reviewPassed,
    violations: architectureReport.violations,
    dependencyReview: architectureReport.dependencyReview,
  };
  if (!architectureReport.reviewPassed) {
    risks.push(`Architecture: ${architectureReport.violationCount} ACD compliance violation(s) — Empire Review FAILED per ACD-030`);
  }
  const uxIdentityReport = auditUxIdentityCompliance(workspaceId, companyId);
  const uxIdentity = {
    summary: uxIdentityExecutiveSummary(uxIdentityReport),
    coveragePercent: uxIdentityReport.coveragePercent,
    compliantCount: uxIdentityReport.compliantCount,
    partialCount: uxIdentityReport.partialCount,
    violationCount: uxIdentityReport.violationCount,
    doctrineCount: uxIdentityReport.doctrineCount,
    identityCoverageCount: uxIdentityReport.identityCoverage.length,
    uxCoverageCount: uxIdentityReport.uxCoverage.length,
    navigationReviewCount: uxIdentityReport.navigationReview.length,
    reviewPassed: uxIdentityReport.reviewPassed,
    violations: uxIdentityReport.violations,
    navigationReview: uxIdentityReport.navigationReview,
  };
  if (!uxIdentityReport.reviewPassed) {
    risks.push(`UX & Identity: ${uxIdentityReport.violationCount} UID compliance violation(s) — Empire Review FAILED`);
  }
  const commercialReport = auditCommercialBusinessCompliance(workspaceId, companyId);
  const commercial = {
    summary: commercialBusinessExecutiveSummary(commercialReport),
    coveragePercent: commercialReport.coveragePercent,
    compliantCount: commercialReport.compliantCount,
    partialCount: commercialReport.partialCount,
    violationCount: commercialReport.violationCount,
    doctrineCount: commercialReport.doctrineCount,
    businessRuleCount: commercialReport.businessRuleCoverage.length,
    integrityReviewCount: commercialReport.commercialIntegrityReview.length,
    reviewPassed: commercialReport.reviewPassed,
    violations: commercialReport.violations,
    businessRuleCoverage: commercialReport.businessRuleCoverage,
    commercialIntegrityReview: commercialReport.commercialIntegrityReview,
  };
  if (!commercialReport.reviewPassed) {
    risks.push(`Commercial: ${commercialReport.violationCount} CBD compliance violation(s) — Empire Review FAILED`);
  }
  const executiveSummary = [
    buildExecutiveSummary({ ...scanBase, commerce, connectors, backend, frontend, production }),
    liveCommerce.summary,
    operationalAccess.summary,
    constitution.summary,
    governance.summary,
    architecture.summary,
    uxIdentity.summary,
    commercial.summary,
  ].join(" ");

  const hashPayload = {
    frontend: frontend.pages.map((p) => p.route),
    backend: backend.modules.map((m) => m.moduleId),
    commerce: commerce.stages.map((s) => `${s.stage}:${s.status}`),
    connectors: connectors.entries.map((c) => `${c.providerId}:${c.connection}`),
    routes: listAllRestRoutes().length,
    tools: listAllBrainTools().length,
    tables: listAllDatabaseTables().length,
  };

  const report: EsisInspectionReport = {
    reportId: randomUUID(),
    generatedAt: new Date().toISOString(),
    workspaceId,
    companyId,
    deterministicHash: deterministicHash(hashPayload),
    executiveSummary,
    frontend,
    backend,
    commerce,
    connectors,
    production,
    visualMaps,
    risks,
    recommendedNextPriority,
    constitution,
    governance,
    architecture,
    uxIdentity,
    commercial,
  };

  if (input.writePackage !== false) {
    writeReviewPackage(report);
  }

  return report;
}

export function generateReviewPackageOnly(input: RunEsisInspectionInput = {}): { path: string; report: EsisInspectionReport } {
  const report = runEsisInspection({ ...input, writePackage: true });
  return { path: "EMPIRE_REVIEW_PACKAGE.md", report };
}
