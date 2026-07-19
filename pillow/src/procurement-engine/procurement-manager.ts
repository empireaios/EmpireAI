/** R2-09 — Procurement Manager. */

import type { SupplierProductSyncEngine } from "../supplier-product-sync/engine.js";
import type { SupplierInventorySyncEngine } from "../supplier-inventory-sync/engine.js";
import type { SupplierPricingEngine } from "../supplier-pricing-engine/engine.js";
import type { SupplierRankingEngine } from "../supplier-ranking-engine/engine.js";
import { appendPceLog } from "./pce-logging.js";
import { SupplierSelectionEngine } from "./supplier-selection-engine.js";
import { PurchaseOrderEngine } from "./purchase-order-engine.js";
import { ProcurementWorkflowEngine } from "./procurement-workflow-engine.js";
import { ProcurementApprovalEngine } from "./procurement-approval-engine.js";
import { ProcurementValidationEngine } from "./procurement-validation-engine.js";
import { ProcurementValidator } from "./procurement-validator.js";
import { ProcurementMetadataGenerator } from "./procurement-metadata-generator.js";
import { getFixtureProcurementRequest } from "./procurement-fixtures.js";
import type { ProcurementEngineConfiguration } from "./configuration.js";
import type {
  ApproveProcurementInput,
  CreateProcurementRequestInput,
  InvalidProcurementFinding,
  ProcurementFailureFinding,
  ProcurementRecord,
  ProcurementReport,
  PurchaseOrderRecord,
} from "./types.js";

export class ProcurementManager {
  private records: ProcurementRecord[] = [];
  private purchaseOrders: PurchaseOrderRecord[] = [];
  private readonly selectionEngine = new SupplierSelectionEngine();
  private readonly purchaseOrderEngine = new PurchaseOrderEngine();
  private readonly workflowEngine = new ProcurementWorkflowEngine();
  private readonly approvalEngine = new ProcurementApprovalEngine();
  private readonly validationEngine = new ProcurementValidationEngine();
  private readonly validator = new ProcurementValidator();
  private readonly metadataGenerator = new ProcurementMetadataGenerator();

  constructor(
    private readonly productSync: SupplierProductSyncEngine | null,
    private readonly inventorySync: SupplierInventorySyncEngine | null,
    private readonly pricingEngine: SupplierPricingEngine | null,
    private readonly rankingEngine: SupplierRankingEngine | null,
  ) {}

  getRecords(): ProcurementRecord[] {
    return [...this.records];
  }

  getPurchaseOrders(): PurchaseOrderRecord[] {
    return [...this.purchaseOrders];
  }

  resolveRequestInput(input: CreateProcurementRequestInput): CreateProcurementRequestInput {
    if (input.productReference || input.supplierProductId) {
      return {
        ...input,
        productReference: input.productReference ?? input.supplierProductId,
        supplierProductId: input.supplierProductId ?? input.productReference,
        requestedQuantity: input.requestedQuantity ?? 1,
      };
    }
    if (input.includeFixtureRequest !== false) {
      const fixture = getFixtureProcurementRequest();
      return {
        productReference: fixture.productReference,
        supplierProductId: fixture.supplierProductId,
        requestedQuantity: fixture.requestedQuantity,
        preferredSupplierId: input.preferredSupplierId,
      };
    }
    return input;
  }

