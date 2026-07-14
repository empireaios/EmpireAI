/** T5-03 — Converts T5-02 audit issues into improvement opportunities. */

import type { UxAuditRecord } from "../autonomous-ux-audit-engine/types.js";
import {
  defaultComplexityForCategory,
  mapIssueCategoryToOpportunity,
} from "./opportunity-metadata-generator.js";
import { impactFromSeverity } from "./ux-prioritization-engine.js";
import type { OpportunityCategory, RawOpportunityCandidate } from "./types.js";

function fromAuditIssues(
  audit: UxAuditRecord | null,
  categoryFilter: (cat: OpportunityCategory) => boolean,
): RawOpportunityCandidate[] {
  if (!audit) return [];
  return audit.detectedUxIssues
    .map((issue) => {
      const category = mapIssueCategoryToOpportunity(issue.category);
      if (!categoryFilter(category)) return null;
      return {
        category,
        summary: `Improve ${category.replace(/_/g, " ")}: ${issue.description}`,
        expectedBenefit: `Resolving ${issue.category} improves UX quality and reduces friction`,
        complexity: defaultComplexityForCategory(category),
        evidenceReferences: [issue.evidenceReference],
        confidenceScore: issue.detectionConfidence,
        impactScore: impactFromSeverity(issue.severity),
        sourceEngine: issue.sourceEngine,
      } satisfies RawOpportunityCandidate;
    })
    .filter((c): c is RawOpportunityCandidate => c !== null);
}

export class LayoutOpportunityDetector {
  detect(audit: UxAuditRecord | null): RawOpportunityCandidate[] {
    return fromAuditIssues(audit, (c) =>
      ["layout_improvement", "readability_improvement", "information_hierarchy_improvement"].includes(c),
    );
  }
}

export class ComponentOpportunityDetector {
  detect(audit: UxAuditRecord | null): RawOpportunityCandidate[] {
    return fromAuditIssues(audit, (c) => c === "component_improvement");
  }
}

export class NavigationOpportunityDetector {
  detect(audit: UxAuditRecord | null): RawOpportunityCandidate[] {
    return fromAuditIssues(audit, (c) => c === "navigation_improvement");
  }
}

export class WorkflowOpportunityDetector {
  detect(audit: UxAuditRecord | null): RawOpportunityCandidate[] {
    return fromAuditIssues(audit, (c) => c === "workflow_improvement");
  }
}

export class AccessibilityOpportunityDetector {
  detect(audit: UxAuditRecord | null): RawOpportunityCandidate[] {
    return fromAuditIssues(audit, (c) =>
      ["accessibility_improvement", "readability_improvement", "feedback_improvement"].includes(c),
    );
  }
}

export class InteractionOpportunityDetector {
  detect(audit: UxAuditRecord | null): RawOpportunityCandidate[] {
    return fromAuditIssues(audit, (c) =>
      ["performance_related_ux_improvement", "interaction_improvement"].includes(c),
    );
  }
}
