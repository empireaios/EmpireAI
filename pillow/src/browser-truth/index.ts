export { BrowserTruthEngine, createBrowserTruthEngine } from "./engine.js";
export { executeBrowserVerificationPipeline } from "./pipeline.js";
export {
  buildBrowserReadinessPipeline,
  buildBrowserReadinessPipelineSync,
  evaluateBrowserBuilderGate,
} from "./builder-gate.js";
export {
  evaluateTripleAcceptance,
  formatAcceptanceBlock,
} from "./acceptance.js";
export { probeProductionSurface } from "./production-probe.js";
export { detectBrowserDrift, compareBehaviourLayers } from "./drift-detector.js";
export { formatBrowserTruthPreamble, prependBrowserTruth } from "./mission-preamble.js";
export {
  BROWSER_TRUTH_SYSTEM_PATH,
  PRODUCTION_TRUTH_COMPANION_PATH,
  PRODUCTION_URL,
  BROWSER_ACCEPTANCE_PIPELINE,
  BROWSER_VERIFICATION_DIMENSIONS,
  PRODUCTION_SCENARIOS,
  MANDATORY_BROWSER_EVIDENCE_FIELDS,
} from "./paths.js";
export type {
  BrowserTruthState,
  BrowserTruthRequest,
  BrowserBuilderGateResult,
  BrowserReadinessPipeline,
  BrowserVerificationResult,
  BrowserEvidencePackage,
  TripleAcceptanceModel,
  AcceptanceVerdict,
  BrowserTruthMetrics,
  BrowserTruthComparison,
  BrowserDriftReport,
} from "./types.js";
