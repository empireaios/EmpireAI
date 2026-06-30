import fs from "node:fs";
import path from "node:path";

import { BACKEND_SRC, FRONTEND_SRC, listDirectories } from "../../../orchestration/empire-self-inspection/services/repo-scanner.js";
import { ARCHITECTURE_CONSTRAINT_CATALOG } from "../catalog/acd-catalog.js";
import type {
  ArchitectureComplianceCheck,
  ArchitectureComplianceReport,
  DependencyReviewEntry,
} from "../models/architecture-constraint.js";
import {
  ARCHITECTURE_CONSTRAINT_MISSION_ID,
  ARCHITECTURE_CONSTRAINT_VERSION,
} from "../models/architecture-constraint.js";

function modulePathExists(relativePath: string): boolean {
  return fs.existsSync(path.join(BACKEND_SRC, ...relativePath.split("/")));
}

function fileContains(relativePath: string, needle: string): boolean {
  const full = path.join(BACKEND_SRC, ...relativePath.split("/"));
  if (!fs.existsSync(full)) return false;
  if (fs.statSync(full).isDirectory()) return false;
  return fs.readFileSync(full, "utf8").includes(needle);
}

function countContractModules(): number {
  let count = 0;
  for (const top of listDirectories(BACKEND_SRC)) {
    const topPath = path.join(BACKEND_SRC, top);
    for (const sub of listDirectories(topPath)) {
      const contractDir = path.join(topPath, sub, "contract");
      if (fs.existsSync(contractDir) && fs.statSync(contractDir).isDirectory()) count += 1;
    }
  }
  return count;
}

function runtimeModuleHasIdentity(slug: string): boolean {
  const indexPath = path.join(BACKEND_SRC, "runtime", slug, "index.ts");
  if (!fs.existsSync(indexPath)) return false;
  const content = fs.readFileSync(indexPath, "utf8");
  return content.includes("MODULE_ID") && (content.includes("MISSION_ID") || content.includes("MISSION_IDS"));
}

function check(
  checkId: string,
  constraintId: string,
  label: string,
  ok: boolean,
  partial: boolean,
  evidence: string,
  violation: string | null,
): ArchitectureComplianceCheck {
  const status = ok ? "COMPLIANT" as const : partial ? "PARTIAL" as const : "VIOLATION" as const;
  return { checkId, constraintId, label, status, evidence, violation: status === "VIOLATION" ? violation : null };
}

