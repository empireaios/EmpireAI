import type { InnovationRecord } from "./types.js";
export class InnovationRankingEngine { rank(records: InnovationRecord[]) { return [...records].sort((left, right) => right.innovationScore - left.innovationScore); } }
