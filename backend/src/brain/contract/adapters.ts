import type { ProductIntelligenceInput } from "../../intelligence/product-intelligence-engine/types.js";
import type { ProductScoutScoreInput } from "../../intelligence/product-scout/types.js";
import type {
  ProductIntelligenceCapability,
  ProductScoutCapability,
  SupplierIntelligenceCapability,
} from "./capabilities.js";
import type { IntelligenceModuleContract } from "./intelligence-module.js";
import type {
  BrainExecutionResult,
  IntelligenceBrainTask,
  ModuleHealthReport,
  ModuleInputSpec,
  ModuleOutputSpec,
  ModuleValidationResult,
} from "./types.js";

export type { ProductIntelligenceCapability };

/**
 * Type-only adapter sketch showing how ProductScoutEngine COULD implement
 * IntelligenceModuleContract in a future refactor — not wired at runtime.
 *
 * Mapping:
 * - execute("product-scout.evaluate") → ProductScoutEngine.evaluate()
 * - execute("product-scout.scan_portfolio") → ProductScoutEngine.scanPortfolio()
 * - execute("product-scout.recommend") → ProductScoutEngine.recommend()
 * - execute("product-scout.persist") → ProductScoutEngine.persist()
 * - confidenceScore() → ProductScoutEvaluation.confidenceScore
 * - health() → evaluateMock probe + guardian verdict sanity check
 */
export interface ProductScoutModuleContractAdapter extends IntelligenceModuleContract {
  readonly moduleId: "product-scout";
  readonly moduleName: "AI Product Scout";
  readonly moduleVersion: "1.0.0";
  readonly capabilities: readonly ProductScoutCapability[];
  readonly requiredInputs: readonly ModuleInputSpec[];
  readonly producedOutputs: readonly ModuleOutputSpec[];

  execute(task: IntelligenceBrainTask): Promise<BrainExecutionResult>;
  validate(task: IntelligenceBrainTask): ModuleValidationResult;
  health(): ModuleHealthReport;
  confidenceScore(task: IntelligenceBrainTask, result?: BrainExecutionResult): number;
}

/** Helper type for translating contract task input to existing scout engine input. */
export type ProductScoutTaskInput = ProductScoutScoreInput & {
  limit?: number;
};

/**
 * Example action routing table for a future ProductScout adapter implementation.
 * Kept as a const for documentation; not used by runtime code.
 */
export const PRODUCT_SCOUT_ACTION_MAP = {
  "product-scout.evaluate": "evaluate",
  "product-scout.scan_portfolio": "scanPortfolio",
  "product-scout.recommend": "recommend",
  "product-scout.persist": "persist",
} as const satisfies Record<ProductScoutCapability, string>;

/**
 * Type-only adapter sketch for Product Intelligence Engine (Mission 005).
 * Mapping:
 * - execute("product-intelligence.evaluate") → evaluateProduct()
 * - execute("product-intelligence.persist") → ProductIntelligenceEvaluationEngine.persist()
 * - confidenceScore() → ProductIntelligenceEvaluation.confidence
 * - health() → evaluateProduct probe on mock samples
 */
export interface ProductIntelligenceModuleContractAdapter extends IntelligenceModuleContract {
  readonly moduleId: "product-intelligence";
  readonly moduleName: "Product Intelligence Engine";
  readonly moduleVersion: "1.0.0";
  readonly capabilities: readonly ProductIntelligenceCapability[];
  readonly requiredInputs: readonly ModuleInputSpec[];
  readonly producedOutputs: readonly ModuleOutputSpec[];

  execute(task: IntelligenceBrainTask): Promise<BrainExecutionResult>;
  validate(task: IntelligenceBrainTask): ModuleValidationResult;
  health(): ModuleHealthReport;
  confidenceScore(task: IntelligenceBrainTask, result?: BrainExecutionResult): number;
}

export type ProductIntelligenceTaskInput = ProductIntelligenceInput & {
  workspaceId: string;
};

export const PRODUCT_INTELLIGENCE_ACTION_MAP = {
  "product-intelligence.evaluate": "evaluateProduct",
  "product-intelligence.persist": "persist",
} as const satisfies Record<ProductIntelligenceCapability, string>;

export type SupplierIntelligenceModuleCapability = SupplierIntelligenceCapability;

/**
 * Adapter mapping for Supplier Intelligence Engine (Mission 006).
 * Mapping:
 * - execute("supplier-intelligence.discover") → discoverSuppliers()
 * - execute("supplier-intelligence.evaluate") → evaluateSupplier()
 * - execute("supplier-intelligence.compare") → compareSuppliers()
 * - execute("supplier-intelligence.score") → evaluateSupplier() (legacy alias)
 * - execute("supplier-intelligence.list") → listMockCatalog()
 */
export interface SupplierIntelligenceModuleContractAdapter extends IntelligenceModuleContract {
  readonly moduleId: "supplier-intelligence";
  readonly moduleName: "AI Supplier Intelligence";
  readonly moduleVersion: "1.0.0";
  readonly capabilities: readonly SupplierIntelligenceCapability[];
  readonly requiredInputs: readonly ModuleInputSpec[];
  readonly producedOutputs: readonly ModuleOutputSpec[];

  execute(task: IntelligenceBrainTask): Promise<BrainExecutionResult>;
  validate(task: IntelligenceBrainTask): ModuleValidationResult;
  health(): ModuleHealthReport;
  confidenceScore(task: IntelligenceBrainTask, result?: BrainExecutionResult): number;
}

export const SUPPLIER_INTELLIGENCE_ACTION_MAP = {
  "supplier-intelligence.list": "listMockCatalog",
  "supplier-intelligence.discover": "discoverSuppliers",
  "supplier-intelligence.evaluate": "evaluateSupplier",
  "supplier-intelligence.score": "evaluateSupplier",
  "supplier-intelligence.compare": "compareSuppliers",
} as const satisfies Record<SupplierIntelligenceCapability, string>;
