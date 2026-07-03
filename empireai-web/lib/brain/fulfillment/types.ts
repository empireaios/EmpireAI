export type FulfillmentReadinessView = {
  ready: boolean;
  issues: string[];
  integrationMode: "SANDBOX" | "LIVE";
  submissionAllowed: false;
  liveSubmitEnabled: false;
  safetyMessage: string;
};

export type ApprovalGateView = {
  satisfied: boolean;
  approvalToken: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  approved: boolean;
  orderStatus: string;
};

export type DraftOrderView = {
  orderId: string;
  status: string;
  fulfillmentStatus: string;
  integrationMode: "SANDBOX" | "LIVE";
  estimatedCost: number;
  estimatedDeliveryDaysMin: number;
  estimatedDeliveryDaysMax: number;
  currency: string;
  items: Array<{
    itemId: string;
    title: string;
    quantity: number;
    unitCost: number;
    supplierSku: string;
  }>;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    countryCode: string;
    phone: string;
  };
  payload: Record<string, unknown> | null;
};

export type FulfillmentPreparationView = {
  sessionId: string;
  runId: string;
  storeId: string;
  brandId: string;
  readiness: FulfillmentReadinessView;
  draftOrder: DraftOrderView;
  supplierValidation: {
    valid: boolean;
    issues: string[];
  };
  approvalGate: ApprovalGateView;
  autoSubmitEnabled: false;
};

export type FulfillmentReadinessSummary = {
  sessionId: string;
  runId: string;
  readiness: FulfillmentReadinessView;
  estimatedCost: number;
  estimatedDeliveryDaysMin: number;
  estimatedDeliveryDaysMax: number;
  currency: string;
  supplierValidation: {
    valid: boolean;
    issues: string[];
  };
  approvalGate: {
    satisfied: boolean;
    orderStatus: string;
  };
  autoSubmitEnabled: false;
  liveSubmitEnabled: false;
};

export type SandboxSubmissionView = {
  submitted: boolean;
  integrationMode: "SANDBOX";
  supplierOrderId: string;
  status: string;
  message: string;
  submittedAt: string;
  tracking: {
    trackingNumber: string;
    carrier: string;
    deliveryStatus: string;
    events: Array<{
      status: string;
      description: string;
      location: string | null;
      occurredAt: string;
    }>;
  } | null;
  paymentExecuted: false;
  walletDeducted: false;
};

export type OrderFulfillmentData = {
  preparation: FulfillmentPreparationView | null;
  readiness: FulfillmentReadinessSummary | null;
  draftOrder: DraftOrderView | null;
  approvalGate: ApprovalGateView | null;
  submission: SandboxSubmissionView | null;
};

export type OrderFulfillmentPhase =
  | "idle"
  | "preparing"
  | "ready"
  | "approving"
  | "submitting"
  | "submitted"
  | "error";
