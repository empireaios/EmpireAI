import type { TestingBuildReport } from "./types.js";
export class ReportStore { private reports:TestingBuildReport[]=[];save(report:TestingBuildReport){this.reports.push(report);return report}latest(){return this.reports.at(-1)??null}list(){return [...this.reports]} }
