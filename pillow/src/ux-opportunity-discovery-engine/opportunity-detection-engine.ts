/** T5-03 — Opportunity Detection Engine — aggregates all opportunity detectors. */

import { appendDiscoveryLog } from "./opportunity-logging.js";
import type { UxAuditRecord } from "../autonomous-ux-audit-engine/types.js";
import type { ObservationRecord } from "../continuous-screen-observation-engine/types.js";
import type { UxOpportunityDiscoveryConfiguration } from "./configuration.js";
import {
  AccessibilityOpportunityDetector,
  ComponentOpportunityDetector,
  InteractionOpportunityDetector,
  LayoutOpportunityDetector,
  NavigationOpportunityDetector,
  WorkflowOpportunityDetector,
} from "./opportunity-detectors.js";
import { defaultComplexityForCategory } from "./opportunity-metadata-generator.js";
import { impactFromSeverity } from "./ux-prioritization-engine.js";
import type {
  OpportunityCategory,
  RawOpportunityCandidate,
  UxOpportunityDiscoveryEngineBundle,
} from "./types.js";

export class OpportunityDetectionEngine {
  private readonly layout = new LayoutOpportunityDetector();
  private readonly component = new ComponentOpportunityDetector();
  private readonly navigation = new NavigationOpportunityDetector();
  private readonly workflow = new WorkflowOpportunityDetector();
  private readonly accessibility = new AccessibilityOpportunityDetector();
  private readonly interaction = new InteractionOpportunityDetector();
  private readonly seenSignatures = new Set<string>();

  detect(input: {
    engines: UxOpportunityDiscoveryEngineBundle;
    audit: UxAuditRecord | null;
    observation: ObservationRecord | null;
    config: UxOpportunityDiscoveryConfiguration;
  }): RawOpportunityCandidate[] {
    const candidates: RawOpportunityCandidate[] = [
      ...this.layout.detect(input.audit),
      ...this.component.detect(input.audit),
      ...this.navigation.detect(input.audit),
      ...this.workflow.detect(input.audit),
      ...this.accessibility.detect(input.audit),
      ...this.interaction.detect(input.audit),
      ...this.fromRecommendations(input.engines),
      ...this.fromCollaboration(input.engines),
      ...this.fromUxScoring(input.engines),
      ...this.fromVisualConsistency(input.engines, input.audit),
      ...this.fromResponsiveness(input.engines),
    ];

    const filtered = input.config.deduplicateOpportunities
      ? this.deduplicate(candidates)
      : candidates;

    for (const c of filtered) {
      appendDiscoveryLog({
        event: "opportunity_detection",
        level: "info",
        details: `${c.category}: ${c.summary.slice(0, 80)}`,
      });
    }

    return filtered;
  }

  resetForTesting(): void {
    this.seenSignatures.clear();
  }

  private deduplicate(candidates: RawOpportunityCandidate[]): RawOpportunityCandidate[] {
    const unique: RawOpportunityCandidate[] = [];
    for (const c of candidates) {
      const sig = `${c.category}:${c.summary.slice(0, 120)}`;
      if (this.seenSignatures.has(sig)) continue;
      this.seenSignatures.add(sig);
      unique.push(c);
    }
    return unique;
  }

  private fromRecommendations(
    engines: UxOpportunityDiscoveryEngineBundle,
  ): RawOpportunityCandidate[] {
    try {
      const rec = engines.recommendationEngine?.getState();
      const proposals = rec?.latestRecord?.proposals ?? [];
      return proposals.map((p) => ({
        category: this.mapRecommendationCategory(p.recommendationCategory),
        summary: p.recommendationTitle,
        expectedBenefit: p.expectedUxBenefit,
        complexity: defaultComplexityForCategory(
          this.mapRecommendationCategory(p.recommendationCategory),
        ),
        evidenceReferences: p.evidenceReferences,
        confidenceScore: p.confidenceScore,
        impactScore: impactFromSeverity(p.severity),
        sourceEngine: "PILLOW-REC-001",
      }));
    } catch {
      return [];
    }
  }

