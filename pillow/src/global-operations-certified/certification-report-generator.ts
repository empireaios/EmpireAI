import type { GlobalOperationsCertificationReport } from "./types.js";
export class CertificationReportGenerator {
  serialize(report: GlobalOperationsCertificationReport): string { return JSON.stringify(report); }
}
