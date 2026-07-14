/** T2-10 — UX Intelligence Certification session manager. */

import type { CertificationStatus } from "./types.js";

export class UxIntelligenceCertificationManager {
  private running = false;
  private lastRunAt: string | null = null;

  startRun(): void {
    this.running = true;
  }

  endRun(): void {
    this.running = false;
    this.lastRunAt = new Date().toISOString();
  }

  isRunning(): boolean {
    return this.running;
  }

  getLastRunAt(): string | null {
    return this.lastRunAt;
  }

  deriveStatus(
    missionsPassed: number,
    missionsTotal: number,
    e2ePassed: boolean,
    requireE2e: boolean,
  ): CertificationStatus {
    if (missionsPassed === missionsTotal && (!requireE2e || e2ePassed)) return "certified";
    if (missionsPassed >= Math.ceil(missionsTotal * 0.7)) return "degraded";
    return "failed";
  }
}
