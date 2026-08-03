import type { TestingBuildReport } from "./types.js";
export function isCompleteTestingBuildReport(report:TestingBuildReport){return report.buildStatus==="complete"&&report.metadataVersion==="TSW-001-v1"&&report.neverFabricateSuccessfulTests===true}
