/** R2-20 — Supplier operations certification context (R2-01 through R2-19). */

import type { SupplierFrameworkEngine } from "../supplier-framework/engine.js";
import type { CjDropshippingIntegrationEngine } from "../cj-dropshipping-integration/engine.js";
import type { AliExpressIntegrationEngine } from "../aliexpress-integration/engine.js";
import type { Oss1688IntegrationEngine } from "../1688-integration/engine.js";
import type { SupplierProductSyncEngine } from "../supplier-product-sync/engine.js";
import type { SupplierInventorySyncEngine } from "../supplier-inventory-sync/engine.js";
import type { SupplierPricingEngine } from "../supplier-pricing-engine/engine.js";
import type { SupplierRankingEngine } from "../supplier-ranking-engine/engine.js";
import type { ProcurementEngine } from "../procurement-engine/engine.js";
import type { FulfilmentOrchestrator } from "../fulfilment-orchestrator/engine.js";
import type { ShippingCarrierIntegrationEngine } from "../shipping-carrier-integration/engine.js";
import type { ShipmentTrackingEngine } from "../shipment-tracking-engine/engine.js";
import type { ReturnManagementEngine } from "../return-management/engine.js";
import type { WarehouseIntelligenceEngine } from "../warehouse-intelligence/engine.js";
import type { MultiWarehouseSupportEngine } from "../multi-warehouse-support/engine.js";
import type { SupplierRiskMonitorEngine } from "../supplier-risk-monitor/engine.js";
import type { LogisticsOptimizationEngine } from "../logistics-optimization/engine.js";
import type { FulfilmentSlaMonitorEngine } from "../fulfilment-sla-monitor/engine.js";
import type { ProcurementIntelligenceEngine } from "../procurement-intelligence/engine.js";

export type SupplierOperationsCertificationContext = {
  supplierFramework: SupplierFrameworkEngine | null;
  cjDropshipping: CjDropshippingIntegrationEngine | null;
  aliExpress: AliExpressIntegrationEngine | null;
  oss1688: Oss1688IntegrationEngine | null;
  supplierProductSync: SupplierProductSyncEngine | null;
  supplierInventorySync: SupplierInventorySyncEngine | null;
  supplierPricing: SupplierPricingEngine | null;
  supplierRanking: SupplierRankingEngine | null;
  procurement: ProcurementEngine | null;
  fulfilmentOrchestrator: FulfilmentOrchestrator | null;
  shippingCarrier: ShippingCarrierIntegrationEngine | null;
  shipmentTracking: ShipmentTrackingEngine | null;
  returnManagement: ReturnManagementEngine | null;
  warehouseIntelligence: WarehouseIntelligenceEngine | null;
  multiWarehouseSupport: MultiWarehouseSupportEngine | null;
  supplierRiskMonitor: SupplierRiskMonitorEngine | null;
  logisticsOptimization: LogisticsOptimizationEngine | null;
  fulfilmentSlaMonitor: FulfilmentSlaMonitorEngine | null;
  procurementIntelligence: ProcurementIntelligenceEngine | null;
};

export const EMPTY_SUPPLIER_CERTIFICATION_CONTEXT: SupplierOperationsCertificationContext = {
  supplierFramework: null,
  cjDropshipping: null,
  aliExpress: null,
  oss1688: null,
  supplierProductSync: null,
  supplierInventorySync: null,
  supplierPricing: null,
  supplierRanking: null,
  procurement: null,
  fulfilmentOrchestrator: null,
  shippingCarrier: null,
  shipmentTracking: null,
  returnManagement: null,
  warehouseIntelligence: null,
  multiWarehouseSupport: null,
  supplierRiskMonitor: null,
  logisticsOptimization: null,
  fulfilmentSlaMonitor: null,
  procurementIntelligence: null,
};