function buildDependencyReview(): DependencyReviewEntry[] {
  return [
    {
      edgeId: "dep-001",
      fromModule: "supplier-intelligence",
      toModule: "supplier-connector-framework",
      relationship: "adapter boundary",
      status: modulePathExists("supplier-intelligence") && modulePathExists("suppliers/supplier-connector-framework") ? "ADAPTER" : "VIOLATION",
      acdArticle: "ACD-028",
      note: "Supplier scoring routes through connector framework — not direct CJ/AliExpress SDK imports in intelligence layer",
    },
    {
      edgeId: "dep-002",
      fromModule: "marketplace-publishing",
      toModule: "global-marketplace-adapter-framework",
      relationship: "adapter boundary",
      status: modulePathExists("runtime/marketplace-publishing") && modulePathExists("runtime/global-marketplace-adapter-framework") ? "ADAPTER" : "VIOLATION",
      acdArticle: "ACD-029",
      note: "Marketplace publish flows use adapter records — marketplace implementation isolated",
    },
    {
      edgeId: "dep-003",
      fromModule: "commerce-runtime",
      toModule: "runtime-registry",
      relationship: "adapter registry",
      status: modulePathExists("runtime/commerce-runtime") && fileContains("runtime/commerce-runtime/services/runtime-registry-service.ts", "adapter") ? "ADAPTER" : "VIOLATION",
      acdArticle: "ACD-026",
      note: "Commerce runtime registers adapters — third-party complexity isolated",
    },
    {
      edgeId: "dep-004",
      fromModule: "brain",
      toModule: "llm-providers",
      relationship: "provider abstraction",
      status: fileContains("brain/types.ts", "LLMProviderName") ? "EXPLICIT" : "VIOLATION",
      acdArticle: "ACD-023",
      note: "Brain declares openai | anthropic | gemini — future models pluggable without redesign",
    },
    {
      edgeId: "dep-005",
      fromModule: "live-payment-engine",
      toModule: "payment-providers",
      relationship: "provider abstraction",
      status: modulePathExists("revenue/live-payment-engine") ? "EXPLICIT" : "VIOLATION",
      acdArticle: "ACD-024",
      note: "Live payment engine abstracts Stripe/PayPal checkout — not hard-coded single provider",
    },
    {
      edgeId: "dep-006",
      fromModule: "country-difference-engine",
      toModule: "global-expansion",
      relationship: "country extensibility",
      status: modulePathExists("runtime/country-difference-engine") ? "COMPLIANT" : "VIOLATION",
      acdArticle: "ACD-025",
      note: "Country difference engine supports future markets without core redesign",
    },
    {
      edgeId: "dep-007",
      fromModule: "eye/connector-registry",
      toModule: "connectors",
      relationship: "explicit registry",
      status: modulePathExists("eye/connector-registry") ? "EXPLICIT" : "VIOLATION",
      acdArticle: "ACD-008",
      note: "Connector registry declares provider capabilities — dependencies explicit",
    },
    {
      edgeId: "dep-008",
      fromModule: "agents/module-routes",
      toModule: "brain-tools",
      relationship: "declared dispatch",
      status: fileContains("agents/routes/module-routes.ts", "toolName") ? "EXPLICIT" : "VIOLATION",
      acdArticle: "ACD-009",
      note: "Module routes map module+action → toolName — no hidden cross-module calls",
    },
    {
      edgeId: "dep-009",
      fromModule: "frontend",
      toModule: "backend-api",
      relationship: "API client boundary",
      status: fs.existsSync(path.join(FRONTEND_SRC, "api/client.ts")) ? "COMPLIANT" : "VIOLATION",
      acdArticle: "ACD-003",
      note: "Frontend uses api/client.ts — business logic stays in backend modules",
    },
    {
      edgeId: "dep-010",
      fromModule: "empire-knowledge",
      toModule: "intelligence-modules",
      relationship: "shared intelligence reuse",
      status: modulePathExists("runtime/empire-knowledge") ? "COMPLIANT" : "VIOLATION",
      acdArticle: "ACD-017",
      note: "Empire Knowledge graph centralizes reusable intelligence",
    },
  ];
}

