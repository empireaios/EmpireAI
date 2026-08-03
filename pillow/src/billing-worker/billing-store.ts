import type { BillingBuildReport } from "./types.js";
export class BillingStore { private readonly reports:BillingBuildReport[]=[]; add(report:BillingBuildReport){this.reports.push(report);return report;} list(){return [...this.reports];} latest(){return this.reports.at(-1)??null;} }
