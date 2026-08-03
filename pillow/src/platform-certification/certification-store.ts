import type { PlatformCertificationReport } from "./types.js";
/** Append-only in-memory report history; callers receive defensive copies. */
export class CertificationStore {
  private readonly reports: PlatformCertificationReport[] = [];
  append(report: PlatformCertificationReport) { this.reports.push(structuredClone(report)); }
  list() { return this.reports.map((report) => structuredClone(report)); }
}
