import type { FailureEvidence,RemediationRecommendation } from "./types.js";
export function recommendRemediationForFailures(failures:FailureEvidence[]):RemediationRecommendation[]{return failures.map(x=>({recommendationId:`tsw-plt-${crypto.randomUUID()}`,runId:x.runId,caseId:x.caseId,recommendation:`Investigate and correct failure: ${x.message}`,createdAt:new Date().toISOString()}))}
