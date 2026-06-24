import { getDatabase } from "../brain/database.js";
import { defaultConnectorRegistry } from "../connectors/registry.js";
import { listConnectorMetadata } from "../connectors/metadata.js";
import { productIntelligenceEngine } from "../intelligence/pie-engine.js";
import {
  productIntelligenceService,
} from "../intelligence/product-intelligence-engine/index.js";
import { buildSamplePieInput, PIE_SAMPLE_PRODUCTS } from "../intelligence/pie-samples.js";
import {
  productScoutEngine,
  SCOUT_MOCK_PRODUCTS,
} from "../intelligence/product-scout/index.js";
import { supplierIntelligenceFramework } from "../intelligence/supplier-intelligence.js";
import {
  evaluateSupplier,
  listMockCatalog,
  supplierIntelligenceEvaluationEngine,
} from "../intelligence/supplier-intelligence-engine/index.js";
import { financialLedger } from "../finance/ledger.js";
import { royaltyFramework } from "../finance/royalty-framework.js";
import { treasuryEngine } from "../treasury/treasury-engine.js";
import { withdrawalRulesFramework } from "../treasury/withdrawal-rules.js";
import { workforceIntelligenceQuery } from "../workforce/intelligence-query.js";
import { architectureValidator } from "../guardian/architecture-validator.js";

export type IntelligenceFoundationSnapshot = {
  workspaceId: string;
  connectors: { catalogued: number; metadata: number };
  pieSamples: number;
  pieEvaluations: number;
  pieCatalogProducts: number;
  pieConnectorSignals: number;
  scoutProducts: number;
  scoutEvaluations: number;
  supplierEvaluations: number;
  suppliers: number;
  ledgerEvents: number;
  treasury: ReturnType<typeof treasuryEngine.compute>;
  royalty: ReturnType<typeof royaltyFramework.calculate>;
  architecture: ReturnType<typeof architectureValidator.validate>["overall"];
  seededAt: string;
};

/** Central Intelligence Foundation hub — coordinates all Mission 002 modules. */
export class IntelligenceFoundation {
  seedMockData(workspaceId: string): IntelligenceFoundationSnapshot {
    const db = getDatabase();
    const pieCount = (
      db
        .prepare(`SELECT COUNT(*) AS c FROM pie_product_scores WHERE workspace_id = @workspaceId`)
        .get({ workspaceId }) as { c: number }
    ).c;

    if (pieCount === 0) {
      for (let i = 0; i < PIE_SAMPLE_PRODUCTS.length; i++) {
        const score = productIntelligenceEngine.score(buildSamplePieInput(workspaceId, i));
        productIntelligenceEngine.persist(score);
      }
    }

    productIntelligenceService.seedCatalog(workspaceId);

    const supplierCount = (
      db
        .prepare(
          `SELECT COUNT(*) AS c FROM supplier_intelligence_scores WHERE workspace_id = @workspaceId`,
        )
        .get({ workspaceId }) as { c: number }
    ).c;

    if (supplierCount === 0) {
      for (const supplier of supplierIntelligenceFramework.listCatalog()) {
        const score = supplierIntelligenceFramework.score({ workspaceId, supplierId: supplier.id });
        supplierIntelligenceFramework.persist(score);
      }
    }

    for (const supplier of listMockCatalog().filter(
      (s) => !s.id.startsWith("sup-fake") && !s.id.startsWith("sup-fraud"),
    )) {
      const evaluation = evaluateSupplier({ supplierId: supplier.id, workspaceId });
      supplierIntelligenceEvaluationEngine.persist(evaluation, workspaceId);
    }

    const scan = productScoutEngine.scanPortfolio(workspaceId);
    for (const evaluation of scan.evaluations) {
      productScoutEngine.persist(evaluation);
    }

    royaltyFramework.recordRoyalty(workspaceId, "mtd", "intelligence-foundation-seed");

    const treasury = treasuryEngine.compute(workspaceId);
    treasuryEngine.persistSnapshot(treasury);

    return this.snapshot(workspaceId);
  }

  snapshot(workspaceId: string): IntelligenceFoundationSnapshot {
    const summary = financialLedger.summarize(workspaceId);
    const arch = architectureValidator.validate(workspaceId);

    return {
      workspaceId,
      connectors: {
        catalogued: defaultConnectorRegistry.listDefinitions().length,
        metadata: listConnectorMetadata().length,
      },
      pieSamples: PIE_SAMPLE_PRODUCTS.length,
      pieEvaluations: (
        getDatabase()
          .prepare(
            `SELECT COUNT(*) AS c FROM product_intelligence_evaluations WHERE workspace_id = @workspaceId`,
          )
          .get({ workspaceId }) as { c: number }
      ).c,
      pieCatalogProducts: productIntelligenceService.viewStats(workspaceId).productCount,
      pieConnectorSignals: productIntelligenceService.viewStats(workspaceId).activeSignals,
      scoutProducts: SCOUT_MOCK_PRODUCTS.length,
      scoutEvaluations: (
        getDatabase()
          .prepare(
            `SELECT COUNT(*) AS c FROM product_scout_evaluations WHERE workspace_id = @workspaceId`,
          )
          .get({ workspaceId }) as { c: number }
      ).c,
      supplierEvaluations: (
        getDatabase()
          .prepare(
            `SELECT COUNT(*) AS c FROM supplier_intelligence_evaluations WHERE workspace_id = @workspaceId`,
          )
          .get({ workspaceId }) as { c: number }
      ).c,
      suppliers: supplierIntelligenceFramework.listCatalog().length,
      ledgerEvents: summary.eventCount,
      treasury: treasuryEngine.compute(workspaceId),
      royalty: royaltyFramework.calculate(workspaceId),
      architecture: arch.overall,
      seededAt: new Date().toISOString(),
    };
  }

  queryAgentIntelligence(
    ...args: Parameters<typeof workforceIntelligenceQuery.query>
  ) {
    return workforceIntelligenceQuery.query(...args);
  }

  validateWithdrawal(workspaceId: string, amountCents: number) {
    return withdrawalRulesFramework.validate(workspaceId, amountCents);
  }
}

export const intelligenceFoundation = new IntelligenceFoundation();