  createProcurementRequest(
    input: CreateProcurementRequestInput,
    config: ProcurementEngineConfiguration,
  ): ProcurementReport {
    const started = Date.now();
    const resolved = this.resolveRequestInput(input);
    const failures: ProcurementFailureFinding[] = [];
    const invalidRequests: InvalidProcurementFinding[] = [];

    const invalid = this.validationEngine.detectInvalidRequest(resolved);
    if (invalid) {
      invalidRequests.push(invalid);
      const validation = this.validator.validateProcurementResult({
        records: [],
        failures: [{ procurementId: "pce-invalid", failureType: "invalid_request", details: invalid.errors.join("; ") }],
        config,
        startedAt: started,
      });
      return this.metadataGenerator.generateProcurementReport({
        action: "request",
        records: [],
        selection: null,
        purchaseOrder: null,
        failures: [{ procurementId: "pce-invalid", failureType: "invalid_request", details: invalid.errors.join("; ") }],
        invalidRequests,
        validation,
        durationMs: Date.now() - started,
      });
    }

    const productRef = resolved.productReference!;
    const catalog = this.productSync?.getCatalog() ?? [];
    const rankings = this.rankingEngine?.getRankings() ?? [];
    const pricing = this.pricingEngine?.getPricing() ?? [];
    const inventory = this.inventorySync?.getInventory() ?? [];

    const selection = this.selectionEngine.selectOptimalSupplier({
      productReference: productRef,
      rankings,
      pricing,
      inventory,
      preferredSupplierId: resolved.preferredSupplierId,
      config,
    });

    if (!selection) {
      failures.push({
        procurementId: `pce-fail-${Date.now()}`,
        failureType: "supplier_unavailable",
        details: `No supplier available for product ${productRef}`,
      });
      appendPceLog({
        event: "procurement_failure",
        level: "warn",
        details: `Supplier selection failed for ${productRef}`,
      });
      const validation = this.validator.validateProcurementResult({
        records: [],
        failures,
        config,
        startedAt: started,
      });
      return this.metadataGenerator.generateProcurementReport({
        action: "request",
        records: [],
        selection: null,
        purchaseOrder: null,
        failures,
        invalidRequests,
        validation,
        durationMs: Date.now() - started,
      });
    }

    appendPceLog({
      event: "supplier_selection",
      level: "info",
      details: `Selected ${selection.selectedSupplierId} for ${productRef}: ${selection.selectionReason}`,
    });

    const internalProductId =
      catalog.find(
        (c) =>
          c.supplierProductId === productRef ||
          c.productId === productRef,
      )?.productId ?? null;

    const procurementId = `pce-${selection.selectedSupplierId}-${Date.now()}`;
    let record = this.workflowEngine.createInitialRecord({
      procurementId,
      productReference: productRef,
      internalProductId,
      requestedQuantity: resolved.requestedQuantity!,
      supplierId: selection.selectedSupplierId,
      unitCost: selection.unitCost,
      currency: "USD",
    });

    const totalCost = record.requestedQuantity * record.unitCost;
    const approvalStatus = this.approvalEngine.determineApprovalStatus({ totalCost, config });
    record = {
      ...record,
      approvalStatus,
      procurementStatus: approvalStatus === "pending" ? "pending_approval" : "approved",
    };

    appendPceLog({
      event: "procurement_request",
      level: "info",
      details: `Request ${procurementId}: ${record.requestedQuantity} x ${record.unitCost} ${record.currency}`,
    });

    let purchaseOrder: PurchaseOrderRecord | null = null;

    if (approvalStatus === "auto_approved" || approvalStatus === "approved") {
      purchaseOrder = this.purchaseOrderEngine.createPurchaseOrder({
        procurementId,
        supplierId: selection.selectedSupplierId,
        productReference: productRef,
        quantity: record.requestedQuantity,
        unitCost: record.unitCost,
        currency: record.currency,
      });
      record = this.workflowEngine.attachPurchaseOrder(record, purchaseOrder.purchaseOrderId);
      this.purchaseOrders.push(purchaseOrder);
      appendPceLog({
        event: "purchase_order_creation",
        level: "info",
        details: `PO ${purchaseOrder.purchaseOrderId} created for ${procurementId}`,
      });
    } else {
      appendPceLog({
        event: "approval_event",
        level: "info",
        details: `Procurement ${procurementId} pending approval (total ${totalCost})`,
      });
    }

    const records = [record];
    const validation = this.validator.validateProcurementResult({
      records,
      failures,
      config,
      startedAt: started,
    });

    if (validation.decision !== "fail" || !config.preserveExistingOnValidationFailure) {
      this.records.push(...records);
    }

    return this.metadataGenerator.generateProcurementReport({
      action: "request",
      records: validation.decision === "fail" && config.preserveExistingOnValidationFailure ? [] : records,
      selection,
      purchaseOrder,
      failures,
      invalidRequests,
      validation,
      durationMs: Date.now() - started,
    });
  }

  approveProcurement(
    input: ApproveProcurementInput,
    config: ProcurementEngineConfiguration,
  ): ProcurementReport {
    const started = Date.now();
    const failures: ProcurementFailureFinding[] = [];
    const existing = this.records.find((r) => r.procurementId === input.procurementId);

    if (!existing) {
      failures.push({
        procurementId: input.procurementId,
        failureType: "invalid_request",
        details: "Procurement record not found",
      });
      const validation = this.validator.validateProcurementResult({
        records: [],
        failures,
        config,
        startedAt: started,
      });
      return this.metadataGenerator.generateProcurementReport({
        action: "approve",
        records: [],
        selection: null,
        purchaseOrder: null,
        failures,
        invalidRequests: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    let record = this.approvalEngine.processApproval({
      record: existing,
      approved: input.approved,
    });

    appendPceLog({
      event: "approval_event",
      level: input.approved ? "info" : "warn",
      details: `Procurement ${input.procurementId} ${input.approved ? "approved" : "rejected"}`,
    });

    let purchaseOrder: PurchaseOrderRecord | null = null;

    if (input.approved && record.approvalStatus === "approved") {
      purchaseOrder = this.purchaseOrderEngine.createPurchaseOrder({
        procurementId: record.procurementId,
        supplierId: record.supplierId,
        productReference: record.productReference,
        quantity: record.requestedQuantity,
        unitCost: record.unitCost,
        currency: record.currency,
      });
      record = this.workflowEngine.attachPurchaseOrder(record, purchaseOrder.purchaseOrderId);
      this.purchaseOrders.push(purchaseOrder);
      appendPceLog({
        event: "purchase_order_creation",
        level: "info",
        details: `PO ${purchaseOrder.purchaseOrderId} created after approval`,
      });
    } else if (!input.approved) {
      failures.push({
        procurementId: input.procurementId,
        failureType: "approval_rejected",
        details: "Procurement approval rejected",
      });
    }

    const idx = this.records.findIndex((r) => r.procurementId === input.procurementId);
    if (idx >= 0) this.records[idx] = record;

    const validation = this.validator.validateProcurementResult({
      records: [record],
      failures,
      config,
      startedAt: started,
    });

    return this.metadataGenerator.generateProcurementReport({
      action: "approve",
      records: [record],
      selection: null,
      purchaseOrder,
      failures,
      invalidRequests: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.records = [];
    this.purchaseOrders = [];
  }
}
