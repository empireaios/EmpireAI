import type { ProductListingWorkerConfiguration } from "./configuration.js";
import type {
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EVIDENCE_KINDS,
  INTEGRATION_TARGETS,
  LISTING_VALIDATION_STATUSES,
  MARKETPLACE_TARGETS,
  OPERATIONAL_STATES,
  PLW_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ListingValidationStatus = (typeof LISTING_VALIDATION_STATUSES)[number];
export type MarketplaceTarget = (typeof MARKETPLACE_TARGETS)[number];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type ProductListingWorkerCapability = (typeof PLW_CAPABILITIES)[number];

export type EvidenceItem = {
  evidenceId: string;
  source: string;
  claim: string;
  kind: EvidenceKind;
  relatedTopic: string;
  recordedAt: string;
};

/** Approved product information input (read-only). */
export type ApprovedProductInput = {
  productId?: string | null;
  productName?: string | null;
  category?: string | null;
  brand?: string | null;
  keyFeatures?: string[] | null;
  materials?: string[] | null;
  dimensions?: string | null;
  colorOptions?: string[] | null;
  sizeOptions?: string[] | null;
  targetKeywords?: string[] | null;
  searchTerms?: string[] | null;
  supplierId?: string | null;
  supplierName?: string | null;
  evaluationId?: string | null;
  discoveryId?: string | null;
  businessMissionId?: string | null;
};

/** Approved product image reference from Q3-07 (read-only). */
export type ApprovedImageRef = {
  imageReportId?: string | null;
  packageId?: string | null;
  primaryImageUri?: string | null;
  galleryImageUris?: string[] | null;
  imageQualityStatus?: string | null;
  complianceStatus?: string | null;
};

export type ListingAttribute = {
  key: string;
  value: string;
};

export type ListingVariant = {
  variantId: string;
  sku: string;
  title: string;
  attributes: ListingAttribute[];
};

export type SeoFields = {
  metaTitle: string;
  metaDescription: string;
  searchTerms: string[];
  backendKeywords: string[];
};

export type ListingPackage = {
  packageId: string;
  marketplace: MarketplaceTarget;
  fields: Record<string, string | string[] | ListingAttribute[] | ListingVariant[]>;
  imageRefs: string[];
  readyForReview: boolean;
  neverAutoPublished: true;
};

/** Machine-readable Product Listing Report (Q3-08). */
export type ProductListingReport = {
  listingId: string;
  timestamp: string;
  productId: string;
  productName: string;
  marketplace: MarketplaceTarget;
  productTitle: string;
  productDescription: string;
  bulletPoints: string[];
  attributes: ListingAttribute[];
  variants: ListingVariant[];
  seoFields: SeoFields;
  listingValidationStatus: ListingValidationStatus;
  listingPackage: ListingPackage;
  supplierId: string | null;
  supplierName: string | null;
  imageReportId: string | null;
  evaluationId: string | null;
  discoveryId: string | null;
  supportingEvidence: EvidenceItem[];
  confidenceScore: number;
  businessMissionId: string | null;
  metadataVersion: string;
  reportVersion: string;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  workerId: string;
  neverPublishListings: true;
  neverModifySupplierInformation: true;
  neverModifyPricing: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ309OrLater: true;
  preserveProductTraceability: true;
  preserveSupplierReferences: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type ProductListingWorkerInput = {
  listingId?: string | null;
  marketplace?: MarketplaceTarget | string | null;
  approvedProduct?: ApprovedProductInput | null;
  productId?: string | null;
  productName?: string | null;
  category?: string | null;
  brand?: string | null;
  keyFeatures?: string[] | null;
  materials?: string[] | null;
  dimensions?: string | null;
  colorOptions?: string[] | null;
  sizeOptions?: string[] | null;
  targetKeywords?: string[] | null;
  searchTerms?: string[] | null;
  supplierId?: string | null;
  supplierName?: string | null;
  evaluationId?: string | null;
  discoveryId?: string | null;
  businessMissionId?: string | null;
  approvedImages?: ApprovedImageRef | null;
  imageReportId?: string | null;
  evidenceSources?: Array<{
    source?: string | null;
    claim?: string | null;
    kind?: EvidenceKind | string | null;
    relatedTopic?: string | null;
  }> | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  publishListings?: boolean;
  modifySupplierInformation?: boolean;
  modifyPricing?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ309OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type ProductListingWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ProductListingWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-PLW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: ProductListingWorkerCapability[];
  totalListings: number;
  lastListingValidationStatus: ListingValidationStatus | null;
  lastListingId: string | null;
  lastMarketplace: MarketplaceTarget | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type ProductListingWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  listings: ProductListingReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverPublishListings: true;
  neverModifySupplierInformation: true;
  neverModifyPricing: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type ProductListingWorkerRunReport = {
  listingRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_product_information"
    | "receive_product_images"
    | "generate_titles"
    | "generate_descriptions"
    | "generate_bullet_points"
    | "generate_attributes"
    | "generate_variants"
    | "generate_seo_fields"
    | "validate_listing_fields"
    | "produce_listing_package"
    | "produce_report"
    | "submit_findings"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: ProductListingWorkerEngineRecord;
  catalog: ProductListingWorkerCatalog | null;
  listings: ProductListingReport[];
  latestListing: ProductListingReport | null;
  integrations: IntegrationHandshake[];
  validation: ProductListingWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ProductListingWorkerState = {
  engineVersion: "PILLOW-PLW-001";
  missionId: "Q3-08";
  status: EngineStatus;
  initializedAt: string;
  configuration: ProductListingWorkerConfiguration;
  latestReport: ProductListingWorkerRunReport | null;
  engineRecord: ProductListingWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalListings: number;
    lastListingId: string | null;
    lastListingValidationStatus: ListingValidationStatus | null;
    lastMarketplace: MarketplaceTarget | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type ProductListingWorkerCockpitSnapshot = {
  missionId: "Q3-08";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalListings: number;
  latestListingId: string | null;
  lastListingValidationStatus: ListingValidationStatus | null;
  lastMarketplace: MarketplaceTarget | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverPublishListings: true;
  neverModifySupplierInformation: true;
  neverModifyPricing: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
