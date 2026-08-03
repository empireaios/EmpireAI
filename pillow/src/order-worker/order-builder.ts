import type { OrderWorkerConfiguration } from "./configuration.js";
import {
  ORDER_REPORT_VERSION,
  ORDER_STATUSES,
  ORDER_WORKER_IDENTITY,
  ORW_METADATA_VERSION,
} from "./paths.js";
import type {
  ConfirmedOrderInput,
  CustomerUpdate,
  EvidenceItem,
  FulfilmentStatus,
  HistoryEvent,
  IntegrationHandshake,
  OrderEscalation,
  OrderException,
  OrderReport,
  OrderStatus,
  OrderWorkerCatalog,
  OrderWorkerInput,
  ShippingStatus,
} from "./types.js";

/** Pure Order Worker helpers for Q3-11 — lifecycle tracking only. */
export class OrderBuilder {
  buildCatalog(
    config: OrderWorkerConfiguration,
    orderReports: OrderReport[],
    integrations: IntegrationHandshake[],
  ): OrderWorkerCatalog {
    return {
      reportVersion: ORDER_REPORT_VERSION,
      workerId: config.workerId,
      orderReports: orderReports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: ORW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverProcessPayments: true,
      neverIssueRefunds: true,
      neverModifyInventoryDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverAlterFinancialRecords: true,
    };
  }

  resolveOrder(input: OrderWorkerInput): ConfirmedOrderInput {
    const base = input.confirmedOrder ?? {};
    return {
      orderId: input.orderId ?? base.orderId,
      customerId: input.customerId ?? base.customerId,
      productId: input.productId ?? base.productId,
      productName: input.productName ?? base.productName,
      supplierId: input.supplierId ?? base.supplierId,
      supplierName: input.supplierName ?? base.supplierName,
      quantity: input.quantity ?? base.quantity,
      orderStatus: input.orderStatus ?? base.orderStatus,
      fulfilmentStatus: input.fulfilmentStatus ?? base.fulfilmentStatus,
      shippingStatus: input.shippingStatus ?? base.shippingStatus,
      expectedShipDate: input.expectedShipDate ?? base.expectedShipDate,
      actualShipDate: input.actualShipDate ?? base.actualShipDate,
      orderReceivedAt: input.orderReceivedAt ?? base.orderReceivedAt,
      delayDaysThreshold: input.delayDaysThreshold ?? base.delayDaysThreshold,
      inventoryReportId: input.inventoryReportId ?? base.inventoryReportId,
      evaluationId: input.evaluationId ?? base.evaluationId,
      discoveryId: input.discoveryId ?? base.discoveryId,
      businessMissionId: input.businessMissionId ?? base.businessMissionId,
    };
  }

