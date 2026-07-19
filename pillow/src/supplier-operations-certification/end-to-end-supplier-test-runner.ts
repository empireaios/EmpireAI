/** R2-20 — End-to-end supplier workflow test runner. */

import { appendCertificationLog } from "./soc-logging.js";
import type { SupplierOperationsCertificationConfiguration } from "./configuration.js";
import type { SupplierOperationsCertificationContext } from "./supplier-operations-certification-context.js";

export type EndToEndValidationResult = {
  result: "pass" | "partial" | "fail";
  evidenceReferences: string[];
  errors: string[];
  warnings: string[];
};

export class EndToEndSupplierTestRunner {
  async run(
    ctx: SupplierOperationsCertificationContext,
    config: SupplierOperationsCertificationConfiguration,
  ): Promise<EndToEndValidationResult> {
    const evidenceReferences: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.safeTestMode) {
      warnings.push("End-to-end validation skipped — safe test mode disabled");
      return { result: "partial", evidenceReferences, errors, warnings };
    }

    appendCertificationLog({
      event: "e2e_validation_start",
      level: "info",
      details: "End-to-end supplier workflow validation started",
    });

    try {
      if (!ctx.supplierProductSync) {
        errors.push("Product sync unavailable for E2E workflow");
      } else if (config.includeSmokeTests) {
        await ctx.supplierProductSync.syncSupplierProducts({ includeFixtureCatalog: true });
        evidenceReferences.push("supplier-product-sync:fixture-catalog");
      }

      if (!ctx.supplierInventorySync) {
        errors.push("Inventory sync unavailable for E2E workflow");
      } else if (config.includeSmokeTests) {
        await ctx.supplierInventorySync.syncSupplierInventory({ includeFixtureInventory: true });
        evidenceReferences.push("supplier-inventory-sync:fixture-inventory");
      }

      if (!ctx.supplierRanking) {
        errors.push("Supplier ranking unavailable for E2E workflow");
      } else if (config.includeSmokeTests) {
        await ctx.supplierRanking.rankSuppliers({ includeFixtureMetrics: false });
        evidenceReferences.push("supplier-ranking:rank-suppliers");
      }

      if (!ctx.procurement) {
        errors.push("Procurement engine unavailable for E2E workflow");
      } else if (config.includeSmokeTests) {
        const report = ctx.procurement.createProcurementRequest({
          productReference: "cj-prod-1001",
          requestedQuantity: 1,
        });
        if (report.records.length) {
          evidenceReferences.push(`procurement:${report.records[0]!.procurementId}`);
        }
      }

      if (!ctx.fulfilmentOrchestrator) {
        warnings.push("Fulfilment orchestrator unavailable — partial E2E");
      } else if (config.includeSmokeTests) {
        const procurements = ctx.procurement?.getRecords() ?? [];
        if (procurements[0]) {
          await ctx.fulfilmentOrchestrator.routeFulfilment({
            orderReference: "ord-soc-cert-e2e",
            procurementReference: procurements[0].procurementId,
          });
          evidenceReferences.push("fulfilment-orchestrator:route-fulfilment");
        }
      }

      if (!ctx.supplierRiskMonitor) {
        warnings.push("Risk monitor unavailable — partial E2E");
      } else if (config.includeSmokeTests) {
        ctx.supplierRiskMonitor.monitorSupplierHealth({ includeFixtureSuppliers: true });
        evidenceReferences.push("supplier-risk-monitor:monitor-health");
      }

      if (!ctx.procurementIntelligence) {
        warnings.push("Procurement intelligence unavailable — partial E2E");
      } else if (config.includeSmokeTests) {
        ctx.procurementIntelligence.analyzeProcurement({ includeFixtureProcurements: true });
        evidenceReferences.push("procurement-intelligence:analyze");
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "E2E workflow failed");
    }

    const result =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    appendCertificationLog({
      event: "e2e_validation_complete",
      level: result === "fail" ? "warn" : "info",
      details: `E2E result=${result} evidence=${evidenceReferences.length}`,
    });

    return { result, evidenceReferences, errors, warnings };
  }
}
