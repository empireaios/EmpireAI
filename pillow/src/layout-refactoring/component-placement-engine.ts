/** T3-03 — Plans component placement within refactored layouts. */

import type { ComponentGenerationRecord } from "../component-generator/types.js";
import type { LayoutRefactoringConfiguration } from "./configuration.js";
import type { ComponentPlacement, LayoutScope } from "./types.js";
import type { TargetLayoutPlan } from "./target-layout-planner.js";
import { appendRefactoringLog } from "./refactoring-logging.js";

export class ComponentPlacementEngine {
  buildPlacementMap(
    plan: TargetLayoutPlan,
    relatedComponents: ComponentGenerationRecord[],
    config: LayoutRefactoringConfiguration,
  ): ComponentPlacement[] {
    if (!config.componentPlacementRulesEnabled) return [];

    appendRefactoringLog({
      event: "component_placement",
      level: "info",
      details: `Placing ${relatedComponents.length} components in ${plan.scope}`,
    });

    const region = this.primaryRegion(plan.scope);
    const placements: ComponentPlacement[] = relatedComponents
      .filter((c) => c.generationStatus === "validated" || c.generationStatus === "generated")
      .slice(0, 5)
      .map((c, index) => ({
        placementId: `place-${c.componentGenerationId}`,
        componentName: c.componentName,
        region,
        order: index + 1,
        responsiveBehavior: index === 0 ? "full-width" : "stack-on-sm",
      }));

    if (placements.length === 0) {
      placements.push({
        placementId: `place-default-${plan.scope}`,
        componentName: "PlatformPanel",
        region,
        order: 1,
        responsiveBehavior: "full-width",
      });
    }

    return placements;
  }

  private primaryRegion(scope: LayoutScope): string {
    const regionMap: Partial<Record<LayoutScope, string>> = {
      header: "header-region",
      sidebar: "sidebar-region",
      navigation_area: "nav-region",
      toolbar: "toolbar-region",
      filter_area: "filter-region",
      search_area: "search-region",
      form: "form-region",
      table: "table-region",
      dashboard: "dashboard-grid",
      modal: "modal-body",
      drawer: "drawer-body",
    };
    return regionMap[scope] ?? "main-content-region";
  }
}
