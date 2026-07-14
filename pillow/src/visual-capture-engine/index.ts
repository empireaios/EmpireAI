export { createVisualCaptureEngine, VisualCaptureEngine, resetVisualCaptureEngineForTesting } from "./engine.js";
export { buildVisualCaptureConfiguration, DEFAULT_VISUAL_CAPTURE_CONFIGURATION, effectiveCaptureIntervalMs } from "./configuration.js";
export { VISUAL_CAPTURE_SYSTEM_PATH, DEFAULT_CAPTURE_URL, CAPTURE_SOURCES } from "./paths.js";
export type {
  VisualCaptureState,
  CaptureFrame,
  CaptureFrameMetadata,
  CaptureHealthReport,
  CapturePerformanceStats,
  CaptureSessionState,
  VisualCaptureCockpitSnapshot,
  DisplayInfo,
  WindowInfo,
  CaptureStatus,
  CaptureSource,
} from "./types.js";
export type { VisualCaptureConfiguration } from "./configuration.js";
