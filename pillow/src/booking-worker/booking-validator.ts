import { BKW_METADATA_VERSION } from "./paths.js";
import type {
  BookingInput,
  BookingRecord,
  BookingReport,
  BookingWorkerValidationReport,
  ServiceOfferFixture,
  ServiceOfferReport,
} from "./types.js";

/** Reject Q7-05 and later mission IDs. Q7-04 itself is allowed. */
const FORBIDDEN_MISSION_ID = /^(Q7-0[5-9]|Q7-\d{2,}|Q[8-9]-\d+)/i;

type BoundaryInput = {
  performTheService?: boolean;
  processPayments?: boolean;
  replaceCrm?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  fabricateBookingConfirmations?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ705OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class BookingValidator {
  decide(input: BookingInput): BookingWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateInput(input: BookingInput, started: number) {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Booking Worker requires validated=true when explicitly set");
    }
    return this.finalize(
      errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      started,
    );
  }

  validateOfferPresence(
    offer: ServiceOfferReport | ServiceOfferFixture | null,
    started: number,
  ) {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!offer) {
      errors.push(
        "Booking Worker requires consumed approved service offer before booking",
      );
    }
    return this.finalize(
      errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      started,
    );
  }

  validateServiceAgainstOffer(
    input: BookingInput,
    offer: ServiceOfferReport | ServiceOfferFixture,
    started: number,
  ) {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);

    const packageId = input.packageId?.trim() ?? "";
    const serviceSelected = input.serviceSelected?.trim() ?? "";
    const packages = offer.servicePackages ?? [];
    const catalogue = offer.serviceCatalogue ?? [];

    if (!packageId && !serviceSelected) {
      errors.push("Booking Worker requires packageId or serviceSelected from approved offer");
    } else {
      const packageMatch = packages.find(
        (p) =>
          p.packageId === packageId ||
          (!!serviceSelected && p.name.toLowerCase() === serviceSelected.toLowerCase()),
      );
      const catalogueMatch = catalogue.find(
        (s) =>
          s.serviceId === serviceSelected ||
          s.name.toLowerCase() === serviceSelected.toLowerCase(),
      );
      if (!packageMatch && !catalogueMatch) {
        errors.push(
          "Booking Worker rejects bookings for unknown services/packages not in consumed offer",
        );
      }
    }

    return this.finalize(
      errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      started,
    );
  }

  validateDoubleBook(
    overlaps: BookingRecord[],
    customerReference: string | null | undefined,
    started: number,
  ) {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (overlaps.length > 0) {
      errors.push(
        `Booking Worker hard-fails worker double-book: overlapping bookings ${overlaps
          .map((b) => b.bookingId)
          .join(", ")}`,
      );
    }
    // Same customer+slot soft warning is handled by caller when applicable
    if (customerReference && overlaps.some((b) => b.customerReference === customerReference)) {
      warnings.push("Same customer already has a booking in overlapping slot (soft warning)");
    }
    return this.finalize(
      errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      started,
    );
  }

  validateReports(
    reports: BookingReport[] | null,
    input: BookingInput,
    started: number,
    options: { allowIncompleteReport?: boolean } = {},
  ): BookingWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Booking Worker requires validated=true when explicitly set");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail" && !options.allowIncompleteReport) {
        warnings.push("No booking reports were produced yet");
      }
    } else if (!options.allowIncompleteReport) {
      for (const report of reports) {
        this.validateReportShape(report, errors);
      }
    }

    return this.finalize(
      errors.length || decision === "fail"
        ? "fail"
        : decision === "pass" && warnings.length
          ? "partial"
          : decision,
      errors,
      warnings,
      started,
    );
  }

  finalize(
    decision: BookingWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): BookingWorkerValidationReport {
    return {
      validationReportId: `bkw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: BKW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.performTheService === true ||
      input.processPayments === true ||
      input.replaceCrm === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.fabricateBookingConfirmations === true ||
      input.bypassGrandKingApproval === true ||
      input.implementQ705OrLater === true ||
      (typeof input.missionId === "string" && FORBIDDEN_MISSION_ID.test(input.missionId.trim()))
    );
  }

  collectBoundaryErrors(input: BoundaryInput): string[] {
    const errors: string[] = [];
    this.pushBoundaryErrors(input, errors);
    return errors;
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.performTheService === true) {
      errors.push("Booking Worker must never perform the service");
    }
    if (input.processPayments === true) {
      errors.push("Booking Worker must never process payments");
    }
    if (input.replaceCrm === true) {
      errors.push("Booking Worker must never replace CRM");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Booking Worker must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Booking Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Booking Worker must never override Grand King");
    }
    if (input.fabricateBookingConfirmations === true) {
      errors.push("Booking Worker must never fabricate booking confirmations");
    }
    if (input.bypassGrandKingApproval === true) {
      errors.push("Booking Worker must never bypass Grand King approval");
    }
    if (input.implementQ705OrLater === true) {
      errors.push("Booking Worker must never implement Q7-05 or later");
    }
    if (typeof input.missionId === "string" && FORBIDDEN_MISSION_ID.test(input.missionId.trim())) {
      errors.push(`Booking Worker rejects forbidden missionId ${input.missionId}`);
    }
  }

  private validateReportShape(report: BookingReport, errors: string[]) {
    if (!report.reportId) errors.push("Missing report ID");
    if (!report.timestamp) errors.push("Missing timestamp");
    if (!report.businessProjectId) errors.push("Missing business project ID");
    if (!report.bookingId) errors.push("Missing booking ID");
    if (!report.customerReference) errors.push("Missing customer reference");
    if (!report.serviceSelected) errors.push("Missing service selected");
    if (!report.scheduledDateTime) errors.push("Missing scheduled date time");
    if (report.assignedWorker === undefined) errors.push("Missing assigned worker field");
    if (!report.bookingStatus) errors.push("Missing booking status");
    if (!report.availabilityValidation) errors.push("Missing availability validation");
    if (!report.auditStatus) errors.push("Missing audit status");
    if (!report.outstandingIssues) errors.push("Missing outstanding issues");
    if (report.confidenceScore == null) errors.push("Missing confidence score");
    if (!report.metadataVersion) errors.push("Missing metadata version");
    if (!report.reportVersion) errors.push("Missing report version");
    if (!report.workerId) errors.push("Missing worker ID");
    if (!report.sourceOfferReportId) errors.push("Missing source offer report ID");
    if (!report.packageId) errors.push("Missing package ID");
    if (!report.serviceArea) errors.push("Missing service area");
    if (report.durationMinutes == null) errors.push("Missing duration minutes");
    if (report.reminderScheduled == null) errors.push("Missing reminder scheduled");
    if (report.recurringSeriesId === undefined) errors.push("Missing recurring series id field");
    if (report.conflictCheckPassed == null) errors.push("Missing conflict check passed");
    if (report.confirmationId === undefined) errors.push("Missing confirmation id field");
    if (report.consumableByQ705 !== true) errors.push("Report must be consumableByQ705");
    if (!report.neverPerformTheService) errors.push("Report must lock neverPerformTheService");
    if (!report.neverProcessPayments) errors.push("Report must lock neverProcessPayments");
    if (!report.neverReplaceCrm) errors.push("Report must lock neverReplaceCrm");
    if (!report.neverFabricateBookingConfirmations) {
      errors.push("Report must lock neverFabricateBookingConfirmations");
    }
    if (!report.neverImplementQ705OrLater) {
      errors.push("Report must lock neverImplementQ705OrLater");
    }
  }
}

export class HealthMonitor {
  status(
    decision: "pass" | "partial" | "fail",
    enabled: boolean,
  ): "healthy" | "degraded" | "failed" | "standby" {
    if (!enabled) return "standby";
    if (decision === "fail") return "failed";
    if (decision === "partial") return "degraded";
    return "healthy";
  }
}

export class RecoveryManager {
  private failures = 0;

  recordFailure() {
    this.failures += 1;
  }

  reset() {
    this.failures = 0;
  }

  failureCount() {
    return this.failures;
  }
}
