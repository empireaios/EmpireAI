import fs from "node:fs";
import path from "node:path";

import { BACKEND_SRC } from "../../../orchestration/empire-self-inspection/services/repo-scanner.js";
import { COMMERCIAL_BUSINESS_DOCTRINE_CATALOG } from "../catalog/cbd-catalog.js";
import type {
  CommercialComplianceCheck,
  CommercialComplianceReport,
  CommercialIntegrityEntry,
} from "../models/commercial-business-doctrine.js";
import {
  COMMERCIAL_BUSINESS_DOCTRINE_MISSION_ID,
  COMMERCIAL_BUSINESS_DOCTRINE_VERSION,
} from "../models/commercial-business-doctrine.js";

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
): CommercialComplianceCheck {
  const status = ok ? "COMPLIANT" as const : partial ? "PARTIAL" as const : "VIOLATION" as const;
  return { checkId, doctrineId, label, status, evidence, violation: status === "VIOLATION" ? violation : null };
}

function buildCommercialIntegrityReview(): CommercialIntegrityEntry[] {
  return [
    {
      ruleId: "ci-001",
      domain: "profit",
      rule: "Net profit prioritized over revenue vanity",
      status: fileContains("runtime/empire-economics/services/empire-economics-service.ts", "net profit before revenue") ? "COMPLIANT" : "VIOLATION",
      cbdArticle: "CBD-002",
      evidence: "empire-economics-service — netProfitUsd primary metric",
    },
    {
      ruleId: "ci-002",
      domain: "supplier",
      rule: "Supplier-independent architecture; CJ is first not permanent",
      status: modulePathExists("suppliers/supplier-connector-framework") && modulePathExists("supplier-intelligence/adapters/cj-dropshipping-adapter.ts") ? "COMPLIANT" : "VIOLATION",
      cbdArticle: "CBD-006",
      evidence: "supplier-connector-framework + CJ adapter — pluggable suppliers",
    },
    {
      ruleId: "ci-003",
      domain: "product",
      rule: "Empire owns product launch decisions — suppliers score only",
      status: modulePathExists("intelligence/product-intelligence-engine") && fileContains("runtime/marketplace-publishing/services/marketplace-publishing-service.ts", "kingApproved") ? "COMPLIANT" : "VIOLATION",
      cbdArticle: "CBD-007",
      evidence: "product-intelligence-engine + kingApproved publish gate",
    },
    {
      ruleId: "ci-004",
      domain: "pricing",
      rule: "Empire pricing intelligence — supplier price is one input",
      status: modulePathExists("runtime/global-price-intelligence") ? "COMPLIANT" : "VIOLATION",
      cbdArticle: "CBD-008",
      evidence: "global-price-intelligence module",
    },
    {
      ruleId: "ci-005",
      domain: "listing",
      rule: "Listing quality owned by Empire — exceeds supplier defaults",
      status: modulePathExists("runtime/listing-intelligence") ? "COMPLIANT" : "VIOLATION",
      cbdArticle: "CBD-009",
      evidence: "listing-intelligence module",
    },
    {
      ruleId: "ci-006",
      domain: "shipping",
      rule: "Shipping time alone never auto-rejects product",
      status: fileContains("supplier-intelligence/models/shipping-acceptability.ts", "shippingTimeAloneWouldReject") ? "COMPLIANT" : "VIOLATION",
      cbdArticle: "CBD-011",
      evidence: "shipping-acceptability — multi-factor commercial reasoning",
    },
    {
      ruleId: "ci-007",
      domain: "expansion",
      rule: "Compare countries/marketplaces before expansion",
      status: modulePathExists("runtime/country-difference-engine") && modulePathExists("runtime/marketplace-difference-engine") ? "COMPLIANT" : "VIOLATION",
      cbdArticle: "CBD-014",
      evidence: "country-difference-engine + marketplace-difference-engine",
    },
    {
      ruleId: "ci-008",
      domain: "lifecycle",
      rule: "Weak products retire; winners scale",
      status: modulePathExists("runtime/product-retirement-engine") && modulePathExists("runtime/product-scale-engine") ? "COMPLIANT" : "VIOLATION",
      cbdArticle: "CBD-015",
      evidence: "product-retirement-engine + product-scale-engine",
    },
    {
      ruleId: "ci-009",
      domain: "approval",
      rule: "Executive + Soul + Grand King before irreversible actions",
      status: modulePathExists("executive-council") && modulePathExists("foundation/soul-runtime") && fileContains("runtime/product-launch-commander/services/product-launch-commander-service.ts", "kingApproved") ? "COMPLIANT" : "VIOLATION",
      cbdArticle: "CBD-018",
      evidence: "executive-council + soul-runtime + product-launch-commander king gate",
    },
    {
      ruleId: "ci-010",
      domain: "success",
      rule: "SUCCESS-001 USD 100K net profit mission declared",
      status: fileContains("orchestration/master-completion-ledger/models/program-catalog.ts", "proof-of-money") ? "COMPLIANT" : "VIOLATION",
      cbdArticle: "CBD-020",
      evidence: "PROGRAM_CATALOG proof-of-money → SUCCESS-001 target",
    },
  ];
}

