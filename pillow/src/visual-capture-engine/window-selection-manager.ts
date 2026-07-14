/** T1-01 — EmpireAI window discovery and selection. */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { VisualCaptureConfiguration } from "./configuration.js";
import type { WindowInfo } from "./types.js";

const execFileAsync = promisify(execFile);

export class WindowSelectionManager {
  private selectedWindowId: string | null = null;
  private knownWindows: WindowInfo[] = [];

  constructor(private config: VisualCaptureConfiguration) {
    this.selectedWindowId = config.selectedWindowId;
  }

  updateConfig(config: VisualCaptureConfiguration): void {
    this.config = config;
    if (config.selectedWindowId) this.selectedWindowId = config.selectedWindowId;
  }

  async scanWindows(): Promise<WindowInfo[]> {
    if (this.selectedWindowId === "win-empireai-synthetic") {
      this.knownWindows = [this.buildSyntheticWindow()];
      return this.getWindows();
    }

    if (process.platform !== "win32") {
      this.knownWindows = [this.buildSyntheticWindow()];
      return this.getWindows();
    }

    try {
      const patterns = this.config.windowTitlePatterns.map((p) => p.replace(/'/g, "''")).join("|");
      const script = `
Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class Win32 {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
  public struct RECT { public int Left, Top, Right, Bottom; }
}
"@
$pattern = '${patterns}'
$results = New-Object System.Collections.Generic.List[string]
[Win32]::EnumWindows({
  param($hWnd, $lParam)
  if (-not [Win32]::IsWindowVisible($hWnd)) { return $true }
  $sb = New-Object System.Text.StringBuilder 512
  [void][Win32]::GetWindowText($hWnd, $sb, 512)
  $title = $sb.ToString()
  if ([string]::IsNullOrWhiteSpace($title)) { return $true }
  if ($pattern -and ($title -notmatch $pattern)) { return $true }
  $rect = New-Object Win32+RECT
  [void][Win32]::GetWindowRect($hWnd, [ref]$rect)
  $min = [Win32]::IsIconic($hWnd)
  $w = $rect.Right - $rect.Left
  $h = $rect.Bottom - $rect.Top
  $hwnd = $hWnd.ToInt64()
  $results.Add("WINDOW|$hwnd|$title|$rect.Left|$rect.Top|$w|$h|$min")
  return $true
}, [IntPtr]::Zero) | Out-Null
$results | ForEach-Object { Write-Output $_ }
`;
      const { stdout } = await execFileAsync(
        "powershell",
        ["-NoProfile", "-NonInteractive", "-Command", script],
        { timeout: 15000, windowsHide: true, maxBuffer: 4 * 1024 * 1024 },
      );

      const windows = stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.startsWith("WINDOW|"))
        .map((line) => {
          const parts = line.split("|");
          const width = Number.parseInt(parts[6] ?? "1280", 10);
          const height = Number.parseInt(parts[7] ?? "720", 10);
          return {
            windowId: `win-${parts[1]}`,
            title: parts[2] ?? "Unknown",
            processName: "browser",
            displayId: "display-primary",
            bounds: {
              x: Number.parseInt(parts[3] ?? "0", 10),
              y: Number.parseInt(parts[4] ?? "0", 10),
              width: Math.max(1, width),
              height: Math.max(1, height),
            },
            isMinimized: parts[8] === "True",
          } satisfies WindowInfo;
        });

      this.knownWindows = windows.length > 0 ? windows : [this.buildSyntheticWindow()];
    } catch {
      this.knownWindows = [this.buildSyntheticWindow()];
    }

    if (!this.selectedWindowId && this.knownWindows.length > 0) {
      this.selectedWindowId = this.knownWindows[0]!.windowId;
    }

    return this.getWindows();
  }

  selectWindow(windowId: string | null): WindowInfo | null {
    this.selectedWindowId = windowId;
    return this.getSelectedWindow();
  }

  getSelectedWindow(): WindowInfo | null {
    if (!this.selectedWindowId) return this.knownWindows[0] ?? null;
    return this.knownWindows.find((w) => w.windowId === this.selectedWindowId) ?? this.knownWindows[0] ?? null;
  }

  getWindows(): WindowInfo[] {
    return this.knownWindows.map((w) => ({ ...w, bounds: { ...w.bounds } }));
  }

  windowChanged(previous: WindowInfo | null, current: WindowInfo | null): boolean {
    if (!previous && current) return true;
    if (previous && !current) return true;
    if (!previous || !current) return false;
    return (
      previous.windowId !== current.windowId ||
      previous.bounds.width !== current.bounds.width ||
      previous.bounds.height !== current.bounds.height ||
      previous.bounds.x !== current.bounds.x ||
      previous.bounds.y !== current.bounds.y ||
      previous.isMinimized !== current.isMinimized
    );
  }

  private buildSyntheticWindow(): WindowInfo {
    return {
      windowId: "win-empireai-synthetic",
      title: "EmpireAI",
      processName: "browser",
      displayId: "display-primary",
      bounds: { x: 0, y: 0, width: 1280, height: 720 },
      isMinimized: false,
    };
  }
}
