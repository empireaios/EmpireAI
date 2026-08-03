import type { BookingWorkerConfiguration } from "./configuration.js";
import type { BookingWorkerDependencies } from "./integrations.js";
import { BookingManager } from "./booking-manager.js";
import type {
  EngineStatus,
  BookingInput,
  BookingWorkerRunReport,
} from "./types.js";

export class BookingWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: BookingWorkerRunReport | null = null;

  constructor(
    private readonly manager: BookingManager,
    private readonly config: BookingWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: BookingWorkerDependencies = {}) {
    this.manager.bindIntegrations(deps);
  }

  getStatus() {
    return this.status;
  }

  getManager() {
    return this.manager;
  }

  getConfiguration() {
    return {
      ...this.config,
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      bookingStatuses: [...this.config.bookingStatuses],
      seedReports: this.config.seedReports.map((report) => ({ ...report })),
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  consumeServiceOffer(input: BookingInput = {}) {
    this.status = "consuming_offer";
    return this.finish(this.manager.consumeServiceOffer(input, this.config));
  }

  createBooking(input: BookingInput = {}) {
    this.status = "creating_booking";
    return this.finish(this.manager.createBooking(input, this.config));
  }

  manageCalendar(input: BookingInput = {}) {
    this.status = "managing_calendar";
    return this.finish(this.manager.manageCalendar(input, this.config));
  }

  setAvailability(input: BookingInput = {}) {
    this.status = "managing_calendar";
    return this.finish(this.manager.setAvailability(input, this.config));
  }

  allocateTimeSlots(input: BookingInput = {}) {
    this.status = "allocating_slots";
    return this.finish(this.manager.allocateTimeSlots(input, this.config));
  }

  assignWorker(input: BookingInput = {}) {
    this.status = "assigning_worker";
    return this.finish(this.manager.assignWorker(input, this.config));
  }

  modifyBooking(input: BookingInput = {}) {
    this.status = "modifying_booking";
    return this.finish(this.manager.modifyBooking(input, this.config));
  }

  cancelBooking(input: BookingInput = {}) {
    this.status = "modifying_booking";
    return this.finish(this.manager.cancelBooking(input, this.config));
  }

  rescheduleBooking(input: BookingInput = {}) {
    this.status = "modifying_booking";
    return this.finish(this.manager.rescheduleBooking(input, this.config));
  }

  validateAvailability(input: BookingInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateAvailability(input, this.config));
  }

  preventConflicts(input: BookingInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.preventConflicts(input, this.config));
  }

  generateConfirmation(input: BookingInput = {}) {
    this.status = "confirming";
    return this.finish(this.manager.generateConfirmation(input, this.config));
  }

  produceReport(input: BookingInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  produceBookingReport(input: BookingInput = {}) {
    return this.produceReport(input);
  }

  submitReport(input: BookingInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: BookingInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  private finish(report: BookingWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
