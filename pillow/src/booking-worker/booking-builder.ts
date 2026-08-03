import type { BookingWorkerConfiguration } from "./configuration.js";
import {
  BOOKING_REPORT_VERSION,
  BOOKING_WORKER_IDENTITY,
  BKW_METADATA_VERSION,
} from "./paths.js";
import type {
  AvailabilityValidation,
  BookingConfirmation,
  BookingInput,
  BookingRecord,
  BookingReport,
  BookingWorkerCatalog,
  IntegrationHandshake,
  ServiceOfferFixture,
  ServiceOfferReport,
} from "./types.js";

let bookingSeq = 0;
let reportSeq = 0;
let confirmationSeq = 0;

export function resetBookingSequenceForTesting() {
  bookingSeq = 0;
  reportSeq = 0;
  confirmationSeq = 0;
}

export function nextBookingId() {
  bookingSeq += 1;
  return `bkw-bk-${String(bookingSeq).padStart(4, "0")}`;
}

export function nextReportId() {
  reportSeq += 1;
  return `bkw-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextConfirmationId() {
  confirmationSeq += 1;
  return `bkw-cfm-${String(confirmationSeq).padStart(4, "0")}`;
}

export function parseDurationMinutes(
  estimatedDuration: string | undefined,
  fallback: number,
): number {
  if (!estimatedDuration) return fallback;
  const range = estimatedDuration.match(/(\d+)\s*-\s*(\d+)/);
  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      const unit = /hour/i.test(estimatedDuration) ? 60 : 1;
      return Math.round(((a + b) / 2) * unit);
    }
  }
  const single = estimatedDuration.match(/(\d+)/);
  if (single) {
    const n = Number(single[1]);
    if (Number.isFinite(n)) {
      return /hour/i.test(estimatedDuration) ? n * 60 : n;
    }
  }
  return fallback;
}

export function resolvePackageFromOffer(
  offer: ServiceOfferReport | ServiceOfferFixture,
  input: BookingInput,
): {
  packageId: string;
  serviceSelected: string;
  serviceArea: string;
  durationMinutes: number;
} | null {
  const packages = offer.servicePackages ?? [];
  const catalogue = offer.serviceCatalogue ?? [];
  const packageId = input.packageId?.trim() ?? "";
  const serviceSelected = input.serviceSelected?.trim() ?? "";

  let pkg =
    packages.find((p) => p.packageId === packageId) ??
    packages.find(
      (p) => serviceSelected && p.name.toLowerCase() === serviceSelected.toLowerCase(),
    ) ??
    null;

  if (!pkg && serviceSelected) {
    const cat = catalogue.find(
      (s) =>
        s.serviceId === serviceSelected ||
        s.name.toLowerCase() === serviceSelected.toLowerCase(),
    );
    if (cat) {
      pkg =
        packages.find((p) =>
          p.name.toLowerCase().includes(cat.name.toLowerCase().split(" ")[0] ?? ""),
        ) ?? packages[0] ?? null;
      if (!pkg) {
        return {
          packageId: cat.serviceId,
          serviceSelected: cat.name,
          serviceArea:
            input.serviceArea?.trim() ||
            cat.geographicCoverage ||
            "unspecified",
          durationMinutes: input.durationMinutes ?? 60,
        };
      }
    }
  }

  if (!pkg && packages.length === 1 && !packageId && !serviceSelected) {
    pkg = packages[0]!;
  }

  if (!pkg) return null;

  const duration =
    input.durationMinutes ??
    ("durationMinutes" in pkg && typeof pkg.durationMinutes === "number"
      ? pkg.durationMinutes
      : parseDurationMinutes(pkg.estimatedDuration, 60));

  return {
    packageId: pkg.packageId,
    serviceSelected: serviceSelected || pkg.name,
    serviceArea:
      input.serviceArea?.trim() || pkg.geographicCoverage || "unspecified",
    durationMinutes: duration,
  };
}

export class BookingBuilder {
  buildCatalog(
    config: BookingWorkerConfiguration,
    reports: BookingReport[],
    bookings: BookingRecord[],
    calendars: Array<{
      calendarId: string;
      businessProjectId: string;
      slots: BookingWorkerCatalog["calendars"][number]["slots"];
    }>,
    confirmations: BookingConfirmation[],
    integrations: IntegrationHandshake[],
  ): BookingWorkerCatalog {
    return {
      reportVersion: BOOKING_REPORT_VERSION,
      workerId: config.workerId,
      reports: reports.map((r) => ({ ...r })),
      bookings: bookings.map((b) => ({ ...b })),
      calendars: calendars.map((c) => ({
        calendarId: c.calendarId,
        businessProjectId: c.businessProjectId,
        slots: c.slots.map((s) => ({ ...s })),
      })),
      confirmations: confirmations.map((c) => ({ ...c, fabricated: false as const })),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: BKW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverPerformTheService: true,
      neverProcessPayments: true,
      neverReplaceCrm: true,
      neverFabricateBookingConfirmations: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ705OrLater: true,
      consumableByQ705: true,
    };
  }

  createBookingRecord(params: {
    input: BookingInput;
    offer: ServiceOfferReport | ServiceOfferFixture;
    sourceOfferReportId: string;
    resolved: {
      packageId: string;
      serviceSelected: string;
      serviceArea: string;
      durationMinutes: number;
    };
    scheduledDateTime: string;
    scheduledEndDateTime: string;
    availabilityValidation: AvailabilityValidation;
    conflictCheckPassed: boolean;
    calendarId: string | null;
    slotId: string | null;
  }): BookingRecord {
    const now = new Date().toISOString();
    const bookingId = params.input.bookingId?.trim() || nextBookingId();
    const businessProjectId = String(
      params.input.businessProjectId ??
        params.offer.businessProjectId ??
        "unspecified",
    );
    return {
      bookingId,
      createdAt: now,
      updatedAt: now,
      businessProjectId,
      customerReference: params.input.customerReference?.trim() || `cust-${bookingId}`,
      serviceSelected: params.resolved.serviceSelected,
      packageId: params.resolved.packageId,
      serviceArea: params.resolved.serviceArea,
      scheduledDateTime: params.scheduledDateTime,
      scheduledEndDateTime: params.scheduledEndDateTime,
      durationMinutes: params.resolved.durationMinutes,
      assignedWorker: params.input.assignedWorker?.trim() || null,
      bookingStatus: "pending_confirmation",
      sourceOfferReportId: params.sourceOfferReportId,
      slotId: params.slotId,
      calendarId: params.calendarId,
      confirmationId: null,
      reminderScheduled: params.input.reminderScheduled ?? false,
      recurringSeriesId: params.input.recurringSeriesId ?? null,
      conflictCheckPassed: params.conflictCheckPassed,
      availabilityValidation: params.availabilityValidation,
      outstandingIssues: params.conflictCheckPassed
        ? []
        : [...params.availabilityValidation.conflictDetails],
      auditStatus: "open",
      history: [
        {
          timestamp: now,
          action: "create_booking",
          details: `status=pending_confirmation package=${params.resolved.packageId}`,
        },
      ],
    };
  }

  assembleReport(booking: BookingRecord, config: BookingWorkerConfiguration): BookingReport {
    const confidence = Math.max(
      0.4,
      Math.min(
        0.95,
        (booking.conflictCheckPassed ? 0.75 : 0.45) +
          (booking.assignedWorker ? 0.1 : 0) +
          (booking.availabilityValidation.available ? 0.1 : 0),
      ),
    );
    return {
      reportId: nextReportId(),
      timestamp: new Date().toISOString(),
      businessProjectId: booking.businessProjectId,
      bookingId: booking.bookingId,
      customerReference: booking.customerReference,
      serviceSelected: booking.serviceSelected,
      scheduledDateTime: booking.scheduledDateTime,
      assignedWorker: booking.assignedWorker,
      bookingStatus: booking.bookingStatus,
      availabilityValidation: {
        ...booking.availabilityValidation,
        conflictDetails: [...booking.availabilityValidation.conflictDetails],
        notes: [...booking.availabilityValidation.notes],
      },
      auditStatus: booking.auditStatus,
      outstandingIssues: [...booking.outstandingIssues],
      confidenceScore: Number(confidence.toFixed(2)),
      metadataVersion: BKW_METADATA_VERSION,
      reportVersion: BOOKING_REPORT_VERSION,
      workerId: config.workerId || BOOKING_WORKER_IDENTITY.workerId,
      sourceOfferReportId: booking.sourceOfferReportId,
      packageId: booking.packageId,
      serviceArea: booking.serviceArea,
      durationMinutes: booking.durationMinutes,
      reminderScheduled: booking.reminderScheduled,
      recurringSeriesId: booking.recurringSeriesId,
      conflictCheckPassed: booking.conflictCheckPassed,
      confirmationId: booking.confirmationId,
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
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      traceabilityRefs: [
        `q7-04:booking:${booking.bookingId}`,
        `q7-03:service_offer:${booking.sourceOfferReportId}`,
      ],
    };
  }

  buildConfirmation(booking: BookingRecord): BookingConfirmation {
    return {
      confirmationId: nextConfirmationId(),
      bookingId: booking.bookingId,
      confirmedAt: new Date().toISOString(),
      customerReference: booking.customerReference,
      serviceSelected: booking.serviceSelected,
      scheduledDateTime: booking.scheduledDateTime,
      assignedWorker: booking.assignedWorker,
      bookingStatus: "confirmed",
      fabricated: false,
      traceabilityRefs: [
        `q7-04:confirmation:${booking.bookingId}`,
        `q7-03:service_offer:${booking.sourceOfferReportId}`,
      ],
    };
  }
}
