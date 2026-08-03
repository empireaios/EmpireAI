import { INW_METADATA_VERSION } from "./paths.js";
import type {
  InventoryReport,
  InventoryWorkerInput,
  InventoryWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  purchaseInventory?: boolean;
  modifySupplierStock?: boolean;
  placeSupplierOrders?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ311OrLater?: boolean;
  modifySupplierInventory?: boolean;
  validated?: boolean;
};

export class InventoryValidator {
  decide(input: InventoryWorkerInput): InventoryWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateReports(
    reports: InventoryReport[] | null,
    input: InventoryWorkerInput,
    started: number,
  ): InventoryWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Inventory Worker requires validated=true");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No inventory reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.inventoryReportId) errors.push("Missing inventory report ID");
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.productId) errors.push("Missing product ID");
        if (report.currentStock == null) errors.push("Missing current stock");
        if (report.leadTimeDays == null) errors.push("Missing lead time days");
        if (report.reorderPoint == null) errors.push("Missing reorder point");
        if (report.reorderQuantity == null) errors.push("Missing reorder quantity");
        if (report.dailyDemandAssumption == null) {
          errors.push("Missing daily demand assumption");
        }
        if (report.safetyStock == null) errors.push("Missing safety stock");
        if (!report.stockStatus) errors.push("Missing stock status");
        if (!report.supplierAvailability) errors.push("Missing supplier availability");
        if (!report.recommendedAction?.trim()) errors.push("Missing recommended action");
        if (report.confidenceScore == null) errors.push("Missing confidence score");
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!report.supportingEvidence.length) errors.push("Missing supporting evidence");
        if (!report.neverModifySupplierInventoryDirectly) {
          errors.push("Inventory Worker must never modify supplier inventory directly");
        }
        if (!report.neverPurchaseInventory) {
          errors.push("Inventory Worker must never purchase inventory");
        }
        if (!report.neverImplementQ311OrLater) {
          errors.push("Inventory Worker must never implement Q3-11 or later");
        }
        if (!report.supplierId && !report.evaluationId) {
          warnings.push(
            `Inventory ${report.inventoryReportId} missing product/supplier traceability`,
          );
        }
        if (report.stockStatus === "out_of_stock") {
          warnings.push(
            `Inventory ${report.inventoryReportId} is out of stock — escalate to Pillow`,
          );
        }
      }
    }

    return this.finalize(
      errors.length || decision === "fail"
        ? "fail"
        : decision === "pass" && warnings.length
          ? "partial"
          : decision,
      errors,
      warnings,
      started,
    );
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.purchaseInventory === true ||
      input.modifySupplierStock === true ||
      input.placeSupplierOrders === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ311OrLater === true ||
      input.modifySupplierInventory === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.purchaseInventory === true) {
      errors.push("Inventory Worker must never purchase inventory");
    }
    if (input.modifySupplierStock === true) {
      errors.push("Inventory Worker must never modify supplier stock");
    }
    if (input.placeSupplierOrders === true) {
      errors.push("Inventory Worker must never place supplier orders");
    }
    if (input.overridePillow === true) {
      errors.push("Inventory Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Inventory Worker must never override Grand King");
    }
    if (input.implementQ311OrLater === true) {
      errors.push("Inventory Worker must never implement Q3-11 or later");
    }
    if (input.modifySupplierInventory === true) {
      errors.push("Inventory Worker must never modify supplier inventory directly");
    }
  }

  finalize(
    decision: InventoryWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): InventoryWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `inw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: INW_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(decision: InventoryWorkerValidationReport["decision"] | null, enabled: boolean) {
    if (!enabled) return "standby" as const;
    if (decision === "fail" || decision === "partial") return "degraded" as const;
    return "healthy" as const;
  }
}

export class RecoveryManager {
  private failures = 0;
  recordFailure() {
    this.failures += 1;
    return this.failures;
  }
  reset() {
    this.failures = 0;
  }
  failureCount() {
    return this.failures;
  }
}
