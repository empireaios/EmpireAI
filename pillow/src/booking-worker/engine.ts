import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildBookingWorkerConfiguration,
  type BookingWorkerConfiguration,
} from "./configuration.js";
import type { BookingWorkerDependencies } from "./integrations.js";
import { resetBookingSequenceForTesting } from "./booking-builder.js";
import { BookingManager } from "./booking-manager.js";
import { BOOKING_WORKER_SYSTEM_PATH } from "./paths.js";
import { BookingWorkerController } from "./booking-worker-controller.js";
import { resetBkwLogsForTesting } from "./bkw-logging.js";
import { resetSchedulingSequenceForTesting } from "./scheduling-engine.js";
import type {
  BookingInput,
  BookingWorkerCockpitSnapshot,
  BookingWorkerState,
  Q705ConsumableContract,
} from "./types.js";

export interface BookingWorkerOptions {
  configuration?: Partial<BookingWorkerConfiguration>;
  dependencies?: BookingWorkerDependencies;
}

/** Authoritative Q7-04 Booking Worker — structural booking/scheduling signals only. */
export class BookingWorker {
  private initializedAt: string | null = null;
  private readonly controller: BookingWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: BookingWorkerOptions = {},
  ) {
    const manager = new BookingManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new BookingWorkerController(
      manager,
      buildBookingWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      BOOKING_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Booking Worker")) {
      throw new Error(
        `${BOOKING_WORKER_SYSTEM_PATH} missing — Q7-04 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: BookingWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): BookingWorkerState {
    if (!this.initializedAt) {
      throw new Error("Booking Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-BKW-001",
      missionId: "Q7-04",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore:
          engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalReports: engineRecord?.totalReports ?? 0,
        totalBookings: engineRecord?.totalBookings ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        lastBookingId: engineRecord?.lastBookingId ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Booking Worker produces structural booking and calendar signals only: does not perform the service, process payments, replace CRM, fabricate booking confirmations, override approved architecture, override Pillow or Grand King, or implement Q7-05 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  consumeServiceOffer(input: BookingInput = {}) {
    return this.controller.consumeServiceOffer(input);
  }

  createBooking(input: BookingInput = {}) {
    return this.controller.createBooking(input);
  }

  manageCalendar(input: BookingInput = {}) {
    return this.controller.manageCalendar(input);
  }

  setAvailability(input: BookingInput = {}) {
    return this.controller.setAvailability(input);
  }

  allocateTimeSlots(input: BookingInput = {}) {
    return this.controller.allocateTimeSlots(input);
  }

  assignWorker(input: BookingInput = {}) {
    return this.controller.assignWorker(input);
  }

  modifyBooking(input: BookingInput = {}) {
    return this.controller.modifyBooking(input);
  }

  cancelBooking(input: BookingInput = {}) {
    return this.controller.cancelBooking(input);
  }

  rescheduleBooking(input: BookingInput = {}) {
    return this.controller.rescheduleBooking(input);
  }

  validateAvailability(input: BookingInput = {}) {
    return this.controller.validateAvailability(input);
  }

  preventConflicts(input: BookingInput = {}) {
    return this.controller.preventConflicts(input);
  }

  generateConfirmation(input: BookingInput = {}) {
    return this.controller.generateConfirmation(input);
  }

  produceBookingReport(input: BookingInput = {}) {
    return this.controller.produceBookingReport(input);
  }

  produceReport(input: BookingInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: BookingInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getBookings() {
    return this.controller.getManager().getBookings();
  }

  getReports() {
    return this.controller.getManager().getReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  getBookingHistory() {
    return this.controller.getManager().getBookingHistory();
  }

  validate(input: BookingInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  runDiagnostics() {
    return this.controller.runDiagnostics();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestReportId() {
    return this.controller.getManager().getLatestReportId();
  }

  getLatestBookingId() {
    return this.controller.getManager().getLatestBookingId();
  }

  getIntegrations() {
    return this.controller.getManager().getIntegrations();
  }

  validateForSupervisorSync() {
    const state = this.getState();
    const score =
      state.latestReport?.validation.decision === "fail"
        ? 40
        : state.latestReport?.validation.decision === "partial"
          ? 70
          : 100;
    return {
      valid: state.health.status !== "failed",
      health:
        score >= 75
          ? ("healthy" as const)
          : score >= 50
            ? ("degraded" as const)
            : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Booking reports: ${state.health.totalReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): BookingWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q7-04",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      totalBookings: state.health.totalBookings,
      latestReportId: this.getLatestReportId(),
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverPerformTheService: true,
      neverProcessPayments: true,
      neverReplaceCrm: true,
      neverFabricateBookingConfirmations: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ705OrLater: true,
      consumableByQ705: true,
    };
  }

  getQ705ConsumableContract(): Q705ConsumableContract {
    return {
      contractVersion: "BKW-Q705-v1",
      consumableByQ705: true,
      fields: [
        "reportId",
        "businessProjectId",
        "bookingId",
        "customerReference",
        "serviceSelected",
        "packageId",
        "scheduledDateTime",
        "assignedWorker",
        "bookingStatus",
        "availabilityValidation",
        "sourceOfferReportId",
        "confirmationId",
        "conflictCheckPassed",
        "confidenceScore",
        "traceabilityRefs",
      ] as const,
      types: {
        BookingReport: "BookingReport",
        BookingRecord: "BookingRecord",
        BookingConfirmation: "BookingConfirmation",
        CalendarSlot: "CalendarSlot",
        AvailabilityWindow: "AvailabilityWindow",
      },
      notes: [
        "Q7-05 may consume structural booking records and reports only.",
        "completed_booking_record closes booking lifecycle — not service fulfilment.",
        "BKW never performs the service, processes payments, replaces CRM, or fabricates confirmations.",
      ],
      neverPerformTheService: true,
      neverProcessPayments: true,
      neverReplaceCrm: true,
      neverFabricateBookingConfirmations: true,
    };
  }
}

export function createBookingWorker(
  bootstrap: EmpireBootstrapContext,
  options?: BookingWorkerOptions,
) {
  return new BookingWorker(bootstrap, options);
}

export function resetBookingWorkerForTesting() {
  resetBkwLogsForTesting();
  resetBookingSequenceForTesting();
  resetSchedulingSequenceForTesting();
}
