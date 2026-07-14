/** T3-03 — Builds responsive layout structure rules. */

import type { LayoutRefactoringConfiguration } from "./configuration.js";
import type { LayoutScope } from "./types.js";
import { appendRefactoringLog } from "./refactoring-logging.js";

export class ResponsiveStructureBuilder {
  build(
    scope: LayoutScope,
    config: LayoutRefactoringConfiguration,
  ): string[] {
    appendRefactoringLog({
      event: "responsive_structure",
      level: "info",
      details: `Building responsive rules for ${scope}`,
    });

    const breakpoints = config.responsiveBreakpointRules;
    const base = [
      "flex flex-col w-full",
      "gap-4 md:gap-6",
      ...config.spacingRules.slice(0, 2).map((s) => `responsive-${s}`),
    ];

    const scopeRules: Partial<Record<LayoutScope, string[]>> = {
      dashboard: [
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        "auto-rows-min",
      ],
      table: ["overflow-x-auto", "min-w-0"],
      form: ["grid grid-cols-1 md:grid-cols-2", "gap-4"],
      sidebar: ["hidden md:flex", "flex-col", "w-64"],
      navigation_area: ["flex flex-wrap", "gap-2"],
      modal: ["max-w-lg mx-auto", "p-6"],
      drawer: ["fixed inset-y-0 right-0", "w-full sm:w-96"],
    };

    return [
      ...base,
      ...(scopeRules[scope] ?? ["max-w-7xl mx-auto px-4"]),
      ...breakpoints.map((bp) => `breakpoint:${bp}`),
    ];
  }
}
