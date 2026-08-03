import type { EmpireOpportunityInput } from "./types.js";
/** Produces structural opportunity descriptors; it does not fetch external intelligence. */
export class OpportunityDiscoveryEngine { discover(input: EmpireOpportunityInput) { return input.opportunityCategory?.trim() || "business opportunity"; } }
