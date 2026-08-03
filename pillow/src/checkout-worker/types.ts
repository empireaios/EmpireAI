import type { CheckoutWorkerConfiguration } from "./configuration.js";
import type {
  CHECKOUT_FLOW_TYPES,
  CKW_CAPABILITIES,
  DELIVERY_HANDOFF_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  FEATURES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  PAYMENT_PROVIDERS,
  PRODUCT_TYPES,
  RESEARCH_COMPLIANCE_LEVELS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ProductType = (typeof PRODUCT_TYPES)[number];
export type CheckoutFlowType = (typeof CHECKOUT_FLOW_TYPES)[number];
export type CheckoutFeature = (typeof FEATURES)[number];
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];
export type DeliveryHandoffStatus = (typeof DELIVERY_HANDOFF_STATUSES)[number];
export type ResearchComplianceLevel = (typeof RESEARCH_COMPLIANCE_LEVELS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type CheckoutWorkerCapability = (typeof CKW_CAPABILITIES)[number];

export type CheckoutFlowStep = {
  stepId: string;
  stepType: string;
  title: string;
  order: number;
  summary?: string;
};

export type CheckoutFlow = {
  flowType: CheckoutFlowType;
  label: string;
  steps: CheckoutFlowStep[];
};

/** Structural payment-provider config — never secrets, API keys, or card data. */
export type PaymentProviderConfiguration = {
  provider: PaymentProvider;
  providerName: string;
  mode: "test_ready" | "live_ready_placeholder" | "manual";
  currency: string;
  webhookEndpointPlaceholder: string;
  supportedMethods: string[];
  /** Explicitly absent — structural signal only. */
  apiKeyPresent: false;
  secretsPresent: false;
};

export type OrderLineItem = {
  lineItemId: string;
  label: string;
  quantity: number;
  unitAmount: number;
  currency: string;
};

export type OrderSummary = {
  lineItems: OrderLineItem[];
  subtotal: number;
  currency: string;
  discountPlaceholder: string | null;
  couponPlaceholder: string | null;
  taxPlaceholder: string | null;
  notes: string;
};

export type ConfirmationWorkflowStep = {
  stepId: string;
  title: string;
  body: string;
  order: number;
};

export type ConfirmationWorkflow = {
  workflowId: string;
  steps: ConfirmationWorkflowStep[];
  customerFacingSummary: string;
};

export type CheckoutValidationResults = {
  summary: string;
  errors: string[];
  warnings: string[];
  purchaseInformationValid: boolean;
  checkoutReady: boolean;
};

export type PreservedDecision = {
  decisionId: string;
  topic: string;
  decision: string;
  recordedAt: string;
};

export type SelfReviewFinding = {
  findingId: string;
  category: string;
  severity: "info" | "warning" | "error";
  message: string;
};

/** Machine-readable Checkout Report (Q5-09). */
export type CheckoutReport = {
  checkoutId: string;
  timestamp: string;
  productId: string;
  productTitle: string;
  checkoutFlow: CheckoutFlow;
  paymentProviderConfiguration: PaymentProviderConfiguration | null;
  orderSummary: OrderSummary | null;
  customerInformationRequirements: string[];
  deliveryHandoffStatus: DeliveryHandoffStatus;
  validationResults: CheckoutValidationResults;
  confidenceScore: number;
  metadataVersion: string;
  researchReportId: string | null;
  opportunityId: string | null;
  businessId: string;
  factoryMissionId: string;
  salesPageId: string | null;
  checkoutFlowType: CheckoutFlowType;
  productType: ProductType;
  checkoutFlowSteps: CheckoutFlowStep[];
  supportedProviders: PaymentProvider[];
  supportedFeatures: CheckoutFeature[];
  confirmationWorkflow: ConfirmationWorkflow | null;
  purchaseInformationValid: boolean;
  checkoutReady: boolean;
  handoffTarget: "digital-delivery-worker";
  handoffTargetWorkerId: "wkr-digital-delivery-01";
  selfReviewPassed: boolean;
  selfReviewFindings: SelfReviewFinding[];
  selfReviewSummary: string;
  qualityReview: string;
  complianceReview: string;
  researchCompliance: ResearchComplianceLevel;
  researchComplianceNotes: string;
  workerId: string;
  reportVersion: string;
  traceabilityRefs: string[];
  preservedDecisions: PreservedDecision[];
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  neverChargeCustomers: true;
  neverExecutePaymentTransactions: true;
  neverDeliverProducts: true;
  neverPublishStorefronts: true;
  neverStoreSensitivePaymentCredentials: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ510OrLater: true;
  followApprovedProductInformation: true;
  preserveCompleteTraceability: true;
  validateCheckoutIntegrityBeforeSubmission: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type CheckoutContext = {
  researchReportId?: string | null;
  opportunityId?: string | null;
  businessId?: string | null;
  factoryMissionId?: string | null;
  salesPageId?: string | null;
  productTitle?: string | null;
  productType?: ProductType | null;
  checkoutFlowType?: CheckoutFlowType | null;
  targetAudience?: string | null;
  customerPainPoints?: string[];
  marketGap?: string | null;
  demandAssessment?: string | null;
  researchTopic?: string | null;
  productDescription?: string | null;
  pricingHint?: string | null;
  currency?: string | null;
  preferredProviders?: PaymentProvider[] | null;
  receivedProductInformation?: boolean;
};

export type CheckoutWorkerInput = {
  checkoutId?: string | null;
  productId?: string | null;
  productTitle?: string | null;
  productType?: ProductType | string | null;
  checkoutFlowType?: CheckoutFlowType | string | null;
  productCategory?: string | null;
  productDescription?: string | null;
  targetAudience?: string | null;
  researchReportId?: string | null;
  opportunityId?: string | null;
  businessId?: string | null;
  factoryMissionId?: string | null;
  salesPageId?: string | null;
  customerPainPoints?: string[] | null;
  marketGap?: string | null;
  demandAssessment?: string | null;
  researchTopic?: string | null;
  pricingHint?: string | null;
  currency?: string | null;
  preferredProviders?: PaymentProvider[] | string[] | null;
  confidenceScore?: number | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  chargeCustomers?: boolean;
  executePaymentTransactions?: boolean;
  processPayments?: boolean;
  deliverProducts?: boolean;
  publishStorefronts?: boolean;
  storeSensitivePaymentCredentials?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ510OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type CheckoutWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CheckoutWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-CKW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CheckoutWorkerCapability[];
  totalCheckouts: number;
  lastCheckoutId: string | null;
  lastCheckoutFlowType: CheckoutFlowType | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type CheckoutWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  checkouts: CheckoutReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverChargeCustomers: true;
  neverExecutePaymentTransactions: true;
  neverDeliverProducts: true;
  neverPublishStorefronts: true;
  neverStoreSensitivePaymentCredentials: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type CheckoutWorkerRunReport = {
  checkoutRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_approved_digital_product_information"
    | "generate_checkout_workflow"
    | "prepare_payment_provider_configuration"
    | "generate_order_summary"
    | "generate_customer_confirmation_workflow"
    | "validate_required_purchase_information"
    | "prepare_post_payment_handoff"
    | "configure_payment_provider_abstraction"
    | "validate_checkout_readiness"
    | "produce_checkout_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: CheckoutWorkerEngineRecord;
  catalog: CheckoutWorkerCatalog | null;
  checkouts: CheckoutReport[];
  latestCheckout: CheckoutReport | null;
  integrations: IntegrationHandshake[];
  validation: CheckoutWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CheckoutWorkerState = {
  engineVersion: "PILLOW-CKW-001";
  missionId: "Q5-09";
  status: EngineStatus;
  initializedAt: string;
  configuration: CheckoutWorkerConfiguration;
  latestReport: CheckoutWorkerRunReport | null;
  engineRecord: CheckoutWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalCheckouts: number;
    lastCheckoutId: string | null;
    lastCheckoutFlowType: CheckoutFlowType | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type CheckoutWorkerCockpitSnapshot = {
  missionId: "Q5-09";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalCheckouts: number;
  latestCheckoutId: string | null;
  lastCheckoutFlowType: CheckoutFlowType | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverChargeCustomers: true;
  neverExecutePaymentTransactions: true;
  neverDeliverProducts: true;
  neverPublishStorefronts: true;
  neverStoreSensitivePaymentCredentials: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type SelfReviewResult = {
  passed: boolean;
  summary: string;
  qualityReview: string;
  complianceReview: string;
  findings: SelfReviewFinding[];
  confidenceScore: number;
  researchCompliance: ResearchComplianceLevel;
  researchComplianceNotes: string;
  purchaseInformationValid: boolean;
  checkoutReady: boolean;
};
