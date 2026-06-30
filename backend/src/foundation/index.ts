import { retentionFramework } from "../retention/retention-framework.js";
import { paymentFramework } from "../payments/payment-framework.js";
import { financialLedger } from "../finance/ledger.js";
import { treasuryEngine } from "../treasury/treasury-engine.js";
import { royaltyFramework } from "../finance/royalty-framework.js";
import { architectureValidator } from "../guardian/architecture-validator.js";
import { intelligenceFoundation } from "./intelligence-foundation.js";
import { initializeSoulFile } from "./soul-file/index.js";
import { initializeGovernancePolicies } from "./empire-governance/index.js";
import { initializeIdentityRegistry } from "./identity-registry/index.js";
import { initializeDoctrines } from "./doctrine-engine/index.js";
import { initializePolicies } from "./policy-engine/index.js";
import { initializePromiseRegister } from "./promise-register/index.js";
import { initializeKpiEngine } from "./kpi-engine/index.js";
import { initializeDecisionRegistry } from "./decision-registry/index.js";
import { initializeStrategicMemory } from "./strategic-memory-engine/index.js";

const DEFAULT_WORKSPACE = "ws_empire_1";

/** Bootstrap Intelligence Foundation for a workspace — idempotent, non-destructive. */
export function bootstrapFoundation(workspaceId = DEFAULT_WORKSPACE): void {
  retentionFramework.ensureActive(workspaceId);
  paymentFramework.ensureWallet(workspaceId, "empireai");
  paymentFramework.ensureWallet(workspaceId, "advertising");

  const summary = financialLedger.summarize(workspaceId);
  if (summary.eventCount === 0) {
    seedDemoLedgerEvents(workspaceId);
  }

  royaltyFramework.recordRoyalty(workspaceId, "mtd", "foundation-bootstrap");
  intelligenceFoundation.seedMockData(workspaceId);

  treasuryEngine.compute(workspaceId);
  architectureValidator.validate(workspaceId);
  initializeIdentityRegistry(workspaceId);
  initializeDoctrines(workspaceId);
  initializePolicies(workspaceId);
  initializePromiseRegister(workspaceId);
  initializeKpiEngine(workspaceId);
  initializeDecisionRegistry(workspaceId);
  initializeStrategicMemory(workspaceId);
  initializeGovernancePolicies(workspaceId);
  initializeSoulFile(workspaceId, "foundation-bootstrap");
}

function seedDemoLedgerEvents(workspaceId: string): void {
  const correlation = `foundation:seed:${Date.now()}`;
  financialLedger.append({
    workspaceId,
    eventType: "sale",
    amountCents: 2_840_000_00,
    direction: "credit",
    correlationId: correlation,
    source: "foundation-seed",
    description: "Portfolio revenue baseline (demo ledger)",
  });
  financialLedger.append({
    workspaceId,
    eventType: "supplier_cost",
    amountCents: 1_120_000_00,
    direction: "debit",
    correlationId: correlation,
    source: "foundation-seed",
    description: "COGS baseline (demo ledger)",
  });
  financialLedger.append({
    workspaceId,
    eventType: "advertising",
    amountCents: 640_000_00,
    direction: "debit",
    correlationId: correlation,
    source: "foundation-seed",
    description: "Ad spend baseline (demo ledger)",
  });
  financialLedger.append({
    workspaceId,
    eventType: "subscription",
    amountCents: 499_00,
    direction: "debit",
    correlationId: correlation,
    source: "foundation-seed",
    description: "EmpireAI Sovereign subscription",
  });
  financialLedger.append({
    workspaceId,
    eventType: "reserved_cash",
    amountCents: 107_950_10,
    direction: "debit",
    correlationId: correlation,
    source: "foundation-seed",
    description: "Reserved cash allocation (royalty + liabilities)",
    metadata: { bucket: "reserved_cash" },
  });
}

export { defaultConnectorRegistry } from "../connectors/registry.js";
export { listConnectorMetadata, CONNECTOR_METADATA } from "../connectors/metadata.js";
export { productIntelligenceEngine } from "../intelligence/pie-engine.js";
export {
  evaluateProduct,
  productIntelligenceEvaluationEngine,
  PIE_MOCK_EVALUATIONS,
  buildMockEvaluationInput,
  listMockEvaluationCatalog,
} from "../intelligence/product-intelligence-engine/index.js";
export { productScoutEngine, SCOUT_MOCK_PRODUCTS, listScoutCatalog, buildScoutInput } from "../intelligence/product-scout/index.js";
export { supplierIntelligenceFramework } from "../intelligence/supplier-intelligence.js";
export {
  compareSuppliers,
  discoverSuppliers,
  evaluateSupplier,
  listMockCatalog,
  supplierIntelligenceEvaluationEngine,
  supplierIntelligenceModule,
} from "../intelligence/supplier-intelligence-engine/index.js";
export { PIE_SAMPLE_PRODUCTS, buildSamplePieInput } from "../intelligence/pie-samples.js";
export { workforceRegistry } from "../workforce/registry.js";
export { workforceIntelligenceQuery } from "../workforce/intelligence-query.js";
export { financialLedger } from "../finance/ledger.js";
export { royaltyFramework } from "../finance/royalty-framework.js";
export { treasuryEngine } from "../treasury/treasury-engine.js";
export { withdrawalRulesFramework } from "../treasury/withdrawal-rules.js";
export { paymentFramework } from "../payments/payment-framework.js";
export { retentionFramework } from "../retention/retention-framework.js";
export { costIntelligenceRegistry } from "../cost/cost-registry.js";
export { architectureValidator } from "../guardian/architecture-validator.js";
export { intelligenceFoundation } from "./intelligence-foundation.js";
export { buildReportContext, writeAllReports } from "../reporting/report-generator.js";
