import type { BookingWorkerConfiguration } from "./configuration.js";
import { BookingBuilder, resolvePackageFromOffer } from "./booking-builder.js";
import { BookingStore } from "./booking-store.js";
import {
  BookingValidator,
  HealthMonitor,
  RecoveryManager,
} from "./booking-validator.js";
import {
  IntegrationCoordinator,
  type BookingWorkerDependencies,
} from "./integrations.js";
import { appendBkwLog } from "./bkw-logging.js";
import {
  BOOKING_WORKER_ID,
  BKW_CAPABILITIES,
  BKW_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import { SchedulingEngine } from "./scheduling-engine.js";
import type {
  BookingConfirmation,
  BookingInput,
  BookingRecord,
  BookingReport,
  BookingWorkerCatalog,
  BookingWorkerEngineRecord,
  BookingWorkerRunReport,
  IntegrationHandshake,
  OperationalState,
  ServiceOfferFixture,
  ServiceOfferReport,
} from "./types.js";

export class BookingManager {
  private engineRecord: BookingWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: BookingWorkerCatalog | null = null;
  private readonly store = new BookingStore();
  private readonly builder = new BookingBuilder();
  private readonly validator = new BookingValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private readonly scheduling = new SchedulingEngine();
  private handshakes: IntegrationHandshake[] = [];
  private activeOffer: ServiceOfferReport | ServiceOfferFixture | null = null;
  private activeOfferId: string | null = null;
  private activeOfferSource:
    | "serviceOfferReport"
    | "reportId"
    | "fixtureServiceOffer"
    | "none" = "none";

  bindIntegrations(deps: BookingWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: BookingWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedReports);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listReports(),
      this.store.listBookings(),
      this.store.listCalendars(),
      this.store.listConfirmations(),
      this.handshakes,
    );
    this.seeded = true;
    this.ensureRecord("connected", config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
          integrationTargets: [...this.engineRecord.integrationTargets],
        }
      : null;
  }

  getCatalog() {
    return this.catalog ? cloneCatalog(this.catalog) : null;
  }

  getReports() {
    return this.store.listReports();
  }

  getBookings() {
    return this.store.listBookings();
  }

  getLatestReportId() {
    return this.store.getLatestReportId();
  }

  getLatestBookingId() {
    return this.store.getLatestBookingId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getBookingHistory() {
    return this.store.getBookingHistory();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: BookingWorkerConfiguration,
  ): BookingWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length
        ? config.integrationTargets
        : [...INTEGRATION_TARGETS],
    );
    this.refreshCatalog(config);
    this.ensureRecord("connected", config);
    appendBkwLog({
      event: "connect",
      details: `Booking Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      [],
      null,
      null,
      null,
      {
        validationReportId: `bkw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Booking Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: BKW_METADATA_VERSION,
      },
      started,
    );
  }

  consumeServiceOffer(input: BookingInput, config: BookingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.bookingRulesEnabled) {
      return this.disabled(
        "consume_service_offer",
        config,
        !config.enabled ? "Booking Worker is disabled" : "Booking rules are disabled",
      );
    }
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("consume_service_offer", input, config, started);
    }

    const resolved = this.resolveOffer(input);
    if (!resolved.offer) {
      const validation = this.validator.validateOfferPresence(null, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(
        "consume_service_offer",
        this.getCatalog(),
        [],
        [],
        null,
        null,
        null,
        validation,
        started,
      );
    }

    const offerId =
      ("reportId" in resolved.offer && resolved.offer.reportId) ||
      input.reportId?.trim() ||
      `offer-${Date.now()}`;
    this.activeOffer = resolved.offer;
    this.activeOfferId = String(offerId);
    this.activeOfferSource = resolved.source;
    this.store.saveConsumedOffer(this.activeOfferId, resolved.offer);
    this.refreshCatalog(config);
    const validation = this.validator.validateOfferPresence(resolved.offer, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendBkwLog({
      event: "consume_service_offer",
      details: `offer=${this.activeOfferId} source=${resolved.source}`,
    });
    return this.report(
      "consume_service_offer",
      this.getCatalog(),
      [],
      [],
      null,
      null,
      null,
      validation,
      started,
    );
  }

  createBooking(input: BookingInput, config: BookingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.bookingRulesEnabled) {
      return this.disabled(
        "create_booking",
        config,
        !config.enabled ? "Booking Worker is disabled" : "Booking rules are disabled",
      );
    }
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("create_booking", input, config, started);
    }

    const offerBundle = this.requireOffer(input);
    if (!offerBundle.offer) {
      const validation = this.validator.validateOfferPresence(null, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(
        "create_booking",
        this.getCatalog(),
        [],
        [],
        null,
        null,
        null,
        validation,
        started,
      );
    }

    const serviceCheck = this.validator.validateServiceAgainstOffer(
      input,
      offerBundle.offer,
      started,
    );
    if (serviceCheck.decision === "fail") {
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(
        "create_booking",
        this.getCatalog(),
        [],
        [],
        null,
        null,
        null,
        serviceCheck,
        started,
      );
    }

    const resolved = resolvePackageFromOffer(offerBundle.offer, input);
    if (!resolved) {
      const validation = this.validator.finalize(
        "fail",
        ["Booking Worker rejects bookings for unknown services/packages not in consumed offer"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(
        "create_booking",
        this.getCatalog(),
        [],
        [],
        null,
        null,
        null,
        validation,
        started,
      );
    }

    const scheduledDateTime =
      input.scheduledDateTime?.trim() || new Date("2026-08-10T10:00:00.000Z").toISOString();
    const scheduledEndDateTime = this.scheduling.computeEndDateTime(
      scheduledDateTime,
      resolved.durationMinutes,
    );

    const businessProjectId = String(
      input.businessProjectId ?? offerBundle.offer.businessProjectId ?? "unspecified",
    );
    const calendar = this.scheduling.ensureCalendar(
      this.store,
      businessProjectId,
      input.calendarId,
    );

    const availability = this.scheduling.validateAvailability(
      this.store,
      { ...input, scheduledDateTime, durationMinutes: resolved.durationMinutes },
      resolved.durationMinutes,
    );

    let conflictCheckPassed = true;
    const workerId = input.assignedWorker?.trim();
    if (workerId) {
      const conflict = this.scheduling.preventConflicts(
        this.store,
        workerId,
        scheduledDateTime,
        scheduledEndDateTime,
      );
      if (!conflict.passed) {
        const validation = this.validator.validateDoubleBook(
          conflict.overlaps,
          input.customerReference,
          started,
        );
        this.recovery.recordFailure();
        this.ensureRecord("failed", config, "failed");
        return this.report(
          "create_booking",
          this.getCatalog(),
          [],
          [],
          null,
          null,
          null,
          validation,
          started,
        );
      }
      conflictCheckPassed = conflict.passed;
    }

    // Soft warning: same customer + overlapping slot
    const warnings: string[] = [];
    if (input.customerReference) {
      const sameCustomer = this.store.listBookings().filter((b) => {
        if (b.customerReference !== input.customerReference) return false;
        if (b.bookingStatus === "cancelled" || b.bookingStatus === "failed") return false;
        const bStart = Date.parse(b.scheduledDateTime);
        const bEnd = Date.parse(b.scheduledEndDateTime);
        const start = Date.parse(scheduledDateTime);
        const end = Date.parse(scheduledEndDateTime);
        return start < bEnd && end > bStart;
      });
      if (sameCustomer.length) {
        warnings.push(
          `Same customer+slot soft warning: ${sameCustomer.map((b) => b.bookingId).join(", ")}`,
        );
      }
    }

    const booking = this.builder.createBookingRecord({
      input,
      offer: offerBundle.offer,
      sourceOfferReportId: offerBundle.offerId,
      resolved,
      scheduledDateTime,
      scheduledEndDateTime,
      availabilityValidation: availability,
      conflictCheckPassed,
      calendarId: calendar.calendarId,
      slotId: availability.slotId,
    });

    if (availability.slotId) {
      this.scheduling.bindSlotToBooking(
        this.store,
        calendar.calendarId,
        availability.slotId,
        booking.bookingId,
        booking.assignedWorker,
      );
    }

    const saved = this.store.saveBooking(booking, "create_booking");
    this.refreshCatalog(config);
    const validation = this.validator.finalize(
      warnings.length ? "partial" : "pass",
      [],
      warnings,
      started,
    );
    this.recovery.reset();
    this.ensureRecord("active", config, "passed", null, saved);
    appendBkwLog({
      event: "create_booking",
      details: `booking=${saved.bookingId} status=${saved.bookingStatus}`,
    });
    return this.report(
      "create_booking",
      this.getCatalog(),
      [],
      [saved],
      null,
      saved,
      null,
      validation,
      started,
    );
  }

  manageCalendar(input: BookingInput, config: BookingWorkerConfiguration) {
    return this.setAvailability(input, config, "manage_calendar");
  }

  setAvailability(
    input: BookingInput,
    config: BookingWorkerConfiguration,
    action: "manage_calendar" | "set_availability" = "set_availability",
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail(action, input, config, started);
    }
    const businessProjectId = String(
      input.businessProjectId ??
        this.activeOffer?.businessProjectId ??
        "unspecified",
    );
    try {
      this.scheduling.setAvailability(this.store, input, businessProjectId);
    } catch (error) {
      const validation = this.validator.finalize(
        "fail",
        [error instanceof Error ? error.message : "setAvailability failed"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], [], null, null, null, validation, started);
    }
    this.refreshCatalog(config);
    const validation = this.validator.finalize("pass", [], [], started);
    this.ensureRecord("active", config, "passed");
    return this.report(action, this.getCatalog(), [], [], null, null, null, validation, started);
  }

  allocateTimeSlots(input: BookingInput, config: BookingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("allocate_time_slots", input, config, started);
    }
    const businessProjectId = String(
      input.businessProjectId ??
        this.activeOffer?.businessProjectId ??
        "unspecified",
    );
    this.scheduling.allocateTimeSlots(
      this.store,
      input,
      businessProjectId,
      config.defaultSlotMinutes,
    );
    this.refreshCatalog(config);
    const validation = this.validator.finalize("pass", [], [], started);
    this.ensureRecord("active", config, "passed");
    return this.report(
      "allocate_time_slots",
      this.getCatalog(),
      [],
      [],
      null,
      null,
      null,
      validation,
      started,
    );
  }

  assignWorker(input: BookingInput, config: BookingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("assign_worker", input, config, started);
    }
    const booking = this.requireBooking(input);
    if (!booking) {
      return this.missingBooking("assign_worker", config, started);
    }
    const workerId = input.assignedWorker?.trim();
    if (!workerId) {
      const validation = this.validator.finalize(
        "fail",
        ["Booking Worker assignWorker requires assignedWorker"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(
        "assign_worker",
        this.getCatalog(),
        [],
        [],
        null,
        null,
        null,
        validation,
        started,
      );
    }

    const conflict = this.scheduling.preventConflicts(
      this.store,
      workerId,
      booking.scheduledDateTime,
      booking.scheduledEndDateTime,
      booking.bookingId,
    );
    if (!conflict.passed) {
      const validation = this.validator.validateDoubleBook(
        conflict.overlaps,
        booking.customerReference,
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(
        "assign_worker",
        this.getCatalog(),
        [],
        [booking],
        null,
        booking,
        null,
        validation,
        started,
      );
    }

    const updated: BookingRecord = {
      ...booking,
      assignedWorker: workerId,
      updatedAt: new Date().toISOString(),
      conflictCheckPassed: true,
      history: [
        ...booking.history,
        {
          timestamp: new Date().toISOString(),
          action: "assign_worker",
          details: `worker=${workerId}`,
        },
      ],
    };
    if (updated.calendarId && updated.slotId) {
      this.scheduling.bindSlotToBooking(
        this.store,
        updated.calendarId,
        updated.slotId,
        updated.bookingId,
        workerId,
      );
    }
    const saved = this.store.saveBooking(updated, "assign_worker");
    this.refreshCatalog(config);
    const validation = this.validator.finalize("pass", [], [], started);
    this.recovery.reset();
    this.ensureRecord("active", config, "passed", null, saved);
    return this.report(
      "assign_worker",
      this.getCatalog(),
      [],
      [saved],
      null,
      saved,
      null,
      validation,
      started,
    );
  }

  modifyBooking(input: BookingInput, config: BookingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("modify_booking", input, config, started);
    }
    const booking = this.requireBooking(input);
    if (!booking) return this.missingBooking("modify_booking", config, started);

    const nextScheduled = input.scheduledDateTime?.trim() || booking.scheduledDateTime;
    const nextDuration = input.durationMinutes ?? booking.durationMinutes;
    const nextEnd = this.scheduling.computeEndDateTime(nextScheduled, nextDuration);
    const workerId = input.assignedWorker?.trim() || booking.assignedWorker;

    if (workerId) {
      const conflict = this.scheduling.preventConflicts(
        this.store,
        workerId,
        nextScheduled,
        nextEnd,
        booking.bookingId,
      );
      if (!conflict.passed) {
        const validation = this.validator.validateDoubleBook(
          conflict.overlaps,
          booking.customerReference,
          started,
        );
        this.recovery.recordFailure();
        this.ensureRecord("failed", config, "failed");
        return this.report(
          "modify_booking",
          this.getCatalog(),
          [],
          [booking],
          null,
          booking,
          null,
          validation,
          started,
        );
      }
    }

    const availability = this.scheduling.validateAvailability(
      this.store,
      {
        ...input,
        bookingId: booking.bookingId,
        scheduledDateTime: nextScheduled,
        durationMinutes: nextDuration,
        assignedWorker: workerId,
      },
      nextDuration,
    );

    const updated: BookingRecord = {
      ...booking,
      scheduledDateTime: nextScheduled,
      scheduledEndDateTime: nextEnd,
      durationMinutes: nextDuration,
      assignedWorker: workerId,
      serviceArea: input.serviceArea?.trim() || booking.serviceArea,
      customerReference: input.customerReference?.trim() || booking.customerReference,
      reminderScheduled: input.reminderScheduled ?? booking.reminderScheduled,
      bookingStatus: "modified",
      availabilityValidation: availability,
      conflictCheckPassed: true,
      updatedAt: new Date().toISOString(),
      history: [
        ...booking.history,
        {
          timestamp: new Date().toISOString(),
          action: "modify_booking",
          details: `scheduled=${nextScheduled}`,
        },
      ],
    };
    const saved = this.store.saveBooking(updated, "modify_booking");
    this.refreshCatalog(config);
    const validation = this.validator.finalize("pass", [], [], started);
    this.recovery.reset();
    this.ensureRecord("active", config, "passed", null, saved);
    return this.report(
      "modify_booking",
      this.getCatalog(),
      [],
      [saved],
      null,
      saved,
      null,
      validation,
      started,
    );
  }

  cancelBooking(input: BookingInput, config: BookingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("cancel_booking", input, config, started);
    }
    const booking = this.requireBooking(input);
    if (!booking) return this.missingBooking("cancel_booking", config, started);

    this.scheduling.releaseSlotForBooking(this.store, booking);
    const updated: BookingRecord = {
      ...booking,
      bookingStatus: "cancelled",
      conflictCheckPassed: true,
      updatedAt: new Date().toISOString(),
      history: [
        ...booking.history,
        {
          timestamp: new Date().toISOString(),
          action: "cancel_booking",
          details: "slot released",
        },
      ],
    };
    const saved = this.store.saveBooking(updated, "cancel_booking");
    this.refreshCatalog(config);
    const validation = this.validator.finalize("pass", [], [], started);
    this.recovery.reset();
    this.ensureRecord("active", config, "passed", null, saved);
    return this.report(
      "cancel_booking",
      this.getCatalog(),
      [],
      [saved],
      null,
      saved,
      null,
      validation,
      started,
    );
  }

  rescheduleBooking(input: BookingInput, config: BookingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("reschedule_booking", input, config, started);
    }
    const booking = this.requireBooking(input);
    if (!booking) return this.missingBooking("reschedule_booking", config, started);
    if (!input.scheduledDateTime?.trim()) {
      const validation = this.validator.finalize(
        "fail",
        ["Booking Worker rescheduleBooking requires scheduledDateTime"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(
        "reschedule_booking",
        this.getCatalog(),
        [],
        [booking],
        null,
        booking,
        null,
        validation,
        started,
      );
    }

    const modified = this.modifyBooking(input, config);
    if (modified.validation.decision === "fail" || !modified.latestBooking) {
      return {
        ...modified,
        action: "reschedule_booking" as const,
      };
    }
    const updated: BookingRecord = {
      ...modified.latestBooking,
      bookingStatus: "rescheduled",
      history: [
        ...modified.latestBooking.history,
        {
          timestamp: new Date().toISOString(),
          action: "reschedule_booking",
          details: `scheduled=${input.scheduledDateTime}`,
        },
      ],
    };
    const saved = this.store.saveBooking(updated, "reschedule_booking");
    this.refreshCatalog(config);
    return this.report(
      "reschedule_booking",
      this.getCatalog(),
      [],
      [saved],
      null,
      saved,
      null,
      modified.validation,
      started,
    );
  }

  validateAvailability(input: BookingInput, config: BookingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("validate_availability", input, config, started);
    }
    const duration = input.durationMinutes ?? config.defaultSlotMinutes;
    const availability = this.scheduling.validateAvailability(this.store, input, duration);
    const validation = this.validator.finalize(
      availability.conflictDetected ? "fail" : availability.validated ? "pass" : "partial",
      availability.conflictDetected ? availability.conflictDetails : [],
      availability.notes,
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
    );
    return this.report(
      "validate_availability",
      this.getCatalog(),
      [],
      [],
      null,
      null,
      null,
      validation,
      started,
    );
  }

  preventConflicts(input: BookingInput, config: BookingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("prevent_conflicts", input, config, started);
    }
    const booking = input.bookingId ? this.store.getBooking(input.bookingId) : null;
    const workerId = input.assignedWorker?.trim() || booking?.assignedWorker;
    const start = input.scheduledDateTime?.trim() || booking?.scheduledDateTime;
    const duration = input.durationMinutes ?? booking?.durationMinutes ?? config.defaultSlotMinutes;
    if (!workerId || !start) {
      const validation = this.validator.finalize(
        "fail",
        ["preventConflicts requires assignedWorker and scheduledDateTime"],
        [],
        started,
      );
      return this.report(
        "prevent_conflicts",
        this.getCatalog(),
        [],
        booking ? [booking] : [],
        null,
        booking,
        null,
        validation,
        started,
      );
    }
    const end = this.scheduling.computeEndDateTime(start, duration);
    const conflict = this.scheduling.preventConflicts(
      this.store,
      workerId,
      start,
      end,
      booking?.bookingId,
    );
    const validation = this.validator.validateDoubleBook(
      conflict.overlaps,
      input.customerReference ?? booking?.customerReference,
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      null,
      booking,
    );
    return this.report(
      "prevent_conflicts",
      this.getCatalog(),
      [],
      booking ? [booking] : [],
      null,
      booking,
      null,
      validation,
      started,
    );
  }

  generateConfirmation(input: BookingInput, config: BookingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("generate_confirmation", input, config, started);
    }
    if (input.fabricateBookingConfirmations === true) {
      return this.boundaryFail("generate_confirmation", input, config, started);
    }

    const booking = this.requireBooking(input);
    if (!booking) {
      const validation = this.validator.finalize(
        "fail",
        ["Booking Worker must never fabricate booking confirmations without a valid booking"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(
        "generate_confirmation",
        this.getCatalog(),
        [],
        [],
        null,
        null,
        null,
        validation,
        started,
      );
    }

    if (
      booking.bookingStatus === "cancelled" ||
      booking.bookingStatus === "failed" ||
      booking.bookingStatus === "unknown"
    ) {
      const validation = this.validator.finalize(
        "fail",
        [
          `Booking Worker cannot confirm booking in status=${booking.bookingStatus}; never fabricate confirmations`,
        ],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(
        "generate_confirmation",
        this.getCatalog(),
        [],
        [booking],
        null,
        booking,
        null,
        validation,
        started,
      );
    }

    const confirmation = this.builder.buildConfirmation(booking);
    const savedConfirmation = this.store.saveConfirmation(confirmation);
    const updated: BookingRecord = {
      ...booking,
      bookingStatus: "confirmed",
      confirmationId: confirmation.confirmationId,
      updatedAt: confirmation.confirmedAt,
      history: [
        ...booking.history,
        {
          timestamp: confirmation.confirmedAt,
          action: "generate_confirmation",
          details: `confirmation=${confirmation.confirmationId}`,
        },
      ],
    };
    const saved = this.store.saveBooking(updated, "generate_confirmation");
    this.refreshCatalog(config);
    const validation = this.validator.finalize("pass", [], [], started);
    this.recovery.reset();
    this.ensureRecord("active", config, "passed", null, saved);
    return this.report(
      "generate_confirmation",
      this.getCatalog(),
      [],
      [saved],
      null,
      saved,
      savedConfirmation,
      validation,
      started,
    );
  }

  produceReport(input: BookingInput, config: BookingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.bookingRulesEnabled) {
      return this.disabled(
        "produce_report",
        config,
        !config.enabled ? "Booking Worker is disabled" : "Booking rules are disabled",
      );
    }
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("produce_report", input, config, started);
    }

    let booking = this.requireBooking(input);
    if (!booking) {
      const created = this.createBooking(input, config);
      booking = created.latestBooking;
      if (!booking || created.validation.decision === "fail") {
        return {
          ...created,
          action: "produce_report" as const,
        };
      }
    }

    const report = this.builder.assembleReport(booking, config);
    const savedReport = this.store.saveReport(report, "produce_report");
    this.refreshCatalog(config);
    const validation = this.validator.validateReports(
      [savedReport],
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      savedReport,
      booking,
    );
    appendBkwLog({
      event: "produce_report",
      details: `report=${savedReport.reportId} booking=${booking.bookingId}`,
    });
    return this.report(
      "produce_report",
      this.getCatalog(),
      [savedReport],
      [booking],
      savedReport,
      booking,
      null,
      validation,
      started,
    );
  }

  submitReport(input: BookingInput, config: BookingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled(
        "submit_report",
        config,
        "Executive reporting submission is disabled",
      );
    }

    let report =
      (input.reportId ? this.store.getReport(input.reportId) : null) ??
      this.store.listReports().at(-1) ??
      null;
    if (!report) {
      const generated = this.produceReport(input, config);
      report = generated.latestReport;
      if (!report || generated.validation.decision === "fail") return generated;
    }

    const submission = this.integrations.submitReport(report);
    if (submission.submitted && submission.executiveReportId) {
      report = this.store.markSubmitted(report.reportId, submission.executiveReportId) ?? report;
    }
    const booking = this.store.getBooking(report.bookingId);
    this.refreshCatalog(config);
    const validation = this.validator.validateReports(
      report ? [report] : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (!submission.submitted) {
      validation.warnings.push(submission.details);
    }
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      report,
      booking,
    );
    appendBkwLog({
      event: "submit_report",
      details: `report=${report?.reportId ?? "none"} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_report",
      this.getCatalog(),
      report ? [report] : [],
      booking ? [booking] : [],
      report,
      booking,
      null,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: BookingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.refreshCatalog(config);
    const reports = this.store.listReports();
    const bookings = this.store.listBookings();
    const latest = reports[reports.length - 1] ?? null;
    const latestBooking = bookings[bookings.length - 1] ?? null;
    const validation = this.validator.validateReports(
      reports.length ? reports : null,
      { validated: true },
      started,
      { allowIncompleteReport: !reports.length },
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
      latestBooking,
    );
    return this.report(
      "list",
      this.getCatalog(),
      reports,
      bookings,
      latest,
      latestBooking,
      null,
      validation,
      started,
    );
  }

  validate(input: BookingInput, config: BookingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.refreshCatalog(config);
    const reports = this.store.listReports();
    const bookings = this.store.listBookings();
    const latest = reports[reports.length - 1] ?? null;
    const latestBooking = bookings[bookings.length - 1] ?? null;
    const validation =
      Object.keys(input).length && !reports.length
        ? this.validator.validateInput(input, started)
        : this.validator.validateReports(
            reports.length ? reports : null,
            { ...input, validated: input.validated ?? true },
            started,
            { allowIncompleteReport: !reports.length },
          );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
      latestBooking,
    );
    return this.report(
      "validate",
      this.getCatalog(),
      reports,
      bookings,
      latest,
      latestBooking,
      null,
      validation,
      started,
    );
  }

  diagnostics(config: BookingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.refreshCatalog(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Booking Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendBkwLog({
      event: "diagnostics",
      details: `reports=${this.store.reportCount()} bookings=${this.store.bookingCount()}`,
    });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.listReports(),
      this.store.listBookings(),
      null,
      null,
      null,
      validation,
      started,
    );
  }

  private resolveOffer(input: BookingInput): {
    offer: ServiceOfferReport | ServiceOfferFixture | null;
    source: "serviceOfferReport" | "reportId" | "fixtureServiceOffer" | "none";
    offerId: string;
  } {
    if (input.serviceOfferReport) {
      return {
        offer: input.serviceOfferReport,
        source: "serviceOfferReport",
        offerId: input.serviceOfferReport.reportId,
      };
    }
    if (input.fixtureServiceOffer) {
      return {
        offer: input.fixtureServiceOffer,
        source: "fixtureServiceOffer",
        offerId: input.fixtureServiceOffer.reportId ?? input.reportId?.trim() ?? "fixture-offer",
      };
    }
    if (input.reportId?.trim()) {
      const fromDep = this.integrations.resolveServiceOfferById(input.reportId.trim());
      if (fromDep) {
        return { offer: fromDep, source: "reportId", offerId: fromDep.reportId };
      }
      const consumed = this.store.getConsumedOffer(input.reportId.trim());
      if (consumed) {
        return {
          offer: consumed,
          source: "reportId",
          offerId: input.reportId.trim(),
        };
      }
    }
    if (this.activeOffer && this.activeOfferId) {
      return {
        offer: this.activeOffer,
        source: this.activeOfferSource === "none" ? "fixtureServiceOffer" : this.activeOfferSource,
        offerId: this.activeOfferId,
      };
    }
    return { offer: null, source: "none", offerId: "" };
  }

  private requireOffer(input: BookingInput): {
    offer: ServiceOfferReport | ServiceOfferFixture | null;
    offerId: string;
  } {
    const resolved = this.resolveOffer(input);
    if (resolved.offer) {
      this.activeOffer = resolved.offer;
      this.activeOfferId = resolved.offerId;
      this.activeOfferSource = resolved.source;
      return { offer: resolved.offer, offerId: resolved.offerId };
    }
    return { offer: null, offerId: "" };
  }

  private requireBooking(input: BookingInput): BookingRecord | null {
    if (input.bookingId?.trim()) {
      return this.store.getBooking(input.bookingId.trim());
    }
    return this.store.listBookings().at(-1) ?? null;
  }

  private missingBooking(
    action: BookingWorkerRunReport["action"],
    config: BookingWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.finalize(
      "fail",
      ["Booking Worker requires an existing booking"],
      [],
      started,
    );
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], [], null, null, null, validation, started);
  }

  private refreshCatalog(config: BookingWorkerConfiguration) {
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listReports(),
      this.store.listBookings(),
      this.store.listCalendars(),
      this.store.listConfirmations(),
      this.handshakes,
    );
  }

  private boundaryFail(
    action: BookingWorkerRunReport["action"],
    input: BookingInput,
    config: BookingWorkerConfiguration,
    started: number,
  ) {
    const boundaryOnly = this.validator.finalize(
      "fail",
      this.validator.collectBoundaryErrors(input),
      [],
      started,
    );
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], [], null, null, null, boundaryOnly, started);
  }

  private disabled(
    action: BookingWorkerRunReport["action"],
    config: BookingWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], [], null, null, null, validation, started);
  }

  private ensureRecord(
    state: OperationalState,
    config: BookingWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: BookingReport | null = null,
    latestBooking: BookingRecord | null = null,
  ) {
    const report = latest ?? this.store.listReports().at(-1) ?? null;
    const booking = latestBooking ?? this.store.listBookings().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `bkw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: BOOKING_WORKER_ID,
      engineVersion: "PILLOW-BKW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...BKW_CAPABILITIES],
      totalReports: this.store.reportCount(),
      totalBookings: this.store.bookingCount(),
      lastBookingId: booking?.bookingId ?? this.store.getLatestBookingId(),
      lastReportId: report?.reportId ?? this.store.getLatestReportId(),
      lastConfidenceScore: report?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: BKW_METADATA_VERSION,
    };
  }

  private report(
    action: BookingWorkerRunReport["action"],
    catalog: BookingWorkerCatalog | null,
    reports: BookingReport[],
    bookings: BookingRecord[],
    latestReport: BookingReport | null,
    latestBooking: BookingRecord | null,
    latestConfirmation: BookingConfirmation | null,
    validation: BookingWorkerRunReport["validation"],
    started: number,
  ): BookingWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      bookingRunReportId: `bkw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      reports,
      bookings,
      latestReport,
      latestBooking,
      latestConfirmation,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: BKW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: BookingWorkerCatalog): BookingWorkerCatalog {
  return {
    ...catalog,
    reports: catalog.reports.map((r) => ({ ...r })),
    bookings: catalog.bookings.map((b) => ({ ...b })),
    calendars: catalog.calendars.map((c) => ({
      ...c,
      slots: c.slots.map((s) => ({ ...s })),
    })),
    confirmations: catalog.confirmations.map((c) => ({ ...c, fabricated: false as const })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
