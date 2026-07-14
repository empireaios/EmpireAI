/** T1-01 — Capture orchestration controller. */

import { appendCaptureLog } from "./capture-logging.js";
import { CaptureScheduler } from "./capture-scheduler.js";
import { CaptureSessionManager } from "./capture-session-manager.js";
import { DisplayManager } from "./display-manager.js";
import { FrameAcquisitionEngine } from "./frame-acquisition-engine.js";
import { FrameBuffer } from "./frame-buffer.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { WindowSelectionManager } from "./window-selection-manager.js";
import type { VisualCaptureConfiguration } from "./configuration.js";
import type {
  CaptureFrame,
  CapturePerformanceStats,
  CaptureStatus,
  DisplayInfo,
  WindowInfo,
} from "./types.js";

export class CaptureController {
  private config: VisualCaptureConfiguration;
  private status: CaptureStatus = "idle";
  private frameNumber = 0;
  private performance: CapturePerformanceStats = {
    totalFrames: 0,
    successfulFrames: 0,
    failedFrames: 0,
    averageCaptureDurationMs: 0,
    peakCaptureDurationMs: 0,
    droppedFrames: 0,
    uptimeMs: 0,
  };

  private readonly sessionManager = new CaptureSessionManager();
  private readonly windowManager: WindowSelectionManager;
  private readonly displayManager = new DisplayManager();
  private readonly acquisitionEngine = new FrameAcquisitionEngine();
  private readonly frameBuffer: FrameBuffer;
  private readonly scheduler = new CaptureScheduler();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();

  private displays: DisplayInfo[] = [];
  private selectedWindow: WindowInfo | null = null;
  private latestFrame: CaptureFrame | null = null;
  private capturing = false;

  constructor(config: VisualCaptureConfiguration) {
    this.config = config;
    this.windowManager = new WindowSelectionManager(config);
    this.frameBuffer = new FrameBuffer(config.bufferLimit);
  }

  getStatus(): CaptureStatus {
    return this.status;
  }