  buildReport(
    input: OrderWorkerInput,
    config: OrderWorkerConfiguration,
    order: ConfirmedOrderInput,
    inventoryContext?: {
      stockStatus?: string | null;
      supplierId?: string | null;
      supplierName?: string | null;
      inventoryReportId?: string | null;
      evaluationId?: string | null;
      discoveryId?: string | null;
      businessMissionId?: string | null;
    } | null,
  ): OrderReport {
    orderSequence += 1;
    const now = new Date().toISOString();
    const orderId = order.orderId?.trim() || `ord-${Date.now()}-${orderSequence}`;
    const customerId = order.customerId?.trim() || `cust-${orderSequence}`;
    const productId = order.productId?.trim() || `prod-order-${orderSequence}`;
    const productName = order.productName?.trim() || `Product ${orderSequence}`;
    const quantity =
      order.quantity != null && Number.isFinite(Number(order.quantity))
        ? Math.max(1, Math.floor(Number(order.quantity)))
        : 1;

    const supplierId =
      order.supplierId?.trim() || inventoryContext?.supplierId?.trim() || null;
    const supplierName =
      order.supplierName?.trim() || inventoryContext?.supplierName?.trim() || null;

    const routedSupplierId = supplierId;
    const routingRationale = supplierId
      ? order.supplierId?.trim()
        ? `Routed to provided supplier ${supplierId}`
        : `Routed to supplier ${supplierId} from Inventory Worker enrichment`
      : "Supplier routing failed — no supplierId available from order or Inventory Worker";

    const orderReceivedAt = order.orderReceivedAt?.trim() || now;
    const daysSinceOrder = this.computeDaysSince(orderReceivedAt, now);
    const delayThreshold =
      order.delayDaysThreshold != null && Number.isFinite(Number(order.delayDaysThreshold))
        ? Math.max(0, Number(order.delayDaysThreshold))
        : config.defaultDelayDaysThreshold ?? 7;

    const expectedShipDate =
      order.expectedShipDate?.trim() ||
      this.addDays(orderReceivedAt, config.defaultExpectedShipDays ?? 5);
    const actualShipDate = order.actualShipDate?.trim() || null;

    let fulfilmentStatus =
      this.normalizeFulfilmentStatus(order.fulfilmentStatus) ??
      this.deriveFulfilmentFromOrderStatus(order.orderStatus) ??
      "pending";
    let shippingStatus =
      this.normalizeShippingStatus(order.shippingStatus) ??
      this.deriveShippingFromOrderStatus(order.orderStatus) ??
      "not_shipped";

    const exceptions: OrderException[] = [];
    let exceptionSeq = 0;
    const addException = (
      severity: OrderException["severity"],
      code: string,
      message: string,
    ) => {
      exceptionSeq += 1;
      exceptions.push({
        exceptionId: `orw-exc-${exceptionSeq}`,
        severity,
        code,
        message,
        detectedAt: now,
      });
    };

    if (!routedSupplierId) {
      addException(
        "critical",
        "SUPPLIER_ROUTING_FAILED",
        "Unable to route order to a supplier — escalate to Pillow for supplier assignment",
      );
    }

    if (inventoryContext?.stockStatus === "out_of_stock") {
      addException(
        "critical",
        "STOCK_UNAVAILABLE",
        "Inventory Worker reports out_of_stock — do not modify inventory; escalate to Pillow",
      );
    }

    const failedFulfilment =
      fulfilmentStatus === "failed" || shippingStatus === "failed";
    if (failedFulfilment) {
      addException(
        "critical",
        "FULFILMENT_FAILED",
        "Fulfilment or shipping failed — escalate to Pillow; never process refunds from Order Worker",
      );
    }

    const terminalStatuses = new Set(["delivered", "cancelled", "closed"]);
    const inputOrderStatus = this.normalizeOrderStatus(order.orderStatus);
    const isTerminal =
      (inputOrderStatus != null && terminalStatuses.has(inputOrderStatus)) ||
      shippingStatus === "delivered";

    const delayed =
      daysSinceOrder > delayThreshold &&
      !isTerminal &&
      inputOrderStatus !== "cancelled" &&
      inputOrderStatus !== "closed" &&
      inputOrderStatus !== "delivered";

    if (delayed) {
      const severity: OrderException["severity"] =
        daysSinceOrder > delayThreshold * 2 ? "critical" : "warning";
      addException(
        severity,
        "DELAYED_ORDER",
        `Order delayed: ${daysSinceOrder} days since receipt exceeds threshold ${delayThreshold}`,
      );
      if (shippingStatus === "not_shipped" || shippingStatus === "preparing") {
        shippingStatus = "delayed";
      }
    }

    const hasCritical = exceptions.some((e) => e.severity === "critical");

    const orderStatus = this.resolveOrderStatus({
      inputStatus: inputOrderStatus,
      shippingStatus,
      fulfilmentStatus,
      delayed,
      hasCritical,
    });

    if (
      orderStatus === "exception" &&
      fulfilmentStatus !== "failed" &&
      fulfilmentStatus !== "cancelled"
    ) {
      /* keep fulfilment as-is when exception is operational */
    }

    const customerUpdates = this.buildCustomerUpdates(orderStatus, fulfilmentStatus, shippingStatus, now);
    const escalations = this.buildEscalations(exceptions, now);
    const orderHistory = this.buildOrderHistory(orderStatus, now);
    const fulfilmentHistory = this.buildFulfilmentHistory(fulfilmentStatus, now);

    const recommendedAction = this.buildRecommendedAction(
      orderStatus,
      fulfilmentStatus,
      shippingStatus,
      delayed,
      failedFulfilment,
      routedSupplierId,
      exceptions,
    );

    const evidence = this.compileEvidence(
      order,
      orderId,
      customerId,
      productId,
      supplierId,
      orderStatus,
      fulfilmentStatus,
      shippingStatus,
      routedSupplierId,
      delayed,
      failedFulfilment,
      input,
      inventoryContext,
      now,
    );

    const confidenceScore = this.scoreConfidence(
      orderId,
      customerId,
      productId,
      supplierId,
      order.inventoryReportId ?? inventoryContext?.inventoryReportId ?? null,
      evidence,
    );

    return {
      orderReportId:
        input.orderReportId?.trim() || `orw-ord-${Date.now()}-${orderSequence}`,
      timestamp: now,
      orderId,
      customerId,
      productId,
      productName,
      supplierId,
      supplierName,
      quantity,
      orderStatus,
      fulfilmentStatus,
      shippingStatus,
      routedSupplierId,
      routingRationale,
      exceptions,
      customerUpdates,
      escalations,
      fulfilmentHistory,
      orderHistory,
      recommendedAction,
      confidenceScore,
      expectedShipDate,
      actualShipDate,
      daysSinceOrder,
      delayed,
      failedFulfilment,
      inventoryReportId:
        order.inventoryReportId?.trim() ||
        inventoryContext?.inventoryReportId?.trim() ||
        null,
      evaluationId:
        order.evaluationId?.trim() || inventoryContext?.evaluationId?.trim() || null,
      discoveryId:
        order.discoveryId?.trim() || inventoryContext?.discoveryId?.trim() || null,
      businessMissionId:
        order.businessMissionId?.trim() ||
        inventoryContext?.businessMissionId?.trim() ||
        null,
      supportingEvidence: evidence,
      metadataVersion: ORW_METADATA_VERSION,
      reportVersion: ORDER_REPORT_VERSION,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      workerId: config.workerId || ORDER_WORKER_IDENTITY.workerId,
      neverProcessPayments: true,
      neverIssueRefunds: true,
      neverModifyInventoryDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ312OrLater: true,
      neverAlterFinancialRecords: true,
      preserveOrderTraceability: true,
      preserveFulfilmentHistory: true,
      preserveSupplierReferences: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  resolveOrderStatus(params: {
    inputStatus: OrderStatus | null;
    shippingStatus: ShippingStatus;
    fulfilmentStatus: FulfilmentStatus;
    delayed: boolean;
    hasCritical: boolean;
  }): OrderStatus {
    const { inputStatus, shippingStatus, fulfilmentStatus, delayed, hasCritical } = params;
    if (inputStatus === "cancelled") return "cancelled";
    if (inputStatus === "closed") return "closed";
    if (hasCritical && inputStatus !== "delivered") return "exception";
    if (delayed) return "delayed";
    if (shippingStatus === "delivered" || inputStatus === "delivered") return "delivered";
    if (
      shippingStatus === "in_transit" ||
      shippingStatus === "out_for_delivery" ||
      inputStatus === "shipped"
    ) {
      return "shipped";
    }
    if (fulfilmentStatus === "fulfilled" && shippingStatus === "not_shipped") {
      return "fulfilled";
    }
    if (fulfilmentStatus === "fulfilled" && shippingStatus === "preparing") {
      return "fulfilled";
    }
    if (fulfilmentStatus === "in_progress") return "processing";
    if (fulfilmentStatus === "awaiting_supplier") return "awaiting_fulfilment";
    if (inputStatus && ORDER_STATUSES.includes(inputStatus as (typeof ORDER_STATUSES)[number])) {
      return inputStatus;
    }
    if (inputStatus) return inputStatus;
    return "received";
  }

  normalizeOrderStatus(value: unknown): OrderStatus | null {
    if (typeof value !== "string" || !value.trim()) return null;
    const trimmed = value.trim();
    if ((ORDER_STATUSES as readonly string[]).includes(trimmed)) {
      return trimmed as (typeof ORDER_STATUSES)[number];
    }
    return trimmed;
  }

  normalizeFulfilmentStatus(value: unknown): FulfilmentStatus | null {
    if (
      value === "pending" ||
      value === "awaiting_supplier" ||
      value === "in_progress" ||
      value === "fulfilled" ||
      value === "failed" ||
      value === "cancelled"
    ) {
      return value;
    }
    return null;
  }

  normalizeShippingStatus(value: unknown): ShippingStatus | null {
    if (
      value === "not_shipped" ||
      value === "preparing" ||
      value === "in_transit" ||
      value === "out_for_delivery" ||
      value === "delivered" ||
      value === "delayed" ||
      value === "failed" ||
      value === "returned"
    ) {
      return value;
    }
    return null;
  }

  deriveFulfilmentFromOrderStatus(status: unknown): FulfilmentStatus | null {
    const normalized = this.normalizeOrderStatus(status);
    if (!normalized) return null;
    switch (normalized) {
      case "cancelled":
        return "cancelled";
      case "awaiting_fulfilment":
        return "awaiting_supplier";
      case "processing":
        return "in_progress";
      case "fulfilled":
      case "shipped":
      case "delivered":
        return "fulfilled";
      case "exception":
        return "failed";
      case "received":
        return "pending";
      default:
        return null;
    }
  }

  deriveShippingFromOrderStatus(status: unknown): ShippingStatus | null {
    const normalized = this.normalizeOrderStatus(status);
    if (!normalized) return null;
    switch (normalized) {
      case "shipped":
        return "in_transit";
      case "delivered":
        return "delivered";
      case "delayed":
        return "delayed";
      case "cancelled":
      case "closed":
      case "received":
      case "awaiting_fulfilment":
      case "processing":
      case "fulfilled":
        return "not_shipped";
      default:
        return null;
    }
  }

  computeDaysSince(fromIso: string, toIso: string): number {
    const from = Date.parse(fromIso);
    const to = Date.parse(toIso);
    if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
    return Math.max(0, Math.floor((to - from) / (24 * 60 * 60 * 1000)));
  }

  addDays(fromIso: string, days: number): string {
    const from = Date.parse(fromIso);
    if (!Number.isFinite(from)) return new Date().toISOString();
    return new Date(from + days * 24 * 60 * 60 * 1000).toISOString();
  }

  buildCustomerUpdates(
    orderStatus: OrderStatus,
    fulfilmentStatus: FulfilmentStatus,
    shippingStatus: ShippingStatus,
    now: string,
  ): CustomerUpdate[] {
    let message: string;
    if (orderStatus === "cancelled") {
      message = "Your order has been cancelled. No further fulfilment actions will be taken.";
    } else if (orderStatus === "delivered" || shippingStatus === "delivered") {
      message = "Your order has been delivered. Thank you for your purchase.";
    } else if (orderStatus === "shipped" || shippingStatus === "in_transit") {
      message = "Your order has shipped and is in transit.";
    } else if (shippingStatus === "out_for_delivery") {
      message = "Your order is out for delivery.";
    } else if (orderStatus === "delayed" || shippingStatus === "delayed") {
      message =
        "Your order is delayed. Our team is monitoring fulfilment and will provide further updates.";
    } else if (orderStatus === "exception" || fulfilmentStatus === "failed") {
      message =
        "There is an operational issue with your order. Our team has been notified and is reviewing it.";
    } else if (orderStatus === "fulfilled" || fulfilmentStatus === "fulfilled") {
      message = "Your order has been fulfilled and is being prepared for shipment.";
    } else if (orderStatus === "processing" || fulfilmentStatus === "in_progress") {
      message = "Your order is currently being processed.";
    } else if (
      orderStatus === "awaiting_fulfilment" ||
      fulfilmentStatus === "awaiting_supplier"
    ) {
      message = "Your order is awaiting fulfilment with the supplier.";
    } else {
      message = "Your order has been received and is being prepared for fulfilment.";
    }

    return [
      {
        updateId: "orw-upd-1",
        channel: "customer_notification",
        message,
        generatedAt: now,
        status: "generated",
      },
    ];
  }

  buildEscalations(exceptions: OrderException[], now: string): OrderEscalation[] {
    return exceptions
      .filter((e) => e.severity === "critical")
      .map((e, index) => ({
        escalationId: `orw-esc-${index + 1}`,
        severity: e.severity,
        reason: `${e.code}: ${e.message}`,
        escalatedAt: now,
        target: "pillow" as const,
      }));
  }

  buildOrderHistory(orderStatus: OrderStatus, now: string): HistoryEvent[] {
    return [
      {
        eventId: "orw-oh-1",
        status: "received",
        note: "Confirmed customer order received by Order Worker",
        recordedAt: now,
      },
      {
        eventId: "orw-oh-2",
        status: String(orderStatus),
        note: `Order status resolved as ${orderStatus}`,
        recordedAt: now,
      },
    ];
  }

  buildFulfilmentHistory(fulfilmentStatus: FulfilmentStatus, now: string): HistoryEvent[] {
    return [
      {
        eventId: "orw-fh-1",
        status: "pending",
        note: "Fulfilment tracking initiated",
        recordedAt: now,
      },
      {
        eventId: "orw-fh-2",
        status: fulfilmentStatus,
        note: `Fulfilment status resolved as ${fulfilmentStatus}`,
        recordedAt: now,
      },
    ];
  }

  buildRecommendedAction(
    orderStatus: OrderStatus,
    fulfilmentStatus: FulfilmentStatus,
    shippingStatus: ShippingStatus,
    delayed: boolean,
    failedFulfilment: boolean,
    routedSupplierId: string | null,
    exceptions: OrderException[],
  ): string {
    if (failedFulfilment || fulfilmentStatus === "failed" || shippingStatus === "failed") {
      return "Escalate failed fulfilment to Pillow — never process payments, issue refunds, or modify inventory from Order Worker";
    }
    if (!routedSupplierId) {
      return "Escalate supplier routing failure to Pillow for supplier assignment — Order Worker must not modify inventory";
    }
    if (exceptions.some((e) => e.code === "STOCK_UNAVAILABLE")) {
      return "Escalate stock unavailability to Pillow — do not modify inventory directly from Order Worker";
    }
    if (orderStatus === "exception") {
      return "Escalate critical order exceptions to Pillow and preserve full order/fulfilment history";
    }
    if (delayed || orderStatus === "delayed") {
      return "Monitor delayed order and escalate to Pillow if delay worsens — never alter financial records";
    }
    if (orderStatus === "cancelled" || orderStatus === "closed") {
      return "Preserve cancelled/closed order history; take no further fulfilment or financial actions";
    }
    if (orderStatus === "delivered" || shippingStatus === "delivered") {
      return "Order delivered — preserve complete order and fulfilment history; no payment or inventory actions";
    }
    if (orderStatus === "shipped") {
      return "Continue tracking shipment status and generate customer updates; escalate only on failure or delay";
    }
    if (fulfilmentStatus === "awaiting_supplier" || orderStatus === "awaiting_fulfilment") {
      return "Continue monitoring supplier fulfilment; escalate if supplier does not progress";
    }
    return "Continue order lifecycle tracking, fulfilment monitoring, and customer status updates — never process payments or modify inventory";
  }

  compileEvidence(
    order: ConfirmedOrderInput,
    orderId: string,
    customerId: string,
    productId: string,
    supplierId: string | null,
    orderStatus: OrderStatus,
    fulfilmentStatus: FulfilmentStatus,
    shippingStatus: ShippingStatus,
    routedSupplierId: string | null,
    delayed: boolean,
    failedFulfilment: boolean,
    input: OrderWorkerInput,
    inventoryContext:
      | {
          stockStatus?: string | null;
          inventoryReportId?: string | null;
        }
      | null
      | undefined,
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
      "confirmed_order",
      `Order lifecycle prepared for order ${orderId} / customer ${customerId}`,
      order.orderId?.trim() ? "fact" : "assumption",
      "order",
    );
    add(
      "product",
      `Product reference ${productId}`,
      order.productId?.trim() ? "fact" : "assumption",
      "product",
    );
    if (supplierId) {
      add(
        "supplier_reference",
        `Supplier reference preserved: ${supplierId}`,
        "fact",
        "traceability",
      );
    }
    add(
      "routing",
      routedSupplierId
        ? `Order routed to supplier ${routedSupplierId}`
        : "Supplier routing failed — no supplier available",
      routedSupplierId ? "fact" : "assumption",
      "routing",
    );
    add(
      "order_status",
      `Order status resolved as ${orderStatus}`,
      "fact",
      "status",
    );
    add(
      "fulfilment_status",
      `Fulfilment status resolved as ${fulfilmentStatus}`,
      order.fulfilmentStatus != null ? "fact" : "assumption",
      "fulfilment",
    );
    add(
      "shipping_status",
      `Shipping status resolved as ${shippingStatus}`,
      order.shippingStatus != null ? "fact" : "assumption",
      "shipping",
    );
    if (delayed) {
      add("delay_detection", "Delayed order condition detected", "fact", "exception");
    }
    if (failedFulfilment) {
      add(
        "fulfilment_failure",
        "Failed fulfilment condition detected",
        "fact",
        "exception",
      );
    }
    if (inventoryContext?.inventoryReportId) {
      add(
        "inventory_worker",
        `Traceable to Inventory Report ${inventoryContext.inventoryReportId}`,
        "fact",
        "traceability",
      );
    }
    if (inventoryContext?.stockStatus) {
      add(
        "inventory_stock_status",
        `Inventory stock status observed as ${inventoryContext.stockStatus}`,
        "fact",
        "inventory",
      );
    }
    if (order.evaluationId) {
      add(
        "evaluation_reference",
        `Traceable to evaluation ${order.evaluationId}`,
        "fact",
        "traceability",
      );
    }
    add(
      "boundary",
      "Lifecycle-only: does not process payments, issue refunds, modify inventory, alter financial records, or override Pillow/Grand King",
      "fact",
      "governance",
    );
    return items;
  }

  scoreConfidence(
    orderId: string,
    customerId: string,
    productId: string,
    supplierId: string | null,
    inventoryReportId: string | null,
    evidence: EvidenceItem[],
  ): number {
    let score = 0.3;
    if (orderId && !orderId.startsWith("ord-")) score += 0.15;
    else if (orderId) score += 0.05;
    if (customerId && !customerId.startsWith("cust-")) score += 0.15;
    else if (customerId) score += 0.05;
    if (productId && !productId.startsWith("prod-order-")) score += 0.15;
    else if (productId) score += 0.05;
    if (supplierId?.trim()) score += 0.15;
    if (inventoryReportId?.trim()) score += 0.1;
    score += Math.min(0.1, evidence.filter((e) => e.kind === "fact").length * 0.02);
    return Number(Math.max(0.05, Math.min(0.95, score)).toFixed(2));
  }
}

let orderSequence = 0;

export function resetOrderSequenceForTesting() {
  orderSequence = 0;
}

function cloneReport(report: OrderReport): OrderReport {
  return {
    ...report,
    exceptions: report.exceptions.map((e) => ({ ...e })),
    customerUpdates: report.customerUpdates.map((u) => ({ ...u })),
    escalations: report.escalations.map((e) => ({ ...e })),
    fulfilmentHistory: report.fulfilmentHistory.map((h) => ({ ...h })),
    orderHistory: report.orderHistory.map((h) => ({ ...h })),
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
  };
}
