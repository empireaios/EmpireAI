import type { GlobalOperationsCertificationReport } from "./types.js";
export class CertificationRecordStore {
  private records: GlobalOperationsCertificationReport[] = [];
  append(record: GlobalOperationsCertificationReport) { this.records.push(record); }
  list() { return [...this.records]; }
  latest() { return this.records.at(-1) ?? null; }
  resetForTesting() { this.records = []; }
}
