/** T3-03 — Generates refactored layout code. */

import type { LayoutRequirement } from "./layout-requirement-interpreter.js";
import type { TargetLayoutPlan } from "./target-layout-planner.js";
import type { ComponentPlacement } from "./types.js";
import type { DesignSystemLayoutConstraints } from "./design-system-constraint-engine.js";
import type { ExecutiveLayoutConstraints } from "./executive-preference-constraint-engine.js";
import { appendRefactoringLog } from "./refactoring-logging.js";

export class LayoutCodeGenerator {
  generate(input: {
    requirement: LayoutRequirement;
    plan: TargetLayoutPlan;
    placements: ComponentPlacement[];
    responsiveRules: string[];
    designConstraints: DesignSystemLayoutConstraints;
    executiveConstraints: ExecutiveLayoutConstraints;
  }): string {
    appendRefactoringLog({
      event: "layout_code_generation",
      level: "info",
      details: `Generating layout code for ${input.plan.scope}`,
    });

    const layoutName = this.buildLayoutName(input.plan.scope, input.requirement);
    const placementJsx = input.placements
      .map(
        (p) =>
          `        <div key="${p.placementId}" data-region="${p.region}" className="order-${p.order} ${p.responsiveBehavior}">\n          {/* ${p.componentName} */}\n        </div>`,
      )
      .join("\n");

    const responsiveClasses = input.responsiveRules
      .filter((r) => !r.startsWith("breakpoint:") && !r.startsWith("responsive-"))
      .slice(0, 4)
      .join(" ");

    return `"use client";

import { Panel } from "@/components/platform/ui/PlatformPrimitives";

/**
 * Refactored layout — ${input.requirement.recommendation.recommendationTitle}
 * Scope: ${input.plan.scope}
 * Density: ${input.executiveConstraints.densityPreference}
 */
export function ${layoutName}() {
  return (
    <div className="${responsiveClasses}" data-layout-scope="${input.plan.scope}">
      <header className="flex items-center justify-between gap-4 p-4 border-b border-border">
        <h2 className="text-lg font-semibold">${input.requirement.recommendation.recommendationTitle}</h2>
      </header>
      <main className="flex flex-col gap-4 p-4 md:p-6">
${placementJsx}
        <Panel title="Refactored Region" description="${input.requirement.recommendation.recommendationDescription.slice(0, 80)}">
          <p className="text-sm text-muted-foreground">Layout refactored per approved UX recommendation.</p>
        </Panel>
      </main>
    </div>
  );
}
`;
  }

  private buildLayoutName(scope: string, requirement: LayoutRequirement): string {
    const title = requirement.recommendation.recommendationTitle
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .trim();
    const words = title.split(/\s+/).filter(Boolean).slice(0, 3);
    const base = words.length > 0 ? words.join("") : scope;
    return `${base.charAt(0).toUpperCase()}${base.slice(1)}Layout`;
  }
}
