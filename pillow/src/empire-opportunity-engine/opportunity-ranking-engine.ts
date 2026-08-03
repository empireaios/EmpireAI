import type { OpportunityRecord } from "./types.js";
export class OpportunityRankingEngine { rank(records: OpportunityRecord[]) { return [...records].sort((left, right) => right.opportunityScore - left.opportunityScore); } }
