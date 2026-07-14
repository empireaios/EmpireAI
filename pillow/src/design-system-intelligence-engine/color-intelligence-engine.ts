/** T2-02 — Color standards intelligence. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { ColorToken } from "./types.js";

export class ColorIntelligenceEngine {
  learn(repositoryRoot: string, tokenSource: string): ColorToken[] {
    const palette: ColorToken[] = [
      {
        tokenId: "color-background",
        name: "Background",
        value: "#030303",
        role: "background",
        usage: "Application background",
      },
      {
        tokenId: "color-foreground",
        name: "Foreground",
        value: "#f5f0e6",
        role: "foreground",
        usage: "Primary text color",
      },
      {
        tokenId: "color-gold",
        name: "Gold Accent",
        value: "#d4af37",
        role: "accent",
        usage: "Brand accent and highlights",
      },
      {
        tokenId: "color-gold-light",
        name: "Gold Light",
        value: "#f0d78c",
        role: "accent",
        usage: "Light accent variant",
      },
      {
        tokenId: "color-gold-dark",
        name: "Gold Dark",
        value: "#9a7b1a",
        role: "accent",
        usage: "Dark accent variant",
      },
    ];

    const path = join(repositoryRoot, tokenSource);
    if (!existsSync(path)) return palette;

    try {
      const css = readFileSync(path, "utf8");
      const extract = (varName: string): string | null => {
        const match = css.match(new RegExp(`${varName}:\\s*([^;\\n]+)`));
        return match?.[1]?.trim() ?? null;
      };
      const background = extract("--background");
      const foreground = extract("--foreground");
      const gold = extract("--gold");
      if (background) palette[0]!.value = background;
      if (foreground) palette[1]!.value = foreground;
      if (gold) palette[2]!.value = gold;
    } catch {
      /* use defaults */
    }

    return palette;
  }
}
