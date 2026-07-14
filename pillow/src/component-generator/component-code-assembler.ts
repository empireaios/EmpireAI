/** T3-02 — Assembles generated component source code. */

import type { ComponentRequirement } from "./component-requirement-interpreter.js";
import type { ComponentCategory, ComponentState, ComponentVariant } from "./types.js";
import { appendGenerationLog } from "./generation-logging.js";

export class ComponentCodeAssembler {
  assemble(input: {
    componentName: string;
    category: ComponentCategory;
    requirement: ComponentRequirement;
    propsInterface: string;
    variants: ComponentVariant[];
    states: ComponentState[];
    styling: string[];
    designConstraints: string[];
    executiveConstraints: string[];
  }): { code: string; usageExamples: string[] } {
    appendGenerationLog({
      event: "component_generation",
      level: "info",
      details: `Assembling ${input.componentName} (${input.category})`,
    });

    const className = input.styling.join(" ");
    const variantProp = input.variants.length > 1 ? "variant?: \"default\" | \"compact\";" : "";

    const code = [
      `"use client";`,
      ``,
      `import { Panel } from "@/components/platform/ui/PlatformPrimitives";`,
      ``,
      input.propsInterface,
      ``,
      `/** T3-02 Component Generator — ${input.requirement.recommendation.recommendationTitle} */`,
      `export function ${input.componentName}(props: ${input.componentName}Props) {`,
      `  const { title = "${input.requirement.recommendation.recommendationTitle.replace(/"/g, "'")}", description, className } = props;`,
      `  return (`,
      `    <Panel title={title} className={\`${className} \${className ?? ""}\`}>`,
      `      <p className="text-sm text-muted-foreground">{description ?? "${input.requirement.recommendation.recommendationDescription.slice(0, 80).replace(/"/g, "'")}"}</p>`,
      `    </Panel>`,
      `  );`,
      `}`,
      ``,
      `// Design: ${input.designConstraints[0] ?? "PlatformPrimitives"}`,
      `// Executive: ${input.executiveConstraints[0] ?? "default density"}`,
      `// States: ${input.states.map((s) => s.stateName).join(", ")}`,
      variantProp ? `// Variants: ${input.variants.map((v) => v.variantName).join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const usageExamples = [
      `import { ${input.componentName} } from "@/components/generated/${input.componentName}";`,
      `<${input.componentName} title="Example" description="${input.requirement.recommendation.expectedUxBenefit.slice(0, 60).replace(/"/g, "'")}" />`,
    ];

    return { code, usageExamples };
  }
}
