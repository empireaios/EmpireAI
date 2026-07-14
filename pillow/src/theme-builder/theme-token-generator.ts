/** T3-04 — Aggregates all theme tokens. */

import type { ThemeToken } from "./types.js";

export class ThemeTokenGenerator {
  aggregate(tokens: ThemeToken[][]): ThemeToken[] {
    const seen = new Set<string>();
    const result: ThemeToken[] = [];
    for (const group of tokens) {
      for (const token of group) {
        if (seen.has(token.tokenId)) continue;
        seen.add(token.tokenId);
        result.push(token);
      }
    }
    return result;
  }
}
