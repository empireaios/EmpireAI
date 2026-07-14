/** T5-10 — Visual Intelligence Certification session manager. */

import type { CertificationStatus } from "./types.js";

export class VisualIntelligenceCertificationManager {
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
    programmesPassed: number,
    programmesTotal: number,
    t5Passed: number,
    t5Total: number,
    e2ePassed: boolean,
    governancePassed: boolean,
    requireE2e: boolean,
  ): CertificationStatus {
    const programmesOk = programmesPassed === programmesTotal;
    const t5Ok = t5Passed === t5Total;
    const e2eOk = !requireE2e || e2ePassed;
    if (programmesOk && t5Ok && e2eOk && governancePassed) return "certified";
    if (programmesPassed + t5Passed >= Math.ceil((programmesTotal + t5Total) * 0.7)) {
      return "degraded";
    }
    return "failed";
  }
}
