import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BOOKING_STATUSES,
  BOOKING_WORKER_IDENTITY,
  BKW_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type { BookingReport, BookingStatus } from "./types.js";

export type BookingWorkerConfiguration = {
  enabled: boolean;
  bookingRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  bookingStatuses: BookingStatus[];
  defaultSlotMinutes: number;
  seedReports: BookingReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q7-04 hard boundaries — force-locked true. */
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
};

export const DEFAULT_BOOKING_WORKER_CONFIGURATION: BookingWorkerConfiguration = {
  enabled: true,
  bookingRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: BOOKING_WORKER_IDENTITY.workerId,
  workerName: BOOKING_WORKER_IDENTITY.workerName,
  factory: BOOKING_WORKER_IDENTITY.factory,
  department: BOOKING_WORKER_IDENTITY.department,
  role: BOOKING_WORKER_IDENTITY.role,
  reportingLine: [...BOOKING_WORKER_IDENTITY.reportingLine],
  bookingStatuses: [...BOOKING_STATUSES],
  defaultSlotMinutes: 60,
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverPerformTheService: true,
  neverProcessPayments: true,
  neverReplaceCrm: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverFabricateBookingConfirmations: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ705OrLater: true,
  preserveCompleteTraceability: true,
  preserveBookingAuditHistory: true,
  neverExposeCredentials: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildBookingWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<BookingWorkerConfiguration> = {},
): BookingWorkerConfiguration {
  let file: Partial<BookingWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "booking-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.BOOKING_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.BOOKING_WORKER_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (key: "integrationTargets" | "bookingStatuses") =>
    Array.from(
      new Set([
        ...DEFAULT_BOOKING_WORKER_CONFIGURATION[key],
        ...((file[key] as string[] | undefined) ?? []),
        ...((overrides[key] as string[] | undefined) ?? []),
      ]),
    );

  return {
    ...DEFAULT_BOOKING_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    bookingStatuses: mergeList("bookingStatuses") as BookingStatus[],
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_BOOKING_WORKER_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) =>
      lockReport(report),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverPerformTheService: true,
    neverProcessPayments: true,
    neverReplaceCrm: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricateBookingConfirmations: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ705OrLater: true,
    preserveCompleteTraceability: true,
    preserveBookingAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: BookingReport): BookingReport {
  return {
    ...report,
    outstandingIssues: [...report.outstandingIssues],
    traceabilityRefs: [...report.traceabilityRefs],
    availabilityValidation: {
      ...report.availabilityValidation,
      conflictDetails: [...report.availabilityValidation.conflictDetails],
      notes: [...report.availabilityValidation.notes],
    },
    metadataVersion: report.metadataVersion || BKW_METADATA_VERSION,
    consumableByQ705: true,
    neverPerformTheService: true,
    neverProcessPayments: true,
    neverReplaceCrm: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricateBookingConfirmations: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ705OrLater: true,
    preserveCompleteTraceability: true,
    preserveBookingAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
