/** T1-01 — Display enumeration and resolution tracking. */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { DisplayInfo } from "./types.js";

const execFileAsync = promisify(execFile);

const FALLBACK_DISPLAY: DisplayInfo = {
  displayId: "display-primary",
  label: "Primary Display",
  width: 1920,
  height: 1080,
  scaleFactor: 1,
  isPrimary: true,
};

export class DisplayManager {
  private displays: DisplayInfo[] = [FALLBACK_DISPLAY];
  private lastScanAt: string | null = null;

  async refreshDisplays(): Promise<DisplayInfo[]> {
    if (process.platform === "win32") {
      try {
        const script = `
Add-Type -AssemblyName System.Windows.Forms
$screens = [System.Windows.Forms.Screen]::AllScreens
$idx = 0
foreach ($s in $screens) {
  $primary = if ($s.Primary) { "true" } else { "false" }
  Write-Output ("DISPLAY|" + $idx + "|" + $s.Bounds.Width + "|" + $s.Bounds.Height + "|" + $primary)
  $idx++
}
`;
        const { stdout } = await execFileAsync(
          "powershell",
          ["-NoProfile", "-NonInteractive", "-Command", script],
          { timeout: 10000, windowsHide: true },
        );
        const parsed = stdout
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.startsWith("DISPLAY|"))
          .map((line, i) => {
            const parts = line.split("|");
            return {
              displayId: `display-${parts[1] ?? i}`,
              label: `Display ${parts[1] ?? i}`,
              width: Number.parseInt(parts[2] ?? "1920", 10),
              height: Number.parseInt(parts[3] ?? "1080", 10),
              scaleFactor: 1,
              isPrimary: parts[4] === "true",
            } satisfies DisplayInfo;
          });
        if (parsed.length > 0) {
          this.displays = parsed;
        }
      } catch {
        this.displays = [FALLBACK_DISPLAY];
      }
    }
    this.lastScanAt = new Date().toISOString();
    return this.getDisplays();
  }

  getDisplays(): DisplayInfo[] {
    return this.displays.map((d) => ({ ...d }));
  }

  getPrimaryDisplay(): DisplayInfo {
    return this.displays.find((d) => d.isPrimary) ?? this.displays[0] ?? FALLBACK_DISPLAY;
  }

  getDisplay(displayId: string | null): DisplayInfo {
    if (!displayId) return this.getPrimaryDisplay();
    return this.displays.find((d) => d.displayId === displayId) ?? this.getPrimaryDisplay();
  }

  detectResolutionChange(previous: DisplayInfo[], current: DisplayInfo[]): boolean {
    if (previous.length !== current.length) return true;
    return current.some((d, i) => {
      const p = previous[i];
      return !p || p.width !== d.width || p.height !== d.height;
    });
  }

  getLastScanAt(): string | null {
    return this.lastScanAt;
  }
}
