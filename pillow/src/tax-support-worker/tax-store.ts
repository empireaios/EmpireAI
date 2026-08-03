import type {
  FilingReminder,
  MissingDocumentationItem,
  ProfessionalReviewFlag,
  TaxSupportDocument,
  TaxSupportRecord,
  TaxSupportReport,
  TaxSupportWorkerCatalog,
  TaxSupportWorkerEngineRecord,
} from "./types.js";

let seq = 0;

function next(prefix: string): string {
  seq += 1;
  return `${prefix}-${String(seq).padStart(6, "0")}`;
}

export function resetTswSequenceForTesting() {
  seq = 0;
}

export function nextRecordId() {
  return next("tsw-rec");
}
export function nextDocumentId() {
  return next("tsw-doc");
}
export function nextReminderId() {
  return next("tsw-rem");
}
export function nextMissingId() {
  return next("tsw-miss");
}
export function nextFlagId() {
  return next("tsw-flag");
}
export function nextReportId() {
  return next("tsw-rpt");
}
export function nextEngineRecordId() {
  return next("tsw-eng");
}

export class TaxSupportStore {
  private records: TaxSupportRecord[] = [];
  private documents: TaxSupportDocument[] = [];
  private reminders: FilingReminder[] = [];
  private missing: MissingDocumentationItem[] = [];
  private flags: ProfessionalReviewFlag[] = [];
  private reports: TaxSupportReport[] = [];
  private engineRecord: TaxSupportWorkerEngineRecord | null = null;
  private catalog: TaxSupportWorkerCatalog | null = null;
  private latestBusinessId: string | null = null;
  private auditTrail: Array<{ at: string; action: string; details: string }> = [];

  reset() {
    this.records = [];
    this.documents = [];
    this.reminders = [];
    this.missing = [];
    this.flags = [];
    this.reports = [];
    this.engineRecord = null;
    this.catalog = null;
    this.latestBusinessId = null;
    this.auditTrail = [];
  }

  addRecord(record: TaxSupportRecord) {
    this.records.push(record);
    this.latestBusinessId = record.businessId;
  }

  addDocument(doc: TaxSupportDocument) {
    this.documents.push(doc);
  }

  addReminder(reminder: FilingReminder) {
    this.reminders.push(reminder);
  }

  addMissing(item: MissingDocumentationItem) {
    this.missing.push(item);
  }

  addFlag(flag: ProfessionalReviewFlag) {
    this.flags.push(flag);
  }

  addReport(report: TaxSupportReport) {
    this.reports.push(report);
    this.latestBusinessId = report.capitalBusinessId;
  }

  setEngineRecord(record: TaxSupportWorkerEngineRecord) {
    this.engineRecord = record;
  }

  setCatalog(catalog: TaxSupportWorkerCatalog) {
    this.catalog = catalog;
  }

  appendAudit(action: string, details: string) {
    this.auditTrail.push({ at: new Date().toISOString(), action, details });
  }

  getRecords() {
    return this.records.map((r) => ({ ...r }));
  }
  getDocuments() {
    return this.documents.map((d) => ({ ...d }));
  }
  getReminders() {
    return this.reminders.map((r) => ({ ...r }));
  }
  getMissing() {
    return this.missing.map((m) => ({ ...m }));
  }
  getFlags() {
    return this.flags.map((f) => ({ ...f }));
  }
  getReports() {
    return this.reports.map((r) => ({ ...r }));
  }
  getLatestReport() {
    return this.reports.length ? { ...this.reports[this.reports.length - 1]! } : null;
  }
  getEngineRecord() {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }
  getCatalog() {
    return this.catalog ? { ...this.catalog } : null;
  }
  getLatestBusinessId() {
    return this.latestBusinessId;
  }
  getAuditTrail() {
    return this.auditTrail.map((a) => ({ ...a }));
  }
}
