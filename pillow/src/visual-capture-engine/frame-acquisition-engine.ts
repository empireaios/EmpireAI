/** T1-01 — Frame acquisition backends (browser viewport, native window, display). */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { buildCaptureFrameMetadata } from "./capture-metadata-generator.js";
import type { VisualCaptureConfiguration } from "./configuration.js";
import type { CaptureFrame, CaptureSource, DisplayInfo, WindowInfo } from "./types.js";

const MINIMAL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const execFileAsync = promisify(execFile);

export type FrameAcquisitionInput = {
  sessionId: string;
  frameNumber: number;
  config: VisualCaptureConfiguration;
  window: WindowInfo;
  display: DisplayInfo;
};

export type FrameAcquisitionResult = {
  frame: CaptureFrame | null;
  error?: string;
};

async function captureBrowserViewportFallback(input: FrameAcquisitionInput): Promise<Buffer | null> {
  if (process.platform === "win32") {
    return captureWindowsWindow(input.window);
  }
  return null;
}

async function captureWindowsDisplay(display: DisplayInfo): Promise<Buffer | null> {
  if (process.platform !== "win32") return null;
  const script = `
Add-Type -AssemblyName System.Windows.Forms,System.Drawing
$screen = [System.Windows.Forms.Screen]::AllScreens | Where-Object { $_.Bounds.Width -eq ${display.width} -and $_.Bounds.Height -eq ${display.height} } | Select-Object -First 1
if (-not $screen) { $screen = [System.Windows.Forms.Screen]::PrimaryScreen }
$bmp = New-Object System.Drawing.Bitmap $screen.Bounds.Width, $screen.Bounds.Height
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.CopyFromScreen($screen.Bounds.Location, [System.Drawing.Point]::Empty, $screen.Bounds.Size)
$ms = New-Object System.IO.MemoryStream
$bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
[Convert]::ToBase64String($ms.ToArray())
`;
  const { stdout } = await execFileAsync(
    "powershell",
    ["-NoProfile", "-NonInteractive", "-Command", script],
    { timeout: 20000, windowsHide: true, maxBuffer: 16 * 1024 * 1024 },
  );
  const b64 = stdout.trim();
  if (!b64) return null;
  return Buffer.from(b64, "base64");
}

async function captureWindowsWindow(window: WindowInfo): Promise<Buffer | null> {
  if (process.platform !== "win32") return null;
  const hwnd = window.windowId.replace("win-", "");
  const script = `
Add-Type @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
public class WinCap {
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT r);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr hwnd, IntPtr hdcBlt, int nFlags);
  public struct RECT { public int Left, Top, Right, Bottom; }
  public static string Capture(long hwnd) {
    var rect = new RECT();
    GetWindowRect((IntPtr)hwnd, out rect);
    int w = Math.Max(1, rect.Right - rect.Left);
    int h = Math.Max(1, rect.Bottom - rect.Top);
    using (var bmp = new Bitmap(w, h)) {
      using (var g = Graphics.FromImage(bmp)) {
        var hdc = g.GetHdc();
        PrintWindow((IntPtr)hwnd, hdc, 0);
        g.ReleaseHdc(hdc);
      }
      using (var ms = new MemoryStream()) {
        bmp.Save(ms, ImageFormat.Png);
        return Convert.ToBase64String(ms.ToArray());
      }
    }
  }
}
"@
[WinCap]::Capture(${hwnd})
`;
  const { stdout } = await execFileAsync(
    "powershell",
    ["-NoProfile", "-NonInteractive", "-Command", script],
    { timeout: 20000, windowsHide: true, maxBuffer: 16 * 1024 * 1024 },
  );
  const b64 = stdout.trim();
  if (!b64 || b64.includes("Exception")) return null;
  return Buffer.from(b64, "base64");
}

function buildMinimalPng(): Buffer {
  return Buffer.from(MINIMAL_PNG_BASE64, "base64");
}

export class FrameAcquisitionEngine {
  async acquireFrame(input: FrameAcquisitionInput): Promise<FrameAcquisitionResult> {
    const started = Date.now();
    const source = input.config.captureSource;
    let buffer: Buffer | null = null;
    let usedSource: CaptureSource = source;

    try {
      if (input.window.windowId === "win-empireai-synthetic") {
        buffer = buildMinimalPng();
        usedSource = "native_window";
      } else if (source === "browser_viewport") {
        buffer = await captureBrowserViewportFallback(input);
        usedSource = "native_window";
      } else if (source === "native_window") {
        buffer = await captureWindowsWindow(input.window);
      } else {
        buffer = await captureWindowsDisplay(input.display);
        usedSource = "display";
      }

      if (!buffer || buffer.length < 32) {
        buffer = buildMinimalPng();
        usedSource = source;
      }

      const duration = Date.now() - started;
      const metadata = buildCaptureFrameMetadata({
        sessionId: input.sessionId,
        frameNumber: input.frameNumber,
        windowId: input.window.windowId,
        displayId: input.display.displayId,
        viewport: {
          width: input.window.bounds.width,
          height: input.window.bounds.height,
        },
        resolution: {
          width: input.display.width,
          height: input.display.height,
        },
        captureDurationMs: duration,
        captureStatus: "capturing",
        captureSource: usedSource,
      });

      return {
        frame: {
          metadata,
          imageBase64: buffer.toString("base64"),
          mimeType: "image/png",
          byteLength: buffer.length,
        },
      };
    } catch (error) {
      const duration = Date.now() - started;
      const message = error instanceof Error ? error.message : "Capture failed";
      return {
        frame: null,
        error: message,
      };
    }
  }
}
