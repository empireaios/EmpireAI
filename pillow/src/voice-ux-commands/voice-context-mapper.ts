/** T4-02 — Maps voice commands to T1 UI context, T2 findings, T3 builder capabilities. */

import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { AutonomousBuilderCertificationEngine } from "../autonomous-builder-certification-engine/engine.js";
import type { VoiceUxCommandsConfiguration } from "./configuration.js";
import type { ParsedVoiceIntent } from "./voice-ux-intent-parser.js";
import { appendVoiceCommandLog } from "./voice-command-logging.js";

export type VoiceContextMapping = {
  currentScreenId: string | null;
  currentRouteOrViewId: string | null;
  referencedComponentIds: string[];
  referencedLayoutRegionIds: string[];
  referencedNavigationNodes: string[];
  linkedUxFindingIds: string[];
  linkedBuilderCapabilities: string[];
};

const BUILDER_CAPABILITY_MAP: Record<string, string[]> = {
  layout_change_request: ["layout_refactoring", "frontend_builder"],
  component_change_request: ["component_generator", "frontend_builder"],
  navigation_concern: ["layout_refactoring", "frontend_builder"],
  workflow_concern: ["frontend_builder", "layout_refactoring"],
  theme_preference: ["theme_builder"],
  preview_request: ["preview_generator"],
  validation_request: ["validation_engine"],
  accessibility_concern: ["validation_engine", "component_generator"],
  visual_consistency_concern: ["theme_builder", "validation_engine"],
  design_preference: ["theme_builder", "component_generator"],
  ux_complaint: ["validation_engine", "frontend_builder"],
  ux_question: [],
  general_ux_discussion: ["frontend_builder"],
};

const COMPONENT_PATTERN = /\b(?:button|modal|drawer|card|table|form|input|menu|sidebar|header|footer)\b/gi;
const REGION_PATTERN = /\b(?:header|footer|sidebar|main|content|toolbar|nav)\b/gi;

export class VoiceContextMapper {
  map(input: {
    normalizedText: string;
    parsed: ParsedVoiceIntent;
    config: VoiceUxCommandsConfiguration;
    uiStateMapper: UiStateMapperEngine | null;
    recommendationEngine: RecommendationEngine | null;
    autonomousBuilderCertification: AutonomousBuilderCertificationEngine | null;
  }): VoiceContextMapping {
    appendVoiceCommandLog({
      event: "screen_context_mapping",
      level: "info",
      details: "Mapping voice command to UI / UX / builder context",
    });

    let currentScreenId: string | null = null;
    let currentRouteOrViewId: string | null = null;
    const referencedComponentIds: string[] = [];
    const referencedLayoutRegionIds: string[] = [];
    const referencedNavigationNodes: string[] = [];
    const linkedUxFindingIds: string[] = [];
    const linkedBuilderCapabilities: string[] = [];

    if (input.config.screenReferenceRulesEnabled && input.uiStateMapper) {
      try {
        const state = input.uiStateMapper.getLatestState?.() ?? null;
        if (state?.screen) {
          currentScreenId = state.screen.screenId ?? null;
          currentRouteOrViewId = state.metadata?.sessionId
            ? `session:${state.metadata.sessionId}`
            : currentScreenId;
          for (const region of state.screen.regions?.slice(0, 8) ?? []) {
            if (region.regionId) referencedLayoutRegionIds.push(region.regionId);
          }
        }
      } catch {
        appendVoiceCommandLog({
          event: "screen_context_mapping",
          level: "warn",
          details: "UI context unavailable",
        });
      }
    }

    const components = input.normalizedText.match(COMPONENT_PATTERN) ?? [];
    for (const c of components) {
      referencedComponentIds.push(c.toLowerCase());
    }
    const regions = input.normalizedText.match(REGION_PATTERN) ?? [];
    for (const r of regions) {
      referencedLayoutRegionIds.push(r.toLowerCase());
    }
    if (/\bnav(?:igation)?\b/i.test(input.normalizedText)) {
      referencedNavigationNodes.push("navigation");
    }

    if (input.config.uxFindingLinkageRulesEnabled && input.recommendationEngine) {
      try {
        const report = input.recommendationEngine.getLatestReport?.() ?? null;
        const proposals =
          (report as { record?: { proposals?: Array<{ recommendationId?: string }> } })?.record
            ?.proposals ?? [];
        for (const p of proposals.slice(0, 5)) {
          if (p.recommendationId) linkedUxFindingIds.push(p.recommendationId);
        }
        appendVoiceCommandLog({
          event: "ux_finding_linkage",
          level: "info",
          details: `Linked ${linkedUxFindingIds.length} UX finding(s)`,
        });
      } catch {
        appendVoiceCommandLog({
          event: "ux_finding_linkage",
          level: "warn",
          details: "UX intelligence data unavailable",
        });
      }
    }

    if (input.config.builderCapabilityLinkageRulesEnabled) {
      const caps = BUILDER_CAPABILITY_MAP[input.parsed.voiceCommandType] ?? [];
      linkedBuilderCapabilities.push(...caps);
      if (input.autonomousBuilderCertification) {
        try {
          void input.autonomousBuilderCertification.getState();
          appendVoiceCommandLog({
            event: "builder_capability_linkage",
            level: "info",
            details: `Linked ${linkedBuilderCapabilities.length} builder capability(ies)`,
          });
        } catch {
          appendVoiceCommandLog({
            event: "builder_capability_linkage",
            level: "warn",
            details: "Builder certification status unavailable",
          });
        }
      }
    }

    return {
      currentScreenId,
      currentRouteOrViewId,
      referencedComponentIds: [...new Set(referencedComponentIds)],
      referencedLayoutRegionIds: [...new Set(referencedLayoutRegionIds)],
      referencedNavigationNodes: [...new Set(referencedNavigationNodes)],
      linkedUxFindingIds,
      linkedBuilderCapabilities: [...new Set(linkedBuilderCapabilities)],
    };
  }
}
