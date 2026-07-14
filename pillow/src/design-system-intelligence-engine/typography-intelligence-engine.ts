/** T2-02 — Typography standards intelligence. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { TypographyStandard } from "./types.js";

export class TypographyIntelligenceEngine {
  learn(repositoryRoot: string, tokenSource: string): TypographyStandard[] {
    const standards: TypographyStandard[] = [
      {
        tokenId: "typography-body",
        name: "Body",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 16,
        fontWeight: 400,
        lineHeight: 1.5,
        usage: "Default body text",
      },
      {
        tokenId: "typography-display",
        name: "Display",
        fontFamily: "Cormorant, Times New Roman, serif",
        fontSize: 32,
        fontWeight: 600,
        lineHeight: 1.2,
        usage: "Headings and display text",
      },
      {
        tokenId: "typography-label",
        name: "Label",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 14,
        fontWeight: 500,
        lineHeight: 1.4,
        usage: "Form labels and captions",
      },
    ];

    const path = join(repositoryRoot, tokenSource);
    if (!existsSync(path)) return standards;

    try {
      const css = readFileSync(path, "utf8");
      if (css.includes("--font-sans") || css.includes("font-inter")) {
        standards[0]!.fontFamily = "var(--font-inter), system-ui, sans-serif";
      }
      if (css.includes("--font-display") || css.includes("font-cormorant")) {
        standards[1]!.fontFamily = 'var(--font-cormorant), "Times New Roman", serif';
      }
    } catch {
      /* use defaults */
    }

    return standards;
  }
}