  private fromCollaboration(
    engines: UxOpportunityDiscoveryEngineBundle,
  ): RawOpportunityCandidate[] {
    try {
      const cc = engines.continuousCollaboration?.getState();
      const session = cc?.activeSession;
      if (!session) return [];

      const opportunities: RawOpportunityCandidate[] = [];
      for (const goal of session.activeUxGoals ?? []) {
        opportunities.push({
          category: "interaction_improvement",
          summary: `Collaboration UX goal: ${goal}`,
          expectedBenefit: "Advances persistent UX partnership objectives",
          complexity: "medium",
          evidenceReferences: [`collaboration:goal:${goal}`],
          confidenceScore: session.confidenceScore,
          impactScore: 0.65,
          sourceEngine: "PILLOW-CC-001",
        });
      }
      for (const proposalId of session.pendingProposalIds ?? []) {
        opportunities.push({
          category: "component_improvement",
          summary: `Pending UX proposal opportunity: ${proposalId}`,
          expectedBenefit: "Converts pending collaboration proposal into UX improvement",
          complexity: "medium",
          evidenceReferences: [`collaboration:proposal:${proposalId}`],
          confidenceScore: Math.max(0.5, session.confidenceScore * 0.9),
          impactScore: 0.7,
          sourceEngine: "PILLOW-CC-001",
        });
      }
      return opportunities;
    } catch {
      return [];
    }
  }

  private fromUxScoring(
    engines: UxOpportunityDiscoveryEngineBundle,
  ): RawOpportunityCandidate[] {
    try {
      const ux = engines.uxScoring?.getState();
      const record = ux?.latestRecord;
      if (!record || record.overallUxScore >= 75) return [];
      return [
        {
          category: "performance_related_ux_improvement",
          summary: `Elevate overall UX score from ${record.overallUxScore}`,
          expectedBenefit: "Improves holistic UX intelligence baseline",
          complexity: "high",
          evidenceReferences: [`ux-score:${record.uxScoreId}`],
          confidenceScore: 0.72,
          impactScore: 0.75,
          sourceEngine: "PILLOW-UXS-001",
        },
      ];
    } catch {
      return [];
    }
  }

  private fromVisualConsistency(
    engines: UxOpportunityDiscoveryEngineBundle,
    audit: UxAuditRecord | null,
  ): RawOpportunityCandidate[] {
    const fromAudit = (audit?.detectedUxIssues ?? [])
      .filter((i) => i.category === "visual_consistency_issue")
      .map((issue) => ({
        category: "visual_consistency_improvement" as OpportunityCategory,
        summary: `Consistency improvement: ${issue.description}`,
        expectedBenefit: "Strengthens visual coherence across the interface",
        complexity: defaultComplexityForCategory("visual_consistency_improvement"),
        evidenceReferences: [issue.evidenceReference],
        confidenceScore: issue.detectionConfidence,
        impactScore: impactFromSeverity(issue.severity),
        sourceEngine: issue.sourceEngine,
      }));

    try {
      const vc = engines.visualConsistency?.getState();
      const findings = vc?.latestRecord?.consistencyFindings ?? [];
      const fromVc = findings.map((f) => ({
        category: "visual_consistency_improvement" as OpportunityCategory,
        summary: f.findingDescription,
        expectedBenefit: "Aligns observed patterns with design system standards",
        complexity: "medium" as const,
        evidenceReferences: [`consistency:${f.findingId}`],
        confidenceScore: f.detectionConfidence,
        impactScore: impactFromSeverity(f.severity),
        sourceEngine: "PILLOW-VCE-001",
      }));
      return [...fromAudit, ...fromVc];
    } catch {
      return fromAudit;
    }
  }

  private fromResponsiveness(
    engines: UxOpportunityDiscoveryEngineBundle,
  ): RawOpportunityCandidate[] {
    try {
      const rules = engines.uxRuleEngine?.getState();
      const violations = rules?.latestReport?.violations ?? [];
      return violations
        .filter((v) => v.category === "responsiveness")
        .map((v) => ({
          category: "responsive_improvement" as OpportunityCategory,
          summary: v.violationDescription,
          expectedBenefit: "Improves responsive layout behavior across viewports",
          complexity: "high" as const,
          evidenceReferences: [`ux-rule:${v.violationId}`],
          confidenceScore: 0.7,
          impactScore: impactFromSeverity(v.severity),
          sourceEngine: "PILLOW-URE-001",
        }));
    } catch {
      return [];
    }
  }

  private mapRecommendationCategory(category: string): OpportunityCategory {
    const direct = category as OpportunityCategory;
    if (
      [
        "layout_improvement",
        "component_improvement",
        "navigation_improvement",
        "workflow_improvement",
        "accessibility_improvement",
        "visual_consistency_improvement",
      ].includes(category)
    ) {
      return direct;
    }
    const map: Record<string, OpportunityCategory> = {
      design_system_alignment: "visual_consistency_improvement",
      form_usability_improvement: "interaction_improvement",
      dashboard_improvement: "layout_improvement",
      loading_state_improvement: "performance_related_ux_improvement",
      empty_state_improvement: "interaction_improvement",
      error_state_improvement: "feedback_improvement",
    };
    return map[category] ?? "interaction_improvement";
  }
}
