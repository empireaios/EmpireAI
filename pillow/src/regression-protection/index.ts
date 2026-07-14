export {
  createRegressionProtectionEngine,
  RegressionProtectionEngine,
  resetRegressionProtectionForTesting,
} from "./engine.js";
export {
  buildRegressionProtectionConfiguration,
  DEFAULT_REGRESSION_PROTECTION_CONFIGURATION,
} from "./configuration.js";
export {
  REGRESSION_PROTECTION_SYSTEM_PATH,
  REGRESSION_METADATA_VERSION,
  ENGINE_STATUSES,
  PROTECTION_DECISIONS,
  REGRESSION_STATUSES,
  COMPARISON_SCOPES,
  REGRESSION_CATEGORIES,
  REGRESSION_SEVERITIES,
  BASELINE_SOURCE_RULES,
} from "./paths.js";
export type {
  RegressionProtectionState,
  UiRegression,
  RegressionProtectionReport,
  RegressionRunReport,
  RegressionRunValidationReport,
  RegressionProtectionCockpitSnapshot,
  RegressionProtectionHealthReport,
  RegressionProtectionPerformanceStats,
  BaselineUiState,
  ProposedUiState,
  ComparisonScope,
  RegressionCategory,
  RegressionSeverity,
  ProtectionDecision,
  RegressionStatus,
  BaselineSourceRule,
} from "./types.js";
export type { RegressionProtectionConfiguration } from "./configuration.js";
