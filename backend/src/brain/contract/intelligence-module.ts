import type { IntelligenceCapability } from "./capabilities.js";
import type { IntelligenceModuleId } from "./module-ids.js";
import type {
  BrainExecutionResult,
  IntelligenceBrainTask,
  ModuleHealthReport,
  ModuleInputSpec,
  ModuleOutputSpec,
  ModuleValidationResult,
} from "./types.js";

/**
 * Standard interface every AI employee intelligence module must implement
 * to integrate with the EmpireAI Brain orchestration layer.
 */
export interface IntelligenceModuleContract {
  readonly moduleId: IntelligenceModuleId;
  readonly moduleName: string;
  readonly moduleVersion: string;
  readonly capabilities: readonly IntelligenceCapability[];
  readonly requiredInputs: readonly ModuleInputSpec[];
  readonly producedOutputs: readonly ModuleOutputSpec[];

  execute(task: IntelligenceBrainTask): Promise<BrainExecutionResult>;
  validate(task: IntelligenceBrainTask): ModuleValidationResult;
  health(): Promise<ModuleHealthReport> | ModuleHealthReport;
  confidenceScore(task: IntelligenceBrainTask, result?: BrainExecutionResult): number;
}

/** Alias emphasizing the AI-employee contract role. */
export type AIEmployeeModule = IntelligenceModuleContract;
