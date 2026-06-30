import type { Order } from "../../../orders/index.js";

/** CJ Dropshipping order submission payload (API2.0 shape). */
export type CjOrderPayload = {
  orderNumber: string;
  shippingCountryCode: string;
  shippingProvince: string;
  shippingCity: string;
  shippingAddress: string;
  shippingCustomerName: string;
  shippingPhone: string;
  shippingZip: string;
  products: Array<{
    vid: string;
    quantity: number;
  }>;
  remark?: string;
  sandbox: boolean;
};

/** CJ order submission response (normalized). */
export type CjOrderSubmissionResult = {
  supplierOrderId: string;
  status: "SUBMITTED" | "SANDBOX_SIMULATED";
  integrationMode: "SANDBOX" | "LIVE";
  submittedAt: string;
  message: string;
};

/** CJ tracking snapshot from supplier API or sandbox fixture. */
export type CjTrackingSnapshot = {
  supplierOrderId: string;
  trackingNumber: string;
  carrier: string;
  deliveryStatus: "PENDING" | "IN_TRANSIT" | "DELIVERED" | "FAILED";
  events: Array<{
    status: string;
    description: string;
    location: string | null;
    occurredAt: string;
  }>;
};

/** Fulfillment cost and delivery estimate. */
export type CjFulfillmentEstimate = {
  estimatedCost: number;
  currency: string;
  estimatedDeliveryDaysMin: number;
  estimatedDeliveryDaysMax: number;
  shippingMethod: string;
  valid: boolean;
  issues: string[];
};

/** Supplier validation result for an order. */
export type CjOrderValidationResult = {
  valid: boolean;
  issues: string[];
  order: Order;
};

/** Approval gate input required before live submission. */
export type CjOrderApprovalInput = {
  approvalToken: string;
  approvedBy: string;
  approvedAt: string;
  approved: true;
};