  getConfiguration(): VisualCaptureConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: VisualCaptureConfiguration): void {
    this.config = config;
    this.windowManager.updateConfig(config);
    this.frameBuffer.setLimit(config.bufferLimit);
    if (this.scheduler.isRunning()) {
      this.stop();
      if (config.enabled) void this.start();
    }
  }

  async initialize(): Promise<void> {
    this.displays = await this.displayManager.refreshDisplays();
    await this.windowManager.scanWindows();
    this.selectedWindow = this.windowManager.getSelectedWindow();
    appendCaptureLog({ event: "engine_initialized", level: "info", details: "Visual Capture Engine initialized" });
  }

  async start(): Promise<void> {
    if (!this.config.enabled) {
      this.status = "idle";
      return;
    }
    if (this.scheduler.isRunning()) return;

    this.displays = await this.displayManager.refreshDisplays();
    await this.windowManager.scanWindows();
    this.selectedWindow = this.windowManager.getSelectedWindow();
    this.sessionManager.startSession();
    this.healthMonitor.markSessionStart();
    this.recoveryManager.reset();
    this.frameNumber = 0;
    this.lastEnvironmentScanAt = Date.now();
    this.status = "capturing";

    appendCaptureLog({ event: "capture_start", level: "info", details: `Session started · source ${this.config.captureSource}` });

    this.scheduler.start(this.config, () => this.captureTick());
  }

  stop(): void {
    this.scheduler.stop();
    this.sessionManager.endSession("stopped");
    this.healthMonitor.markSessionEnd();
    this.status = "stopped";
    appendCaptureLog({ event: "capture_stop", level: "info", details: "Capture stopped" });
  }

  pause(): void {
    if (!this.scheduler.isRunning()) return;
    this.scheduler.pause();
    this.sessionManager.setStatus("paused");
    this.status = "paused";
    appendCaptureLog({ event: "capture_pause", level: "info", details: "Capture paused" });
  }

  resume(): void {
    if (!this.scheduler.isRunning()) return;
    this.scheduler.resume();
    this.sessionManager.setStatus("capturing");
    this.status = "capturing";
    appendCaptureLog({ event: "capture_resume", level: "info", details: "Capture resumed" });
  }

  getLatestFrame(): CaptureFrame | null {
    return this.latestFrame;
  }

  getRecentFrames(limit = 5): CaptureFrame[] {
    return this.frameBuffer.getRecent(limit);
  }

  getDisplays(): DisplayInfo[] {
    return this.displays;
  }

  getSelectedWindow(): WindowInfo | null {
    return this.selectedWindow;
  }

  getSession() {
    return this.sessionManager.getSession();
  }

  getPerformance(): CapturePerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor() {
    return this.healthMonitor;
  }

  getRecoveryManager() {
    return this.recoveryManager;
  }

  getFrameBufferSize(): number {
    return this.frameBuffer.size();
  }

  private lastEnvironmentScanAt = 0;
  private readonly environmentScanIntervalMs = 5000;

  private async refreshEnvironment(force = false): Promise<void> {
    const now = Date.now();
    if (!force && now - this.lastEnvironmentScanAt < this.environmentScanIntervalMs) {
      return;
    }

    const previousDisplays = this.displays;
    this.displays = await this.displayManager.refreshDisplays();
    if (this.displayManager.detectResolutionChange(previousDisplays, this.displays)) {
      appendCaptureLog({ event: "display_resolution_change", level: "info", details: "Display resolution changed" });
    }

    const previousWindow = this.selectedWindow;
    await this.windowManager.scanWindows();
    this.selectedWindow = this.windowManager.getSelectedWindow();
    if (this.windowManager.windowChanged(previousWindow, this.selectedWindow)) {
      appendCaptureLog({
        event: "window_change",
        level: "info",
        details: `Window updated: ${this.selectedWindow?.title ?? "none"}`,
      });
    }

    this.lastEnvironmentScanAt = now;
  }

  private async captureTick(): Promise<void> {
    if (this.capturing) {
      this.performance.droppedFrames += 1;
      return;
    }
    this.capturing = true;
    try {
      await this.refreshEnvironment();
      const session = this.sessionManager.getSession();
      const window =
        this.selectedWindow ??
        ({
          windowId: "win-empireai-synthetic",
          title: "EmpireAI",
          processName: "browser",
          displayId: "display-primary",
          bounds: { x: 0, y: 0, width: 1280, height: 720 },
          isMinimized: false,
        } satisfies WindowInfo);

      if (!session) {
        this.status = "failed";
        return;
      }

      if (window.isMinimized) {
        appendCaptureLog({ event: "window_minimized", level: "warn", details: "Target window minimized — skipping frame" });
        return;
      }

      const display = this.displayManager.getDisplay(window.displayId);
      this.frameNumber += 1;

      const result = await this.acquisitionEngine.acquireFrame({
        sessionId: session.sessionId,
        frameNumber: this.frameNumber,
        config: this.config,
        window,
        display,
      });

      this.performance.totalFrames += 1;

      if (result.frame) {
        this.latestFrame = result.frame;
        this.frameBuffer.push(result.frame);
        this.sessionManager.recordFrame(true);
        this.recoveryManager.recordSuccess();
        this.performance.successfulFrames += 1;
        const duration = result.frame.metadata.captureDurationMs;
        this.healthMonitor.recordCapture(duration, true);
        this.performance.peakCaptureDurationMs = Math.max(this.performance.peakCaptureDurationMs, duration);
        this.performance.averageCaptureDurationMs = Math.round(
          (this.performance.averageCaptureDurationMs * (this.performance.successfulFrames - 1) + duration) /
            this.performance.successfulFrames,
        );
        this.status = "capturing";
      } else {
        this.sessionManager.recordFrame(false);
        this.performance.failedFrames += 1;
        this.healthMonitor.recordCapture(0, false);
        const shouldRecover = this.recoveryManager.recordFailure(result.error ?? "Unknown capture error", this.config);
        if (shouldRecover) {
          this.status = "recovering";
          await this.refreshEnvironment(true);
          this.status = "capturing";
        } else if (this.recoveryManager.getConsecutiveFailures() >= this.config.maxRetryAttempts) {
          this.status = "failed";
          appendCaptureLog({ event: "capture_failed", level: "error", details: result.error ?? "Max retries exceeded" });
        }
      }
    } finally {
      this.capturing = false;
    }
  }
}
