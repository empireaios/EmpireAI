/** T2-04 — Information organization evaluation. */

import type { ComponentRecognitionResult } from "../component-recognition-engine/types.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import { EvaluationMetadataGenerator } from "./evaluation-metadata-generator.js";
import type { LayoutFinding } from "./types.js";

export class InformationOrganizationEvaluator {
  private readonly metadata = new EvaluationMetadataGenerator();

  evaluate(
    layout: LayoutModel | null,
    recognition: ComponentRecognitionResult | null,
  ): LayoutFinding[] {
    if (!layout) return [];

    const findings: LayoutFinding[] = [];
    const groups = layout.groupingRelationships;

    if (groups.length >= 2) {
      findings.push({
        findingId: this.metadata.buildFindingId("information_grouping"),
        category: "information_grouping",
        kind: "strength",
        description: `${groups.length} information groups organize related components`,
        severity: "info",
        evidenceRef: layout.metadata.layoutId,
        confidence: 0.75,
      });
    }

    const components = recognition?.components ?? [];
    const forms = components.filter(
      (c) => c.componentType === "form" || c.componentType === "text_field",
    );
    if (forms.length >= 2) {
      findings.push({
        findingId: this.metadata.buildFindingId("form_layout"),
        category: "form_layout",
        kind: "strength",
        description: `${forms.length} form-related components detected`,
        severity: "info",
        evidenceRef: recognition?.metadata.recognitionId ?? layout.metadata.layoutId,
        confidence: 0.7,
      });
    }

    const tables = components.filter((c) => c.componentType === "table");
    if (tables.length > 0) {
      findings.push({
        findingId: this.metadata.buildFindingId("table_layout"),
        category: "table_layout",
        kind: "strength",
        description: `${tables.length} table component(s) in layout`,
        severity: "info",
        evidenceRef: recognition?.metadata.recognitionId ?? layout.metadata.layoutId,
        confidence: 0.75,
      });
    }

    const cards = components.filter((c) => c.componentType === "card" || c.componentType === "panel");
    if (cards.length >= 2) {
      findings.push({
        findingId: this.metadata.buildFindingId("card_layout"),
        category: "card_layout",
        kind: "strength",
        description: `${cards.length} card/panel components provide structured content blocks`,
        severity: "info",
        evidenceRef: recognition?.metadata.recognitionId ?? layout.metadata.layoutId,
        confidence: 0.7,
      });
    }

    const dashboards = layout.regions.filter(
      (r) => r.regionType === "sidebar" || r.regionType === "main_content",
    );
    if (dashboards.length >= 2 && cards.length >= 2) {
      findings.push({
        findingId: this.metadata.buildFindingId("dashboard_organization"),
        category: "dashboard_organization",
        kind: "strength",
        description: "Dashboard-style organization with sidebar and content cards",
        severity: "info",
        evidenceRef: layout.metadata.layoutId,
        confidence: 0.65,
      });
    }

    const mapped = Object.keys(layout.componentToRegion).length;
    const total = components.length;
    if (total > 0 && mapped < total * 0.5) {
      findings.push({
        findingId: this.metadata.buildFindingId("component_organization"),
        category: "component_organization",
        kind: "weakness",
        description: `Only ${mapped}/${total} components mapped to layout regions`,
        severity: "warning",
        evidenceRef: layout.metadata.layoutId,
        confidence: 0.6,
      });
    } else if (mapped > 0) {
      findings.push({
        findingId: this.metadata.buildFindingId("component_organization"),
        category: "component_organization",
        kind: "strength",
        description: `${mapped} components organized within layout regions`,
        severity: "info",
        evidenceRef: layout.metadata.layoutId,
        confidence: 0.7,
      });
    }

    const breakpoints = layout.responsiveBreakpoints.filter((b) => b.matched);
    if (breakpoints.length > 0) {
      findings.push({
        findingId: this.metadata.buildFindingId("responsive_layout"),
        category: "responsive_layout",
        kind: "strength",
        description: `${breakpoints.length} responsive breakpoint(s) matched`,
        severity: "info",
        evidenceRef: layout.metadata.layoutId,
        confidence: 0.65,
      });
    }

    return findings;
  }
}
