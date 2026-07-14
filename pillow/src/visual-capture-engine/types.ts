/** PILLOW-VCE-001 — Visual Capture Engine types (T1-01). */

import type { CAPTURE_SOURCES, CAPTURE_STATUSES } from "./paths.js";
import type { VisualCaptureConfiguration } from "./configuration.js";

export type VisualCaptureEngineVersion = "PILLOW-VCE-001";
export type CaptureSource = (typeof CAPTURE_SOURCES)[number];
export type CaptureStatus = (typeof CAPTURE_STATUSES)[number];

export type DisplayInfo = {
  displayId: string;
  label: string;
  width: number;
  height: number;
  scaleFactor: number;
  isPrimary: boolean;
};

export type WindowInfo = {
  windowId: string;
  title: string;
  processName: string;
  displayId: string;
  bounds: { x: number; y: number; width: number; height: number };
  isMinimized: boolean;
};

export type CaptureFrameMetadata = {
  timestamp: string;
  sessionId: string;
  frameNumber: number;
  windowId: string;
  displayId: string;
  resolution: { width: number; height: number };
  viewport: { width: number; height: number };
  captureDurationMs: number;
  captureStatus: CaptureStatus;
  captureSource: CaptureSource;
  error?: string;
};

export type CaptureFrame = {
  metadata: CaptureFrameMetadata;
  imageBase64: string;
  mimeType: "image/png";
  byteLength: number;
};

export type CaptureSessionState = {
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  status: CaptureStatus;
  framesCaptured: number;
  framesFailed: number;
  lastFrameAt: string | null;
};

export type CaptureHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  captureEnabled: boolean;
  isCapturing: boolean;
  lastSuccessfulCaptureAt: string | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  averageCaptureDurationMs: number;
  framesPerMinute: number;
  backlogSize: number;
  notes: string[];
};

export type CapturePerformanceStats = {
  totalFrames: number;
  successfulFrames: number;
  failedFrames: number;
  averageCaptureDurationMs: number;
  peakCaptureDurationMs: number;
  droppedFrames: number;
  uptimeMs: number;
};

export type CaptureLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type VisualCaptureState = {
  engineVersion: VisualCaptureEngineVersion;
  missionId: "T1-01";
  status: CaptureStatus;
  initializedAt: string;
  configuration: VisualCaptureConfiguration;
  activeSession: CaptureSessionState | null;
  selectedWindow: WindowInfo | null;
  displays: DisplayInfo[];
  latestFrame: CaptureFrame | null;
  health: CaptureHealthReport;
  performance: CapturePerformanceStats;
};

export type VisualCaptureCockpitSnapshot = {
  captureStatus: CaptureStatus;
  healthStatus: string;
  framesCaptured: number;
  latestFrameTimestamp: string | null;
  viewportDimensions: string;
  captureSource: CaptureSource;
  captureIntervalMs: number;
  selectedWindowTitle: string | null;
  displayCount: number;
  recoveryAttempts: number;
  recentLogs: string[];
};
