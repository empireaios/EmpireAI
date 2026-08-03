import type { InventoryWorkerConfiguration } from "./configuration.js";
import {
  INW_METADATA_VERSION,
  INVENTORY_REPORT_VERSION,
  INVENTORY_WORKER_IDENTITY,
} from "./paths.js";
import type {
  ApprovedProductInventoryInput,
  EvidenceItem,
  IntegrationHandshake,
  InventoryAlert,
  InventoryReport,
  InventoryWorkerCatalog,
  InventoryWorkerInput,
  StockStatus,
  SupplierAvailability,
} from "./types.js";

/** Pure Inventory Worker helpers for Q3-10 — monitoring only. */
export class InventoryBuilder {
  buildCatalog(
    config: InventoryWorkerConfiguration,
    inventoryReports: InventoryReport[],
    integrations: IntegrationHandshake[],
  ): InventoryWorkerCatalog {
    return {
      reportVersion: INVENTORY_REPORT_VERSION,
      workerId: config.workerId,
      inventoryReports: inventoryReports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: INW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverPurchaseInventory: true,
      neverModifySupplierStock: true,
      neverPlaceSupplierOrders: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverModifySupplierInventoryDirectly: true,
    };
  }

  resolveProduct(input: InventoryWorkerInput): ApprovedProductInventoryInput {
    const base = input.approvedProduct ?? {};
    return {
      productId: input.productId ?? base.productId,
      productName: input.productName ?? base.productName,
      supplierId: input.supplierId ?? base.supplierId,
      supplierName: input.supplierName ?? base.supplierName,
      currentStock: input.currentStock ?? base.currentStock,
      previousStock: input.previousStock ?? base.previousStock,
      supplierStockAvailable: input.supplierStockAvailable ?? base.supplierStockAvailable,
      leadTimeDays: input.leadTimeDays ?? base.leadTimeDays,
      dailyDemand: input.dailyDemand ?? base.dailyDemand,
      safetyStockDays: input.safetyStockDays ?? base.safetyStockDays,
      supplierAvailability: input.supplierAvailability ?? base.supplierAvailability,
      evaluationId: input.evaluationId ?? base.evaluationId,
      discoveryId: input.discoveryId ?? base.discoveryId,
      businessMissionId: input.businessMissionId ?? base.businessMissionId,
    };
  }

