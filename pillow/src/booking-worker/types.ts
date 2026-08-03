import type {
  Q704ConsumableContract,
  ServiceCatalogueItem,
  ServiceOfferReport,
  ServicePackage,
} from "../service-offer-worker/types.js";
import type { BookingWorkerConfiguration } from "./configuration.js";
import type {
  BOOKING_STATUSES,
  BKW_CAPABILITIES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type BookingWorkerCapability = (typeof BKW_CAPABILITIES)[number];

export type { Q704ConsumableContract, ServiceCatalogueItem, ServiceOfferReport, ServicePackage };

/** Deterministic fixture mirroring SOW report shape for tests / offline booking. */
export type ServiceOfferFixture = {
  reportId?: string;
  businessProjectId?: string;
  sourceResearchId?: string;
  serviceCatalogue?: Array<{
    serviceId: string;
    name: string;
    description?: string;
    category?: string;
    targetSegments?: string[];
    geographicCoverage?: string;
  }>;
  servicePackages?: Array<{
    packageId: string;
    name: string;
    targetCustomer?: string;
    pricingModel?: string;
    estimatedDuration?: string;
    durationMinutes?: number;
    geographicCoverage?: string;
    packageType?: string;
    inclusions?: string[];
    exclusions?: string[];
  }>;
  confidenceScore?: number;
  executiveSummary?: string;
};

export type AvailabilityValidation = {
  validated: boolean;
  available: boolean;
  conflictDetected: boolean;
  conflictDetails: string[];
  slotId: string | null;
  windowId: string | null;
  notes: string[];
};

export type CalendarSlot = {
  slotId: string;
  calendarId: string;
  startDateTime: string;
  endDateTime: string;
  durationMinutes: number;
  serviceArea: string;
  assignedWorkerId: string | null;
  bookingId: string | null;
  status: "open" | "held" | "booked" | "blocked" | "released";
};

export type AvailabilityWindow = {
  windowId: string;
  calendarId: string;
  workerId: string;
  startDateTime: string;
  endDateTime: string;
  serviceArea: string;
  capacity: number;
  notes: string[];
};

export type TechnicianAssignment = {
  assignmentId: string;
  bookingId: string;
  workerId: string;
  workerName: string;
  skills: string[];
  assignedAt: string;
  status: "assigned" | "reassigned" | "released";
};

export type BookingRecord = {
  bookingId: string;
  createdAt: string;
  updatedAt: string;
  businessProjectId: string;
  customerReference: string;
  serviceSelected: string;
  packageId: string;
  serviceArea: string;
  scheduledDateTime: string;
  scheduledEndDateTime: string;
  durationMinutes: number;
  assignedWorker: string | null;
  bookingStatus: BookingStatus;
  sourceOfferReportId: string;
  slotId: string | null;
  calendarId: string | null;
  confirmationId: string | null;
  reminderScheduled: boolean;
  recurringSeriesId: string | null;
  conflictCheckPassed: boolean;
  availabilityValidation: AvailabilityValidation;
  outstandingIssues: string[];
  auditStatus: "open" | "audited" | "archived";
  history: Array<{ timestamp: string; action: string; details: string }>;
};

export type BookingConfirmation = {
  confirmationId: string;
  bookingId: string;
  confirmedAt: string;
  customerReference: string;
  serviceSelected: string;
  scheduledDateTime: string;
  assignedWorker: string | null;
  bookingStatus: BookingStatus;
  fabricated: false;
  traceabilityRefs: string[];
};

export type BookingReport = {
  reportId: string;
  timestamp: string;
  businessProjectId: string;
  bookingId: string;
  customerReference: string;
  serviceSelected: string;
  scheduledDateTime: string;
  assignedWorker: string | null;
  bookingStatus: BookingStatus;
  availabilityValidation: AvailabilityValidation;
  auditStatus: "open" | "audited" | "archived";
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  sourceOfferReportId: string;
  packageId: string;
  serviceArea: string;
  durationMinutes: number;
  reminderScheduled: boolean;
  recurringSeriesId: string | null;
  conflictCheckPassed: boolean;
  confirmationId: string | null;
  consumableByQ705: true;
  neverPerformTheService: true;
  neverProcessPayments: true;
  neverReplaceCrm: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverFabricateBookingConfirmations: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ705OrLater: true;
  preserveCompleteTraceability: true;
  preserveBookingAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
};

export type BookingInput = {
  reportId?: string | null;
  bookingId?: string | null;
  businessProjectId?: string | null;
  customerReference?: string | null;
  serviceSelected?: string | null;
  packageId?: string | null;
  serviceArea?: string | null;
  scheduledDateTime?: string | null;
  durationMinutes?: number | null;
  assignedWorker?: string | null;
  workerName?: string | null;
  calendarId?: string | null;
  slotId?: string | null;
  startDateTime?: string | null;
  endDateTime?: string | null;
  capacity?: number | null;
  reminderScheduled?: boolean;
  recurringSeriesId?: string | null;
  confirmationId?: string | null;
  serviceOfferReport?: ServiceOfferReport | null;
  fixtureServiceOffer?: ServiceOfferFixture | null;
  grandKingInstructions?: string | null;
  missionId?: string | null;
  validated?: boolean;
  grandKingApproved?: boolean;
  pillowCommandConfirmed?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  performTheService?: boolean;
  processPayments?: boolean;
  replaceCrm?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  fabricateBookingConfirmations?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ705OrLater?: boolean;
};

export type BookingContext = {
  bookingId: string;
  businessProjectId: string;
  sourceOfferReportId: string;
  serviceOffer: ServiceOfferReport | ServiceOfferFixture | null;
  serviceSelected: string;
  packageId: string;
  serviceArea: string;
  durationMinutes: number;
  scheduledDateTime: string;
  customerReference: string;
  now: string;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type BookingWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type BookingWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-BKW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: BookingWorkerCapability[];
  totalReports: number;
  totalBookings: number;
  lastBookingId: string | null;
  lastReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type BookingWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  reports: BookingReport[];
  bookings: BookingRecord[];
  calendars: Array<{ calendarId: string; businessProjectId: string; slots: CalendarSlot[] }>;
  confirmations: BookingConfirmation[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverPerformTheService: true;
  neverProcessPayments: true;
  neverReplaceCrm: true;
  neverFabricateBookingConfirmations: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ705OrLater: true;
  consumableByQ705: true;
};

export type BookingWorkerRunReport = {
  bookingRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "consume_service_offer"
    | "create_booking"
    | "manage_calendar"
    | "set_availability"
    | "allocate_time_slots"
    | "assign_worker"
    | "modify_booking"
    | "cancel_booking"
    | "reschedule_booking"
    | "validate_availability"
    | "prevent_conflicts"
    | "generate_confirmation"
    | "produce_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: BookingWorkerEngineRecord;
  catalog: BookingWorkerCatalog | null;
  reports: BookingReport[];
  bookings: BookingRecord[];
  latestReport: BookingReport | null;
  latestBooking: BookingRecord | null;
  latestConfirmation: BookingConfirmation | null;
  integrations: IntegrationHandshake[];
  validation: BookingWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type BookingWorkerState = {
  engineVersion: "PILLOW-BKW-001";
  missionId: "Q7-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: BookingWorkerConfiguration;
  latestReport: BookingWorkerRunReport | null;
  engineRecord: BookingWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    totalBookings: number;
    lastReportId: string | null;
    lastBookingId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type BookingWorkerCockpitSnapshot = {
  missionId: "Q7-04";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalBookings: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverPerformTheService: true;
  neverProcessPayments: true;
  neverReplaceCrm: true;
  neverFabricateBookingConfirmations: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ705OrLater: true;
  consumableByQ705: true;
};

/** Stable subset contract for Q7-05. */
export type Q705ConsumableContract = {
  contractVersion: "BKW-Q705-v1";
  consumableByQ705: true;
  fields: readonly string[];
  types: {
    BookingReport: "BookingReport";
    BookingRecord: "BookingRecord";
    BookingConfirmation: "BookingConfirmation";
    CalendarSlot: "CalendarSlot";
    AvailabilityWindow: "AvailabilityWindow";
  };
  notes: string[];
  neverPerformTheService: true;
  neverProcessPayments: true;
  neverReplaceCrm: true;
  neverFabricateBookingConfirmations: true;
};
