/** T3-02 — Component props and interface generation. */

import type { ComponentCategory } from "./types.js";
import type { ComponentGeneratorConfiguration } from "./configuration.js";
import { appendGenerationLog } from "./generation-logging.js";

export class ComponentInterfaceGenerator {
  generate(
    componentName: string,
    category: ComponentCategory,
    config: ComponentGeneratorConfiguration,
  ): string {
    if (!config.propsRulesEnabled) {
      return `export type ${componentName}Props = Record<string, unknown>;`;
    }

    appendGenerationLog({
      event: "interface_generation",
      level: "info",
      details: `Generating interface for ${componentName}`,
    });

    const extraProps = this.categoryProps(category);
    return [
      `export type ${componentName}Props = {`,
      `  title?: string;`,
      `  description?: string;`,
      `  className?: string;`,
      ...extraProps.map((p) => `  ${p}`),
      `};`,
    ].join("\n");
  }

  private categoryProps(category: ComponentCategory): string[] {
    switch (category) {
      case "button":
        return ["onClick?: () => void;", "disabled?: boolean;", "variant?: \"default\" | \"compact\";"];
      case "form":
        return ["onSubmit?: (data: Record<string, string>) => void;"];
      case "table":
        return ["rows?: Record<string, unknown>[];", "columns?: { key: string; header: string }[];"];
      case "modal":
      case "drawer":
        return ["open?: boolean;", "onClose?: () => void;"];
      case "loading_state":
      case "empty_state":
      case "error_state":
        return ["message?: string;"];
      default:
        return ["children?: React.ReactNode;"];
    }
  }
}
