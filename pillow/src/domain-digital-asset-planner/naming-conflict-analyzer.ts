/** X1-06 — Naming Conflict Analyzer (structural signals only). */

import type { DigitalAssetPlanRecord } from "./types.js";

export class NamingConflictAnalyzer {
  analyze(record: DigitalAssetPlanRecord, existing: DigitalAssetPlanRecord[]): string {
    const conflicts: string[] = [];
    const domain = record.proposedCompanyDomain.toLowerCase();
    const handleStem = this.extractHandleStem(record.socialMediaHandlePlan);

    for (const other of existing) {
      if (other.digitalAssetPlanId === record.digitalAssetPlanId) continue;
      if (other.proposedCompanyDomain.toLowerCase() === domain) {
        conflicts.push(`domain collision with ${other.digitalAssetPlanId}`);
      }
      const otherStem = this.extractHandleStem(other.socialMediaHandlePlan);
      if (handleStem && otherStem && handleStem === otherStem) {
        conflicts.push(`social handle stem collision with ${other.digitalAssetPlanId}`);
      }
    }

    if (domain.includes(" ") || domain.includes("_")) {
      conflicts.push("proposed domain contains invalid structural characters");
    }

    if (conflicts.length === 0) {
      return "no structural naming conflicts detected";
    }
    return conflicts.join(" | ");
  }

  countConflicts(summary: string): number {
    if (!summary || summary === "no structural naming conflicts detected") return 0;
    return summary.split("|").map((s) => s.trim()).filter(Boolean).length;
  }

  private extractHandleStem(plan: string): string {
    const match = plan.match(/@([a-z0-9]+)/i);
    return match?.[1]?.toLowerCase() ?? "";
  }
}