  buildReport(
    input: InventoryWorkerInput,
    config: InventoryWorkerConfiguration,
    product: ApprovedProductInventoryInput,
  ): InventoryReport {
    inventorySequence += 1;
    const now = new Date().toISOString();
    const productId = product.productId?.trim() || `prod-inventory-${inventorySequence}`;
    const productName = product.productName?.trim() || `Product ${inventorySequence}`;
    const supplierId = product.supplierId?.trim() || null;
    const supplierName = product.supplierName?.trim() || null;

    const currentStock = Number.isFinite(Number(product.currentStock))
      ? Math.max(0, Number(product.currentStock))
      : 0;
    const previousStock =
      product.previousStock == null || !Number.isFinite(Number(product.previousStock))
        ? null
        : Math.max(0, Number(product.previousStock));

    const leadTimeDays =
      product.leadTimeDays != null && Number.isFinite(Number(product.leadTimeDays))
        ? Math.max(0, Number(product.leadTimeDays))
        : config.defaultLeadTimeDays ?? 14;
    const dailyDemand =
      product.dailyDemand != null && Number.isFinite(Number(product.dailyDemand))
        ? Math.max(0, Number(product.dailyDemand))
        : config.defaultDailyDemand ?? 5;
    const safetyStockDays =
      product.safetyStockDays != null && Number.isFinite(Number(product.safetyStockDays))
        ? Math.max(0, Number(product.safetyStockDays))
        : config.defaultSafetyStockDays ?? 3;

    const safetyStock = round(dailyDemand * safetyStockDays);
    const reorderPoint = Math.ceil(dailyDemand * leadTimeDays + safetyStock);
    const reorderQuantity = Math.max(reorderPoint, Math.ceil(dailyDemand * leadTimeDays));

    const stockStatus = this.resolveStockStatus(currentStock, reorderPoint);
    const supplierStockAvailable =
      product.supplierStockAvailable == null ||
      !Number.isFinite(Number(product.supplierStockAvailable))
        ? null
        : Math.max(0, Number(product.supplierStockAvailable));
    const supplierAvailability = this.resolveSupplierAvailability(
      product,
      supplierStockAvailable,
      reorderPoint,
      stockStatus,
    );

    const stockDelta =
      previousStock == null ? null : round(currentStock - previousStock);
    const abnormalChangeDetected = this.detectAbnormalChange(
      currentStock,
      previousStock,
      config,
    );

    const inventoryAlerts = this.buildAlerts(
      stockStatus,
      supplierAvailability,
      abnormalChangeDetected,
      currentStock,
      previousStock,
      reorderPoint,
      now,
    );

    const recommendedAction = this.buildRecommendedAction(
      stockStatus,
      supplierAvailability,
      abnormalChangeDetected,
      reorderPoint,
    );

    const evidence = this.compileEvidence(
      product,
      currentStock,
      previousStock,
      leadTimeDays,
      dailyDemand,
      safetyStock,
      reorderPoint,
      stockStatus,
      supplierAvailability,
      input,
      now,
    );
    const confidenceScore = this.scoreConfidence(
      product,
      currentStock,
      leadTimeDays,
      evidence,
    );

    return {
      inventoryReportId:
        input.inventoryReportId?.trim() || `inw-inv-${Date.now()}-${inventorySequence}`,
      timestamp: now,
      productId,
      productName,
      supplierId,
      supplierName,
      currentStock,
      previousStock,
      stockStatus,
      leadTimeDays,
      reorderPoint,
      reorderQuantity,
      dailyDemandAssumption: dailyDemand,
      safetyStock,
      supplierAvailability,
      supplierStockAvailable,
      inventoryAlerts,
      recommendedAction,
      confidenceScore,
      abnormalChangeDetected,
      stockDelta,
      evaluationId: product.evaluationId?.trim() || null,
      discoveryId: product.discoveryId?.trim() || null,
      businessMissionId: product.businessMissionId?.trim() || null,
      supportingEvidence: evidence,
      metadataVersion: INW_METADATA_VERSION,
      reportVersion: INVENTORY_REPORT_VERSION,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      workerId: config.workerId || INVENTORY_WORKER_IDENTITY.workerId,
      neverPurchaseInventory: true,
      neverModifySupplierStock: true,
      neverPlaceSupplierOrders: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ311OrLater: true,
      neverModifySupplierInventoryDirectly: true,
      preserveInventoryTraceability: true,
      preserveSupplierReferences: true,
      preserveInventoryHistory: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  resolveStockStatus(currentStock: number, reorderPoint: number): StockStatus {
    if (currentStock <= 0) return "out_of_stock";
    if (currentStock <= reorderPoint) return "low_stock";
    return "in_stock";
  }

  resolveSupplierAvailability(
    product: ApprovedProductInventoryInput,
    supplierStockAvailable: number | null,
    reorderPoint: number,
    stockStatus: StockStatus,
  ): SupplierAvailability {
    const explicit = this.normalizeSupplierAvailability(product.supplierAvailability);
    if (explicit) return explicit;

    if (supplierStockAvailable === 0) return "unavailable";
    if (supplierStockAvailable != null && supplierStockAvailable > 0) {
      if (supplierStockAvailable < reorderPoint) return "limited";
      return "available";
    }
    if (supplierStockAvailable == null && stockStatus === "in_stock") return "available";
    if (
      supplierStockAvailable == null &&
      (stockStatus === "out_of_stock" || stockStatus === "low_stock")
    ) {
      return "unknown";
    }
    return "unknown";
  }

  normalizeSupplierAvailability(value: unknown): SupplierAvailability | null {
    if (
      value === "available" ||
      value === "limited" ||
      value === "unavailable" ||
      value === "unknown"
    ) {
      return value;
    }
    return null;
  }

  detectAbnormalChange(
    currentStock: number,
    previousStock: number | null,
    config: InventoryWorkerConfiguration,
  ): boolean {
    if (previousStock == null) return false;
    const absDelta = Math.abs(currentStock - previousStock);
    const percentThreshold = config.abnormalChangePercent ?? 0.5;
    const absoluteThreshold = config.abnormalAbsoluteDrop ?? 50;
    const percentChange = absDelta / Math.max(previousStock, 1);
    const absoluteDrop = previousStock - currentStock;
    return percentChange >= percentThreshold || absoluteDrop >= absoluteThreshold;
  }

  buildAlerts(
    stockStatus: StockStatus,
    supplierAvailability: SupplierAvailability,
    abnormalChangeDetected: boolean,
    currentStock: number,
    previousStock: number | null,
    reorderPoint: number,
    now: string,
  ): InventoryAlert[] {
    const alerts: InventoryAlert[] = [];
    let seq = 0;
    const add = (severity: InventoryAlert["severity"], code: string, message: string) => {
      seq += 1;
      alerts.push({
        alertId: `inw-alert-${seq}`,
        severity,
        code,
        message,
        detectedAt: now,
      });
    };

    if (stockStatus === "out_of_stock") {
      add(
        "critical",
        "OUT_OF_STOCK",
        `Product is out of stock (currentStock=${currentStock}). Escalate to Pillow before accepting orders.`,
      );
    } else if (stockStatus === "low_stock") {
      add(
        "warning",
        "LOW_STOCK",
        `Stock is at or below reorder point (currentStock=${currentStock}, reorderPoint=${reorderPoint}).`,
      );
    }

    if (supplierAvailability === "unavailable") {
      add(
        "critical",
        "SUPPLIER_UNAVAILABLE",
        "Supplier stock is unavailable. Do not place supplier orders from this worker.",
      );
    } else if (supplierAvailability === "limited") {
      add(
        "warning",
        "SUPPLIER_LIMITED",
        "Supplier stock is limited relative to reorder point. Continue monitoring only.",
      );
    }

    if (abnormalChangeDetected && previousStock != null) {
      add(
        "warning",
        "ABNORMAL_CHANGE",
        `Abnormal inventory change detected (previous=${previousStock}, current=${currentStock}).`,
      );
    }

    return alerts;
  }

  buildRecommendedAction(
    stockStatus: StockStatus,
    supplierAvailability: SupplierAvailability,
    abnormalChangeDetected: boolean,
    reorderPoint: number,
  ): string {
    if (stockStatus === "out_of_stock") {
      return "Escalate out-of-stock to Pillow before accepting orders — do not purchase or place supplier orders from Inventory Worker";
    }
    if (supplierAvailability === "unavailable") {
      return "Escalate supplier unavailability to Pillow — continue monitoring only, never place supplier orders";
    }
    if (stockStatus === "low_stock") {
      return `Plan reorder at reorder point ${reorderPoint} via Pillow approval — Inventory Worker must not purchase inventory`;
    }
    if (supplierAvailability === "limited") {
      return "Continue monitoring limited supplier availability; escalate if stock declines further";
    }
    if (abnormalChangeDetected) {
      return "Review abnormal inventory change with Pillow; preserve history and continue monitoring";
    }
    return "Continue monitoring inventory quantities, lead times, and supplier availability";
  }

  compileEvidence(
    product: ApprovedProductInventoryInput,
    currentStock: number,
    previousStock: number | null,
    leadTimeDays: number,
    dailyDemand: number,
    safetyStock: number,
    reorderPoint: number,
    stockStatus: StockStatus,
    supplierAvailability: SupplierAvailability,
    input: InventoryWorkerInput,
    now: string,
  ): EvidenceItem[] {
    const items: EvidenceItem[] = [];
    let seq = 0;
    const add = (
      source: string,
      claim: string,
      kind: EvidenceItem["kind"],
      relatedTopic: string,
    ) => {
      seq += 1;
      items.push({
        evidenceId: `ev-${seq}`,
        source,
        claim,
        kind,
        relatedTopic,
        recordedAt: now,
      });
    };

    for (const raw of input.evidenceSources ?? []) {
      const claim = raw.claim?.trim();
      if (!claim) continue;
      add(
        raw.source?.trim() || "provided_source",
        claim,
        raw.kind === "fact" ? "fact" : "assumption",
        raw.relatedTopic?.trim() || "general",
      );
    }
    add(
      "approved_product",
      `Inventory monitoring prepared for ${product.productName ?? product.productId ?? "unknown product"}`,
      "fact",
      "product",
    );
    add(
      "current_stock",
      `Current stock observed at ${currentStock}`,
      product.currentStock != null ? "fact" : "assumption",
      "stock",
    );
    if (previousStock != null) {
      add(
        "previous_stock",
        `Previous stock recorded at ${previousStock}`,
        "fact",
        "stock",
      );
    }
    add(
      "lead_time",
      `Lead time assumption ${leadTimeDays} days`,
      product.leadTimeDays != null ? "fact" : "assumption",
      "lead_time",
    );
    add(
      "daily_demand",
      `Daily demand assumption ${dailyDemand}`,
      product.dailyDemand != null ? "fact" : "assumption",
      "demand",
    );
    add(
      "reorder_point",
      `Reorder point ${reorderPoint} with safety stock ${safetyStock}`,
      "assumption",
      "reorder",
    );
    add(
      "stock_status",
      `Stock status resolved as ${stockStatus}`,
      "fact",
      "status",
    );
    add(
      "supplier_availability",
      `Supplier availability resolved as ${supplierAvailability}`,
      product.supplierAvailability != null || product.supplierStockAvailable != null
        ? "fact"
        : "assumption",
      "supplier",
    );
    if (product.supplierId) {
      add(
        "supplier_reference",
        `Supplier reference preserved: ${product.supplierId}`,
        "fact",
        "traceability",
      );
    }
    if (product.evaluationId) {
      add(
        "supplier_evaluation_worker",
        `Traceable to Supplier Evaluation ${product.evaluationId}`,
        "fact",
        "traceability",
      );
    }
    add(
      "boundary",
      "Monitoring-only: does not purchase inventory, modify supplier stock, place supplier orders, or override Pillow/Grand King",
      "fact",
      "governance",
    );
    return items;
  }

  scoreConfidence(
    product: ApprovedProductInventoryInput,
    currentStock: number,
    leadTimeDays: number,
    evidence: EvidenceItem[],
  ): number {
    let score = 0.35;
    if (product.productId?.trim()) score += 0.1;
    if (product.supplierId?.trim()) score += 0.1;
    if (product.currentStock != null && Number.isFinite(Number(product.currentStock))) {
      score += 0.15;
    } else if (currentStock >= 0) {
      score += 0.05;
    }
    if (product.leadTimeDays != null && leadTimeDays > 0) score += 0.1;
    if (product.evaluationId?.trim()) score += 0.1;
    score += Math.min(0.15, evidence.filter((e) => e.kind === "fact").length * 0.03);
    return Number(Math.max(0.05, Math.min(0.95, score)).toFixed(2));
  }
}

let inventorySequence = 0;

export function resetInventorySequenceForTesting() {
  inventorySequence = 0;
}

function round(value: number): number {
  return Number(Math.max(0, value).toFixed(2));
}

function cloneReport(report: InventoryReport): InventoryReport {
  return {
    ...report,
    inventoryAlerts: report.inventoryAlerts.map((a) => ({ ...a })),
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
  };
}
