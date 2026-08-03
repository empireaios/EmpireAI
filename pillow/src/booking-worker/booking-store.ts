import type {
  AvailabilityWindow,
  BookingConfirmation,
  BookingRecord,
  BookingReport,
  CalendarSlot,
  ServiceOfferFixture,
  ServiceOfferReport,
} from "./types.js";

type CalendarRecord = {
  calendarId: string;
  businessProjectId: string;
  slots: CalendarSlot[];
  windows: AvailabilityWindow[];
};

/** Authoritative in-memory BKW store — bookings, calendars, history, conflict index. */
export class BookingStore {
  private bookings = new Map<string, BookingRecord>();
  private reports = new Map<string, BookingReport>();
  private confirmations = new Map<string, BookingConfirmation>();
  private calendars = new Map<string, CalendarRecord>();
  private consumedOffers = new Map<string, ServiceOfferReport | ServiceOfferFixture>();
  private latestOfferId: string | null = null;
  private latestBookingId: string | null = null;
  private latestReportId: string | null = null;
  /** Conflict index: workerId -> bookingIds occupying intervals */
  private conflictIndex = new Map<string, Set<string>>();
  private auditTrail: Array<{
    timestamp: string;
    bookingId: string;
    action: string;
    details: string;
  }> = [];
  private history: Array<{
    timestamp: string;
    bookingId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: BookingReport[]) {
    this.bookings.clear();
    this.reports.clear();
    this.confirmations.clear();
    this.calendars.clear();
    this.consumedOffers.clear();
    this.conflictIndex.clear();
    this.latestOfferId = null;
    this.latestBookingId = null;
    this.latestReportId = null;
    this.auditTrail = [];
    this.history = [];
    for (const report of reports) {
      this.reports.set(report.reportId, cloneReport(report));
      this.latestReportId = report.reportId;
      this.latestBookingId = report.bookingId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        bookingId: report.bookingId,
        action: "seed",
        details: `seeded report for project=${report.businessProjectId}`,
      });
    }
  }

  bookingCount() {
    return this.bookings.size;
  }

  reportCount() {
    return this.reports.size;
  }

  listBookings() {
    return [...this.bookings.values()]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(cloneBooking);
  }

  listReports() {
    return [...this.reports.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(cloneReport);
  }

  listConfirmations() {
    return [...this.confirmations.values()].map((c) => ({ ...c, fabricated: false as const }));
  }

  listCalendars() {
    return [...this.calendars.values()].map(cloneCalendar);
  }

  getBooking(bookingId: string) {
    const booking = this.bookings.get(bookingId);
    return booking ? cloneBooking(booking) : null;
  }

  getReport(reportId: string) {
    const report = this.reports.get(reportId);
    return report ? cloneReport(report) : null;
  }

  getConfirmation(confirmationId: string) {
    const confirmation = this.confirmations.get(confirmationId);
    return confirmation ? { ...confirmation, fabricated: false as const } : null;
  }

  getCalendar(calendarId: string) {
    const calendar = this.calendars.get(calendarId);
    return calendar ? cloneCalendar(calendar) : null;
  }

  getConsumedOffer(offerId: string) {
    return this.consumedOffers.get(offerId) ?? null;
  }

  getLatestOfferId() {
    return this.latestOfferId;
  }

  getLatestBookingId() {
    return this.latestBookingId;
  }

  getLatestReportId() {
    return this.latestReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  getBookingHistory(limit = 100) {
    return this.history.slice(-limit).map((entry) => ({ ...entry }));
  }

  getConflictIndexEntries(workerId: string) {
    return [...(this.conflictIndex.get(workerId) ?? new Set())];
  }

  saveConsumedOffer(offerId: string, offer: ServiceOfferReport | ServiceOfferFixture) {
    this.consumedOffers.set(offerId, { ...offer });
    this.latestOfferId = offerId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      bookingId: offerId,
      action: "consume_service_offer",
      details: `offer=${offerId}`,
    });
  }

  saveCalendar(calendar: CalendarRecord, action = "manage_calendar") {
    this.calendars.set(calendar.calendarId, cloneCalendar(calendar));
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      bookingId: calendar.calendarId,
      action,
      details: `slots=${calendar.slots.length} windows=${calendar.windows.length}`,
    });
    return cloneCalendar(calendar);
  }

  saveBooking(booking: BookingRecord, action = "save_booking") {
    const previous = this.bookings.get(booking.bookingId);
    if (previous?.assignedWorker) {
      this.removeFromConflictIndex(previous.assignedWorker, previous.bookingId);
    }
    this.bookings.set(booking.bookingId, cloneBooking(booking));
    this.latestBookingId = booking.bookingId;
    if (
      booking.assignedWorker &&
      booking.bookingStatus !== "cancelled" &&
      booking.bookingStatus !== "failed"
    ) {
      this.addToConflictIndex(booking.assignedWorker, booking.bookingId);
    }
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      bookingId: booking.bookingId,
      action,
      details: `status=${booking.bookingStatus} worker=${booking.assignedWorker ?? "none"}`,
    });
    this.history.push({
      timestamp: new Date().toISOString(),
      bookingId: booking.bookingId,
      action,
      details: `status=${booking.bookingStatus}`,
    });
    return cloneBooking(booking);
  }

  saveReport(report: BookingReport, action = "save_report") {
    this.reports.set(report.reportId, cloneReport(report));
    this.latestReportId = report.reportId;
    this.latestBookingId = report.bookingId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      bookingId: report.bookingId,
      action,
      details: `confidence=${report.confidenceScore} offer=${report.sourceOfferReportId}`,
    });
    return cloneReport(report);
  }

  saveConfirmation(confirmation: BookingConfirmation) {
    const locked = { ...confirmation, fabricated: false as const };
    this.confirmations.set(confirmation.confirmationId, locked);
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      bookingId: confirmation.bookingId,
      action: "generate_confirmation",
      details: `confirmation=${confirmation.confirmationId}`,
    });
    return locked;
  }

  markSubmitted(reportId: string, executiveReportId: string) {
    const current = this.reports.get(reportId);
    if (!current) return null;
    const updated: BookingReport = {
      ...cloneReport(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.saveReport(updated, "submit_report");
  }

  findOverlappingBookings(
    workerId: string,
    startIso: string,
    endIso: string,
    excludeBookingId?: string,
  ): BookingRecord[] {
    const start = Date.parse(startIso);
    const end = Date.parse(endIso);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return [];
    return this.listBookings().filter((booking) => {
      if (excludeBookingId && booking.bookingId === excludeBookingId) return false;
      if (booking.assignedWorker !== workerId) return false;
      if (booking.bookingStatus === "cancelled" || booking.bookingStatus === "failed") {
        return false;
      }
      const bStart = Date.parse(booking.scheduledDateTime);
      const bEnd = Date.parse(booking.scheduledEndDateTime);
      if (!Number.isFinite(bStart) || !Number.isFinite(bEnd)) return false;
      return start < bEnd && end > bStart;
    });
  }

  private addToConflictIndex(workerId: string, bookingId: string) {
    const set = this.conflictIndex.get(workerId) ?? new Set<string>();
    set.add(bookingId);
    this.conflictIndex.set(workerId, set);
  }

  private removeFromConflictIndex(workerId: string, bookingId: string) {
    const set = this.conflictIndex.get(workerId);
    if (!set) return;
    set.delete(bookingId);
    if (!set.size) this.conflictIndex.delete(workerId);
  }
}

function cloneBooking(booking: BookingRecord): BookingRecord {
  return {
    ...booking,
    outstandingIssues: [...booking.outstandingIssues],
    history: booking.history.map((h) => ({ ...h })),
    availabilityValidation: {
      ...booking.availabilityValidation,
      conflictDetails: [...booking.availabilityValidation.conflictDetails],
      notes: [...booking.availabilityValidation.notes],
    },
  };
}

function cloneReport(report: BookingReport): BookingReport {
  return {
    ...report,
    outstandingIssues: [...report.outstandingIssues],
    traceabilityRefs: [...report.traceabilityRefs],
    availabilityValidation: {
      ...report.availabilityValidation,
      conflictDetails: [...report.availabilityValidation.conflictDetails],
      notes: [...report.availabilityValidation.notes],
    },
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

function cloneCalendar(calendar: CalendarRecord): CalendarRecord {
  return {
    calendarId: calendar.calendarId,
    businessProjectId: calendar.businessProjectId,
    slots: calendar.slots.map((s) => ({ ...s })),
    windows: calendar.windows.map((w) => ({
      ...w,
      notes: [...w.notes],
    })),
  };
}
