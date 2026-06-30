export {
  MANUFACTURING_RUN_STATUSES,
  manufacturingRunStatusSchema,
  validateManufacturingRunStatus,
  manufacturingRunStatusLabel,
} from "./models/manufacturing-run-status.js";
export type { ManufacturingRunStatus } from "./models/manufacturing-run-status.js";

export {
  MANUFACTURING_LOOP_STAGES,
  manufacturingStageRecordSchema,
  validateManufacturingStageRecord,
  manufacturingLoopStageLabel,
} from "./models/manufacturing-stage.js";
export type {
  ManufacturingLoopStage,
  ManufacturingStageRecord,
} from "./models/manufacturing-stage.js";

export {
  NEXT_ACTION_PRIORITIES,
  nextActionSchema,
  validateNextAction,
} from "./models/next-action.js";
export type { NextActionPriority, NextAction } from "./models/next-action.js";

export {
  MANUFACTURING_SIGNAL_TYPES,
  manufacturingSignalSchema,
  validateManufacturingSignal,
} from "./models/manufacturing-signal.js";
export type {
  ManufacturingSignalType,
  ManufacturingSignal,
} from "./models/manufacturing-signal.js";

export {
  companyManufacturingRunSchema,
  validateCompanyManufacturingRun,
} from "./models/company-manufacturing-run.js";
export type {
  CompanyManufacturingRunId,
  CompanyManufacturingRun,
  CompanyManufacturingRunCreateInput,
} from "./models/company-manufacturing-run.js";

export {
  companyManufacturingRecordSchema,
  validateCompanyManufacturingRecord,
} from "./models/company-manufacturing-record.js";
export type {
  CompanyManufacturingRecordId,
  CompanyManufacturingRecord,
  CompanyManufacturingRecordCreateInput,
} from "./models/company-manufacturing-record.js";

export type {
  CompanyManufacturingRepositoryQuery,
  CompanyManufacturingRepository,
} from "./repositories/company-manufacturing-repository.js";

export {
  InMemoryCompanyManufacturingRepository,
  createInMemoryCompanyManufacturingRepository,
} from "./repositories/in-memory-company-manufacturing-repository.js";

export {
  DEFAULT_M072_IDS,
  buildEyeSynthesisInput,
  buildBrandGenesisInput,
  resolveManufacturingIds,
} from "./scoring/manufacturing-mock-inputs.js";
export type {
  ManufacturingPipelineIds,
  DeterministicManufacturingIdSet,
} from "./scoring/manufacturing-mock-inputs.js";

export { runStoreManufacturingPipeline } from "./scoring/store-manufacturing-pipeline.js";
export type { StoreManufacturingPipelineResult } from "./scoring/store-manufacturing-pipeline.js";

export {
  MANUFACTURING_SIGNAL_WEIGHTS,
  runAutonomousCompanyManufacturingLoop,
  autonomousCompanyManufacturingLoopScoring,
} from "./scoring/autonomous-company-manufacturing-loop-scoring.js";
export type {
  CompanyManufacturingLoopInput,
  CompanyManufacturingLoopBreakdown,
} from "./scoring/autonomous-company-manufacturing-loop-scoring.js";

export {
  AutonomousCompanyManufacturingLoopEngine,
  defaultAutonomousCompanyManufacturingLoopEngine,
} from "./engines/autonomous-company-manufacturing-loop-engine.js";

export {
  AUTONOMOUS_COMPANY_MANUFACTURING_LOOP_MODULE_ID,
  AUTONOMOUS_COMPANY_MANUFACTURING_LOOP_MODULE_VERSION,
  AUTONOMOUS_COMPANY_MANUFACTURING_LOOP_CAPABILITIES,
  AUTONOMOUS_COMPANY_MANUFACTURING_LOOP_MODULE_CONTRACT,
  AutonomousCompanyManufacturingLoopModule,
  createAutonomousCompanyManufacturingLoopModule,
  autonomousCompanyManufacturingLoopModule,
} from "./contract/autonomous-company-manufacturing-loop-module.js";
export type {
  AutonomousCompanyManufacturingLoopModuleId,
  AutonomousCompanyManufacturingLoopCapability,
  AutonomousCompanyManufacturingLoopModuleContract,
} from "./contract/autonomous-company-manufacturing-loop-module.js";