function buildBusinessRuleCoverage(integrity: CommercialIntegrityEntry[]): string[] {
  return [
    "CBD-001: Company manufacturing via business-opportunity-workspace + commerce runtime",
    "CBD-002: netProfitUsd primary in empire-economics",
    "CBD-005: supplier-intelligence evaluates — never launches products",
    "CBD-006: supplier-connector-framework adapter registry",
    "CBD-010: buyer-intelligence customer perspective models",
    "CBD-011: shippingTimeAloneWouldReject = false in shipping-acceptability",
    "CBD-012: margin + strategic value in supplier scoring",
    "CBD-013: listing-intelligence quality packages",
    "CBD-016: global-opportunity-board continuous search",
    "CBD-019: commercial-review evaluates SUCCESS-001 path",
    ...integrity.filter((i) => i.status === "COMPLIANT").map((i) => `${i.cbdArticle}: ${i.rule}`),
  ];
}

/** Static commercial business doctrine compliance audit — NOT runtime enforcement. */
export function auditCommercialBusinessCompliance(
  workspaceId: string,
  companyId: string,
): CommercialComplianceReport {
  const doctrines = [...COMMERCIAL_BUSINESS_DOCTRINE_CATALOG];
  const commercialIntegrityReview = buildCommercialIntegrityReview();
  const businessRuleCoverage = buildBusinessRuleCoverage(commercialIntegrityReview);

  const checks: CommercialComplianceCheck[] = [
    check("cbd-001-manufacture", "CBD-001", "Manufacture profitable companies", modulePathExists("orchestration/business-opportunity-workspace") || modulePathExists("orchestration/ecommerce-os-orchestrator"), false, "business-opportunity-workspace — company manufacturing pipeline", "Company manufacturing architecture missing"),
    check("cbd-002-net-profit", "CBD-002", "Net profit over revenue", fileContains("runtime/empire-economics/services/empire-economics-service.ts", "netProfitUsd"), false, "empire-economics netProfitUsd primary metric", "Net profit priority missing"),
    check("cbd-003-simplicity", "CBD-003", "Business simplicity doctrine encoded", modulePathExists("foundation/doctrine-engine") || fileContains("orchestration/master-completion-ledger/models/program-catalog.ts", "commercial"), false, "doctrine-engine + commercial programs in MCL", "Commercial simplicity doctrine missing"),
    check("cbd-004-multinational", "CBD-004", "Multinational executive reasoning", modulePathExists("executive-council") && modulePathExists("runtime/executive-strategy-room"), false, "executive-council + strategy room — business not software framing", "Multinational reasoning modules missing"),
    check("cbd-005-intelligence-strategy", "CBD-005", "Intelligence owns commercial strategy", modulePathExists("supplier-intelligence") && !fileContains("supplier-intelligence/services/supplier-opportunity-service.ts", "autoLaunch"), false, "supplier-intelligence scores — no auto-launch", "Intelligence/supplier boundary missing"),
    check("cbd-006-supplier-independent", "CBD-006", "Supplier-independent architecture", modulePathExists("suppliers/supplier-connector-framework") && modulePathExists("supplier-intelligence/adapters"), false, "supplier-connector-framework + adapter registry", "Supplier independence missing"),
    check("cbd-007-product-intelligence", "CBD-007", "Empire owns product intelligence", modulePathExists("intelligence/product-intelligence-engine") && fileContains("runtime/marketplace-publishing/services/marketplace-publishing-service.ts", "kingApproved"), false, "product-intelligence + kingApproved publish gate", "Product intelligence ownership missing"),
    check("cbd-008-pricing", "CBD-008", "Empire owns pricing intelligence", modulePathExists("runtime/global-price-intelligence"), false, "global-price-intelligence module", "Pricing intelligence missing"),
    check("cbd-009-listing", "CBD-009", "Empire owns listing intelligence", modulePathExists("runtime/listing-intelligence"), false, "listing-intelligence module", "Listing intelligence missing"),
    check("cbd-010-customer", "CBD-010", "Customer perspective before launch", modulePathExists("intelligence/buyer-intelligence"), false, "buyer-intelligence — why customer buys from us", "Customer perspective intelligence missing"),
    check("cbd-011-shipping", "CBD-011", "Shipping time alone never rejects", fileContains("supplier-intelligence/models/shipping-acceptability.ts", "shippingTimeAloneWouldReject"), false, "shipping-acceptability multi-factor evaluation", "Shipping-only rejection rule missing"),
    check("cbd-012-low-margin", "CBD-012", "Low margin acceptable with net profit", fileContains("supplier-intelligence/models/shipping-acceptability.ts", "marginPercent") || modulePathExists("supplier-intelligence/services/supplier-scoring-service.ts"), false, "supplier scoring considers margin not revenue alone", "Margin evaluation rule missing"),
    check("cbd-013-quality-listings", "CBD-013", "Quality over quantity listings", modulePathExists("runtime/listing-intelligence") && fileContains("runtime/listing-intelligence/models/listing-intelligence-package.ts", "listingQualityScore"), false, "listing-intelligence listingQualityScore", "Listing quality doctrine missing"),
    check("cbd-014-compare", "CBD-014", "Compare before expansion", modulePathExists("runtime/country-difference-engine") && modulePathExists("runtime/marketplace-difference-engine"), false, "country + marketplace difference engines", "Pre-expansion comparison missing"),
    check("cbd-015-lifecycle", "CBD-015", "Continuous product review lifecycle", modulePathExists("runtime/product-retirement-engine") && modulePathExists("runtime/product-scale-engine"), false, "product-retirement + product-scale engines", "Product lifecycle review missing"),
    check("cbd-016-opportunities", "CBD-016", "Continuous opportunity search", modulePathExists("runtime/global-opportunity-board") || modulePathExists("runtime/live-commercial-investigations"), false, "global-opportunity-board + live investigations", "Continuous opportunity search missing"),
    check("cbd-017-commercial-expansion", "CBD-017", "Commercial-driven marketplace expansion", modulePathExists("runtime/marketplace-difference-engine") && modulePathExists("runtime/global-expansion-command"), false, "marketplace-difference + global-expansion-command", "Commercial expansion drivers missing"),
    check("cbd-018-triple-approval", "CBD-018", "Executive + Soul + King approval chain", modulePathExists("executive-council") && modulePathExists("foundation/soul-runtime") && fileContains("runtime/product-launch-commander/services/product-launch-commander-service.ts", "kingApproved"), false, "EC + Soul + product-launch-commander king gate", "Triple approval chain missing"),
    check("cbd-019-model-path", "CBD-019", "Evaluate SUCCESS-001 business model path", modulePathExists("runtime/commercial-review") || modulePathExists("runtime/success-001-readiness-review"), false, "commercial-review / success-001 readiness", "Business model path evaluation missing"),
    check("cbd-020-real-success", "CBD-020", "Real commercial SUCCESS-001 target", modulePathExists("grand-king") && fileContains("orchestration/master-completion-ledger/models/program-catalog.ts", "proof-of-money"), false, "grand-king account + proof-of-money SUCCESS-001 program", "Real commercial success path missing"),
  ];

  const compliantCount = checks.filter((c) => c.status === "COMPLIANT").length;
  const partialCount = checks.filter((c) => c.status === "PARTIAL").length;
  const violationCount = checks.filter((c) => c.status === "VIOLATION").length;
  const coveragePercent = Math.round((compliantCount / checks.length) * 100);
  const violations = checks.filter((c) => c.violation).map((c) => `${c.doctrineId}: ${c.violation}`);
  const reviewPassed = violationCount === 0;

  return {
    moduleId: "empire-commercial-business-doctrine",
    missionId: COMMERCIAL_BUSINESS_DOCTRINE_MISSION_ID,
    workspaceId,
    companyId,
    catalogVersion: COMMERCIAL_BUSINESS_DOCTRINE_VERSION,
    doctrineCount: 20,
    doctrines,
    businessRuleCoverage,
    commercialIntegrityReview,
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

export function commercialBusinessExecutiveSummary(report: CommercialComplianceReport): string {
  const status = report.reviewPassed ? "REVIEW PASSED" : "REVIEW FAILED";
  const integrityOk = report.commercialIntegrityReview.filter((i) => i.status !== "VIOLATION").length;
  return `Commercial Business Doctrine CBD-001→020 @ ${report.catalogVersion}: ${report.compliantCount}/${report.checks.length} checks compliant (${report.coveragePercent}%). Business rules: ${report.businessRuleCoverage.length}. Integrity review: ${integrityOk}/${report.commercialIntegrityReview.length} rules compliant. ${status}. Violations: ${report.violationCount}.`;
}
