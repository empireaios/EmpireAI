export {
  ALLOCATION_SIGNAL_TYPES,
  allocationSignalSchema,
  validateAllocationSignal,
} from "./models/allocation-signal.js";
export type { AllocationSignalType, AllocationSignal } from "./models/allocation-signal.js";

export {
  capitalAllocationSchema,
  validateCapitalAllocation,
} from "./models/capital-allocation.js";
export type {
  CapitalAllocationId,
  CapitalAllocation,
  CapitalAllocationCreateInput,
} from "./models/capital-allocation.js";

export type {
  AllocationRepositoryQuery,
  AllocationRepository,
} from "./repositories/allocation-repository.js";

export {
  InMemoryAllocationRepository,
  createInMemoryAllocationRepository,
} from "./repositories/in-memory-allocation-repository.js";

export {
  ALLOCATION_SIGNAL_WEIGHTS,
  scoreCapitalAllocation,
  rankCapitalAllocations,
  capitalAllocationScoring,
} from "./scoring/capital-allocation-scoring.js";
export type {
  AllocationPortfolioEntryInput,
  AllocationRevenueOpportunityInput,
  CapitalAllocationEntryInput,
  CapitalAllocationPlanInput,
  CapitalAllocationBreakdown,
  PortfolioState,
} from "./scoring/capital-allocation-scoring.js";

export {
  CapitalAllocationEngine,
  defaultCapitalAllocationEngine,
} from "./engines/capital-allocation-engine.js";

export {
  CAPITAL_ALLOCATION_INTELLIGENCE_MODULE_ID,
  CAPITAL_ALLOCATION_INTELLIGENCE_MODULE_VERSION,
  CAPITAL_ALLOCATION_INTELLIGENCE_CAPABILITIES,
  CAPITAL_ALLOCATION_INTELLIGENCE_MODULE_CONTRACT,
  CapitalAllocationModule,
  createCapitalAllocationModule,
  capitalAllocationModule,
} from "./contract/capital-allocation-module.js";
export type {
  CapitalAllocationIntelligenceModuleId,
  CapitalAllocationIntelligenceCapability,
  CapitalAllocationIntelligenceModuleContract,
} from "./contract/capital-allocation-module.js";
