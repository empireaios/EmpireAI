import type { ScreenCatalogEntry, UxDesignIntent, UxDesignProposal, UxEngineeringSpec } from "./types.js";
import { buildEngineeringSpec } from "./spec-generator.js";

export function generateDesignProposals(
  intent: UxDesignIntent,
  screen: ScreenCatalogEntry | null,
): UxDesignProposal[] {
  const baseStyle = intent.styleHint && intent.styleHint !== "custom" ? intent.styleHint : "empire_gold";

  const options: Array<{ id: "A" | "B" | "C"; styleKey: string; name: string; desc: string }> = [
    {
      id: "A",
      styleKey: baseStyle,
      name: "Recommended — matches request",
      desc: "Primary interpretation of the King's natural language request",
    },
    {
      id: "B",
      styleKey: baseStyle === "empire_gold" ? "premium_minimal" : "empire_gold",
      name: "Conservative — Empire Gold baseline",
      desc: "Minimal diff preserving Grand King gold executive identity",
    },
    {
      id: "C",
      styleKey: intent.styleHint === "futuristic_neon" ? "apple_clean" : "futuristic_neon",
      name: "Bold alternative",
      desc: "Higher visual impact with distinct trade-offs",
    },
  ];

  return options.map((opt) => {
    const spec = buildEngineeringSpec(intent, screen, opt.styleKey);
    return {
      optionId: opt.id,
      name: opt.name,
      description: opt.desc,
      advantages: advantagesFor(opt.id, spec),
      tradeoffs: tradeoffsFor(opt.id, spec),
      spec,
    };
  });
}

function advantagesFor(optionId: "A" | "B" | "C", spec: UxEngineeringSpec): string[] {
  if (optionId === "A") {
    return [
      "Directly addresses King's stated intent",
      `Touches ${spec.requiredFiles.length} files — focused scope`,
      "Preserves existing component hierarchy",
    ];
  }
  if (optionId === "B") {
    return [
      "Lowest regression risk",
      "Maintains established executive brand",
      "Smallest Cursor diff",
    ];
  }
  return [
    "Distinct visual differentiation",
    "May improve engagement for specific workflows",
    "Useful if King wants exploration before committing",
  ];
}

function tradeoffsFor(optionId: "A" | "B" | "C", spec: UxEngineeringSpec): string[] {
  if (optionId === "A") {
    return ["May require globals.css token updates", "Needs visual QA on all affected routes"];
  }
  if (optionId === "B") {
    return ["May not fully satisfy bold style requests", "Less dramatic visual change"];
  }
  return [
    "Higher deviation from Empire Gold brand",
    "More extensive QA across departments",
    "Potential accessibility review needed",
  ];
}
