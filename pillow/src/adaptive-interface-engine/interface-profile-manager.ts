/** T5-06 — Interface profile management for personalization. */

import { randomUUID } from "node:crypto";
import { ADAPTIVE_METADATA_VERSION } from "./paths.js";
import type { AdaptiveInterfaceProfile, RawAdaptationCandidate } from "./types.js";

export class InterfaceProfileManager {
  private activeProfile: AdaptiveInterfaceProfile | null = null;

  updateProfile(input: {
    sessionId: string;
    candidates: RawAdaptationCandidate[];
    recurringPatterns: string[];
  }): AdaptiveInterfaceProfile {
    const now = new Date().toISOString();
    const layoutPatterns = input.candidates
      .filter((c) => c.adaptationCategory === "adaptive_layout")
      .map((c) => c.recommendedInterfaceAdaptations[0] ?? "")
      .filter(Boolean);
    const navPatterns = input.candidates
      .flatMap((c) => c.recommendedNavigationAdaptations)
      .slice(0, 5);
    const workspacePatterns = input.candidates
      .flatMap((c) => c.recommendedWorkspaceAdaptations)
      .slice(0, 5);

    if (!this.activeProfile) {
      this.activeProfile = {
        profileId: `aie-profile-${randomUUID()}`,
        sessionId: input.sessionId,
        createdAt: now,
        updatedAt: now,
        preferredLayoutPatterns: layoutPatterns,
        preferredNavigationPatterns: navPatterns,
        preferredWorkspaceOrganization: workspacePatterns,
        recurringUsagePatterns: input.recurringPatterns,
        confidenceScore: this.averageConfidence(input.candidates),
        metadataVersion: ADAPTIVE_METADATA_VERSION,
      };
    } else {
      this.activeProfile = {
        ...this.activeProfile,
        updatedAt: now,
        preferredLayoutPatterns: this.mergeUnique(
          this.activeProfile.preferredLayoutPatterns,
          layoutPatterns,
        ),
        preferredNavigationPatterns: this.mergeUnique(
          this.activeProfile.preferredNavigationPatterns,
          navPatterns,
        ),
        preferredWorkspaceOrganization: this.mergeUnique(
          this.activeProfile.preferredWorkspaceOrganization,
          workspacePatterns,
        ),
        recurringUsagePatterns: this.mergeUnique(
          this.activeProfile.recurringUsagePatterns,
          input.recurringPatterns,
        ),
        confidenceScore: this.averageConfidence(input.candidates),
      };
    }

    return this.activeProfile;
  }

  getActiveProfile(): AdaptiveInterfaceProfile | null {
    return this.activeProfile;
  }

  resetForTesting(): void {
    this.activeProfile = null;
  }

  private mergeUnique(existing: string[], incoming: string[]): string[] {
    return [...new Set([...existing, ...incoming])].slice(0, 12);
  }

  private averageConfidence(candidates: RawAdaptationCandidate[]): number {
    if (!candidates.length) return 0.5;
    return (
      candidates.reduce((sum, c) => sum + c.confidenceScore, 0) / candidates.length
    );
  }
}