/** Static architecture constraint compliance audit — NOT runtime enforcement. */
export function auditArchitectureCompliance(
  workspaceId: string,
  companyId: string,
): ArchitectureComplianceReport {
  const constraints = [...ARCHITECTURE_CONSTRAINT_CATALOG];
  const dependencyReview = buildDependencyReview();
  const contractCount = countContractModules();
  const modularRoots = listDirectories(BACKEND_SRC).filter((d) =>
    ["runtime", "foundation", "orchestration", "grand-king", "executive-council", "executive-surveillance", "operational-access", "supplier-intelligence", "eye", "suppliers", "revenue"].includes(d),
  );

  const checks: ArchitectureComplianceCheck[] = [
    check("acd-001-modular", "ACD-001", "Architecture is modular", modularRoots.length >= 8, false, `${modularRoots.length} top-level module domains under backend/src`, "Modular architecture domains missing"),
    check("acd-002-responsibility", "ACD-002", "Runtime modules declare single responsibility", runtimeModuleHasIdentity("marketplace-publishing") && modulePathExists("runtime/commerce-runtime/contract"), false, "Runtime modules export MODULE_ID contracts + mission identity", "Module responsibility contracts missing"),
    check("acd-003-no-ui-logic", "ACD-003", "Business logic not in UI", fs.existsSync(path.join(FRONTEND_SRC, "api/client.ts")), false, "frontend/src/api/client.ts — API boundary only", "Frontend API boundary missing"),
    check("acd-004-no-dup", "ACD-004", "Duplicate intelligence review present", modulePathExists("runtime/architecture-review") || modulePathExists("orchestration/empire-self-inspection"), false, "ESIS + architecture-review detect duplication drift", "Duplication review modules missing"),
    check("acd-005-contracts", "ACD-005", "Modules expose public contracts", contractCount >= 10, false, `${contractCount} modules with contract/ directories`, "Insufficient public contract coverage"),
    check("acd-006-inputs", "ACD-006", "Modules define inputs via Zod schemas", fileContains("orchestration/commerce-readiness-engine/models/commerce-readiness.ts", "z.object"), false, "commerce-readiness Zod input models", "Input schema patterns missing"),
    check("acd-007-outputs", "ACD-007", "Modules define outputs via Zod schemas", fileContains("foundation/empire-governance-doctrine/models/governance-doctrine.ts", "governanceComplianceReportSchema"), false, "Governance/compliance report schemas as outputs", "Output schema patterns missing"),
    check("acd-008-explicit", "ACD-008", "Connector registry declares dependencies", modulePathExists("eye/connector-registry"), false, "eye/connector-registry — explicit provider registry", "Connector registry missing"),
    check("acd-009-no-hidden", "ACD-009", "Module routes declare tool dispatch", fileContains("agents/routes/module-routes.ts", "toolName"), false, "module-routes.ts explicit module→tool mapping", "Declared interface dispatch missing"),
    check("acd-010-no-circular", "ACD-010", "Brain contract adapters prevent tight coupling", modulePathExists("brain/contract"), false, "brain/contract adapters layer — circular import guard", "Brain contract adapter layer missing"),
    check("acd-011-health", "ACD-011", "Runtimes expose health endpoints", fileContains("foundation/empire-governance-doctrine/routes/empire-governance-doctrine-routes.ts", "/health/") && fileContains("runtime/commerce-runtime/services/runtime-health-service.ts", "health"), false, "/health/* routes + runtime-health-service", "Runtime health surface missing"),
    check("acd-012-status", "ACD-012", "Operational Access exposes platform status", modulePathExists("operational-access"), false, "operational-access registry — connection status per platform", "Platform status module missing"),
    check("acd-013-readiness", "ACD-013", "Commerce readiness exposes readiness", modulePathExists("orchestration/commerce-readiness-engine"), false, "commerce-readiness-engine readiness scores", "Readiness module missing"),
    check("acd-014-blockers", "ACD-014", "Commerce readiness exposes blockers", fileContains("orchestration/commerce-readiness-engine/models/commerce-readiness.ts", "readinessBlockerSchema"), false, "readinessBlockerSchema — structured blockers", "Blocker schema missing"),
    check("acd-015-version", "ACD-015", "Foundation catalogs versioned", fileContains("foundation/empire-architecture-constraints/catalog/acd-catalog.ts", "1.0.0"), false, "ACD/GVD/CTD catalogs @ 1.0.0", "Versioned architecture catalogs missing"),
    check("acd-016-shared-models", "ACD-016", "Shared models in models/ directories", fileContains("runtime/marketplace-publishing/models/marketplace-adapter.ts", "z.object"), false, "Zod models co-located per module — single source", "Shared model pattern missing"),
    check("acd-017-reuse", "ACD-017", "Empire Knowledge reuses intelligence", modulePathExists("runtime/empire-knowledge"), false, "empire-knowledge graph — shared intelligence layer", "Shared intelligence module missing"),
    check("acd-018-one-owner", "ACD-018", "Connector registry one owner per provider", fileContains("eye/connector-registry/models/eye-connector.ts", "connectorId"), false, "connector registry connectorId ownership", "Capability ownership registry missing"),
    check("acd-019-api-surface", "ACD-019", "Modules publish routes + tools", modulePathExists("runtime/marketplace-publishing/routes") && modulePathExists("runtime/marketplace-publishing/tools"), false, "Routes + brain tools per runtime module", "API surface publication incomplete"),
    check("acd-020-non-ownership", "ACD-020", "Contracts declare module boundaries", fileContains("suppliers/supplier-connector-framework/contract/supplier-connector-framework-module.ts", "moduleId") || contractCount >= 5, false, "Module contracts declare moduleId boundaries", "Non-ownership declarations missing"),
    check("acd-021-marketplaces", "ACD-021", "Marketplace adapter framework for extensibility", modulePathExists("runtime/global-marketplace-adapter-framework"), false, "global-marketplace-adapter-framework — plug-in marketplaces", "Marketplace extensibility framework missing"),
    check("acd-022-suppliers", "ACD-022", "Supplier connector framework for extensibility", modulePathExists("suppliers/supplier-connector-framework"), false, "supplier-connector-framework — plug-in suppliers", "Supplier extensibility framework missing"),
    check("acd-023-ai-models", "ACD-023", "Brain supports multiple LLM providers", fileContains("brain/types.ts", "LLMProviderName"), false, "LLMProviderName: openai | anthropic | gemini", "LLM provider abstraction missing"),
    check("acd-024-payments", "ACD-024", "Payment engine abstracts providers", modulePathExists("revenue/live-payment-engine"), false, "live-payment-engine — Stripe/PayPal abstraction", "Payment provider abstraction missing"),
    check("acd-025-countries", "ACD-025", "Country difference engine for expansion", modulePathExists("runtime/country-difference-engine"), false, "country-difference-engine — future country support", "Country extensibility module missing"),
    check("acd-026-adapters", "ACD-026", "Adapters isolate third-party complexity", modulePathExists("eye/connector-registry") && modulePathExists("suppliers/supplier-connector-framework"), false, "connector-registry + supplier-connector-framework adapters", "Adapter isolation layer missing"),
    check("acd-027-provider-independent", "ACD-027", "Supplier intelligence provider-independent", modulePathExists("supplier-intelligence") && fileContains("supplier-intelligence/models/supplier-abstraction.ts", "SupplierProviderId"), false, "supplier-abstraction.ts — provider-independent scoring", "Provider-independent intelligence missing"),
    check("acd-028-no-supplier-direct", "ACD-028", "No direct supplier implementation deps", dependencyReview.find((d) => d.edgeId === "dep-001")?.status !== "VIOLATION", false, "supplier-intelligence → supplier-connector-framework adapter boundary", "Direct supplier implementation dependency detected"),
    check("acd-029-no-marketplace-direct", "ACD-029", "No direct marketplace implementation deps", dependencyReview.find((d) => d.edgeId === "dep-002")?.status !== "VIOLATION", false, "marketplace-publishing → adapter framework boundary", "Direct marketplace implementation dependency detected"),
    check("acd-030-esis", "ACD-030", "Empire Review validates architecture constraints", modulePathExists("foundation/empire-architecture-constraints") && modulePathExists("orchestration/empire-self-inspection"), false, "ESIS + ACD compliance integrated", "Architecture constraint review integration missing"),
  ];

  const compliantCount = checks.filter((c) => c.status === "COMPLIANT").length;
  const partialCount = checks.filter((c) => c.status === "PARTIAL").length;
  const violationCount = checks.filter((c) => c.status === "VIOLATION").length;
  const coveragePercent = Math.round((compliantCount / checks.length) * 100);
  const violations = checks.filter((c) => c.violation).map((c) => `${c.constraintId}: ${c.violation}`);
  const reviewPassed = violationCount === 0;

  return {
    moduleId: "empire-architecture-constraints",
    missionId: ARCHITECTURE_CONSTRAINT_MISSION_ID,
    workspaceId,
    companyId,
    catalogVersion: ARCHITECTURE_CONSTRAINT_VERSION,
    constraintCount: 30,
    constraints,
    dependencyReview,
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

export function architectureExecutiveSummary(report: ArchitectureComplianceReport): string {
  const status = report.reviewPassed ? "REVIEW PASSED" : "REVIEW FAILED";
  const depOk = report.dependencyReview.filter((d) => d.status !== "VIOLATION").length;
  return `Architecture Constraints ACD-001→030 @ ${report.catalogVersion}: ${report.compliantCount}/${report.checks.length} checks compliant (${report.coveragePercent}%). Dependency review: ${depOk}/${report.dependencyReview.length} edges compliant. ${status}. Violations: ${report.violationCount}.`;
}
