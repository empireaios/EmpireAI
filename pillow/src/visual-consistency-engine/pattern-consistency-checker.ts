/** T2-07 — Pattern consistency checking (tables, cards, modals, states). */

import type { UiComponent } from "../component-recognition-engine/types.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { AccessibilityReviewRecord } from "../accessibility-intelligence-engine/types.js";
import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";
import type { ExecutiveStyleModel } from "../executive-style-learning-engine/types.js";
import { ConsistencyMetadataGenerator } from "./consistency-metadata-generator.js";
import type { ConsistencyFinding, ConsistencyStrength } from "./types.js";
import type { VisualConsistencyConfiguration } from "./configuration.js";

const TABLE_TYPES = new Set(["table", "list"]);
const CARD_TYPES = new Set(["card", "panel"]);
const MODAL_TYPES = new Set(["modal", "dialog"]);

export class PatternConsistencyChecker {
  private readonly metadata = new ConsistencyMetadataGenerator();

  check(
    components: UiComponent[],
    layout: LayoutModel | null,
    layoutEvaluation: LayoutEvaluationModel | null,
    executiveStyle: ExecutiveStyleModel | null,
    accessibilityReview: AccessibilityReviewRecord | null,
    config: VisualConsistencyConfiguration,
  ): { findings: ConsistencyFinding[]; strengths: ConsistencyStrength[] } {
    if (!config.patternConsistencyRulesEnabled) {
      return { findings: [], strengths: [] };
    }

    const findings: ConsistencyFinding[] = [];
    const strengths: ConsistencyStrength[] = [];
    const now = new Date().toISOString();
    const visible = components.filter((c) => c.visibility === "visible");

    const tables = visible.filter((c) => TABLE_TYPES.has(c.componentType));
    if (tables.length >= 2) {
      const widths = tables.map((t) => t.size.width);
      const spread = Math.max(...widths) - Math.min(...widths);
      if (spread > config.sizingTolerancePx * 5) {
        findings.push(
          this.metadata.enrichFinding({
            findingId: this.metadata.buildFindingId("tables"),
            findingCategory: "tables",
            findingDescription: "Table components have inconsistent widths",
            severity: "warning",
            affectedComponentId: tables[0]!.componentId,
            affectedLayoutRegionId: tables[0]!.sourceRegionId,
            affectedNavigationNodeId: null,
            expectedPattern: "consistent table width",
            observedPattern: `width spread ${spread}px`,
            evidenceMetadata: { tableCount: tables.length },
            detectionConfidence: 0.65,
            timestamp: now,
            metadataVersion: "1.0.0",
          }),
        );
      }
    }

    const cards = visible.filter((c) => CARD_TYPES.has(c.componentType));
    if (cards.length >= 2) {
      const heights = cards.map((c) => c.size.height);
      const spread = Math.max(...heights) - Math.min(...heights);
      if (spread > config.sizingTolerancePx * 4) {
        findings.push(
          this.metadata.enrichFinding({
            findingId: this.metadata.buildFindingId("cards"),
            findingCategory: "cards",
            findingDescription: "Card components have inconsistent heights",
            severity: "warning",
            affectedComponentId: cards[0]!.componentId,
            affectedLayoutRegionId: cards[0]!.sourceRegionId,
            affectedNavigationNodeId: null,
            expectedPattern: "consistent card height",
            observedPattern: `height spread ${spread}px`,
            evidenceMetadata: { cardCount: cards.length },
            detectionConfidence: 0.65,
            timestamp: now,
            metadataVersion: "1.0.0",
          }),
        );
      } else {
        strengths.push({
          strengthId: this.metadata.buildStrengthId(),
          category: "cards",
          description: `Consistent card sizing across ${cards.length} cards`,
          affectedComponentIds: cards.map((c) => c.componentId),
          evidenceRef: "card-pattern-check",
          confidence: 0.7,
        });
      }
    }

    const modals = visible.filter((c) => MODAL_TYPES.has(c.componentType));
    const modalRegions = layout?.regions.filter((r) =>
      r.regionType === "modal" || r.regionType === "dialog",
    ) ?? [];
    if (modals.length > 0 || modalRegions.length > 0) {
      if (modals.some((m) => m.size.width < 200 || m.size.height < 100)) {
        findings.push(
          this.metadata.enrichFinding({
            findingId: this.metadata.buildFindingId("modals"),
            findingCategory: "modals",
            findingDescription: "Modal/dialog dimensions below expected minimum pattern",
            severity: "info",
            affectedComponentId: modals[0]?.componentId ?? null,
            affectedLayoutRegionId: modalRegions[0]?.regionId ?? null,
            affectedNavigationNodeId: null,
            expectedPattern: "adequate modal dimensions",
            observedPattern: "undersized modal",
            evidenceMetadata: {},
            detectionConfidence: 0.55,
            timestamp: now,
            metadataVersion: "1.0.0",
          }),
        );
      }
    }

    const drawerRegions = layout?.regions.filter((r) =>
      r.regionType === "drawer" || r.regionType === "sidebar",
    ) ?? [];
    if (drawerRegions.length > 1) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("drawers"),
          findingCategory: "drawers",
          findingDescription: "Multiple drawer/side-panel regions may indicate inconsistent drawer patterns",
          severity: "info",
          affectedComponentId: null,
          affectedLayoutRegionId: drawerRegions[0]!.regionId,
          affectedNavigationNodeId: null,
          expectedPattern: "single drawer pattern per workflow",
          observedPattern: `${drawerRegions.length} drawer regions`,
          evidenceMetadata: { drawerCount: drawerRegions.length },
          detectionConfidence: 0.5,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    const loadingFindings =
      accessibilityReview?.accessibilityFindings.filter(
        (f) => f.findingCategory === "loading_states",
      ) ?? [];
    for (const af of loadingFindings) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("loading_states"),
          findingCategory: "loading_states",
          findingDescription: `Loading state inconsistency: ${af.findingDescription}`,
          severity: "info",
          affectedComponentId: af.affectedComponentId,
          affectedLayoutRegionId: af.affectedLayoutRegionId,
          affectedNavigationNodeId: af.affectedNavigationNodeId,
          expectedPattern: "consistent loading indicator",
          observedPattern: af.findingDescription,
          evidenceMetadata: { accessibilityFindingId: af.findingId },
          detectionConfidence: af.detectionConfidence,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    const emptyFindings =
      accessibilityReview?.accessibilityFindings.filter(
        (f) => f.findingCategory === "empty_states",
      ) ?? [];
    for (const af of emptyFindings) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("empty_states"),
          findingCategory: "empty_states",
          findingDescription: `Empty state inconsistency: ${af.findingDescription}`,
          severity: "info",
          affectedComponentId: af.affectedComponentId,
          affectedLayoutRegionId: af.affectedLayoutRegionId,
          affectedNavigationNodeId: af.affectedNavigationNodeId,
          expectedPattern: "consistent empty state pattern",
          observedPattern: af.findingDescription,
          evidenceMetadata: { accessibilityFindingId: af.findingId },
          detectionConfidence: af.detectionConfidence,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    const interactionDeviations =
      layoutEvaluation?.designSystemDeviations.filter((d) =>
        d.category.toLowerCase().includes("interaction"),
      ) ?? [];
    for (const dev of interactionDeviations) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("interaction_states"),
          findingCategory: "interaction_states",
          findingDescription: dev.description,
          severity: dev.severity,
          affectedComponentId: dev.componentId,
          affectedLayoutRegionId: null,
          affectedNavigationNodeId: null,
          expectedPattern: dev.expected,
          observedPattern: dev.observed,
          evidenceMetadata: { deviationId: dev.deviationId },
          detectionConfidence: 0.7,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    if (executiveStyle && executiveStyle.preferredConsistencyRules.length > 0) {
      strengths.push({
        strengthId: this.metadata.buildStrengthId(),
        category: "interaction_states",
        description: `${executiveStyle.preferredConsistencyRules.length} executive consistency rules available`,
        affectedComponentIds: [],
        evidenceRef: executiveStyle.executiveStyleId,
        confidence: executiveStyle.confidenceScore / 100,
      });
    }

    return { findings, strengths };
  }
}
