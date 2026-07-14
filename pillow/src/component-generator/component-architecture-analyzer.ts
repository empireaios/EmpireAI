/** T3-02 — Maps requirements to component architecture targets. */

import type { RecommendationCategory } from "../recommendation-engine/types.js";
import type { ComponentRequirement } from "./component-requirement-interpreter.js";
import type { ComponentCategory } from "./types.js";
import type { ComponentGeneratorConfiguration } from "./configuration.js";

const CATEGORY_MAP: Partial<Record<RecommendationCategory, ComponentCategory>> = {
  component_improvement: "panel",
  form_usability_improvement: "form",
  card_improvement: "card",
  table_improvement: "table",
  modal_improvement: "modal",
  drawer_improvement: "drawer",
  loading_state_improvement: "loading_state",
  empty_state_improvement: "empty_state",
  error_state_improvement: "error_state",
  dashboard_improvement: "dashboard_widget",
  design_system_alignment: "badge",
  accessibility_improvement: "button",
  visual_consistency_improvement: "panel",
};

export class ComponentArchitectureAnalyzer {
  resolveCategory(requirement: ComponentRequirement): ComponentCategory {
    return (
      CATEGORY_MAP[requirement.recommendation.recommendationCategory] ?? "panel"
    );
  }

  resolveComponentName(requirement: ComponentRequirement, category: ComponentCategory): string {
    const title = requirement.recommendation.recommendationTitle
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .trim();
    const words = title.split(/\s+/).filter(Boolean).slice(0, 4);
    const base = words.length > 0 ? words.join("") : category;
    return `${base.charAt(0).toUpperCase()}${base.slice(1)}${this.categorySuffix(category)}`;
  }

  resolveTargetFiles(
    componentName: string,
    category: ComponentCategory,
    config: ComponentGeneratorConfiguration,
  ): string[] {
    const dir = config.allowedTargetDirectories[0] ?? "empireai-web/components/generated";
    const fileName = `${componentName}.tsx`;
    const path = `${dir}/${fileName}`;
    if (config.allowedTargetDirectories.some((d) => path.startsWith(d))) {
      return [path];
    }
    return [`empireai-web/components/generated/${fileName}`];
  }

  private categorySuffix(category: ComponentCategory): string {
    const suffixes: Partial<Record<ComponentCategory, string>> = {
      button: "Button",
      input: "Input",
      form: "Form",
      card: "Card",
      table: "Table",
      modal: "Modal",
      drawer: "Drawer",
      panel: "Panel",
      badge: "Badge",
      loading_state: "LoadingState",
      empty_state: "EmptyState",
      error_state: "ErrorState",
      dashboard_widget: "Widget",
    };
    return suffixes[category] ?? "Component";
  }
}
