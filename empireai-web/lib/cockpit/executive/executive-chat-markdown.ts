/** Pure helpers for Pillow chat Markdown detection/parsing (no React). */

/** True when content likely contains Markdown worth structured rendering. */
export function looksLikeMarkdown(text: string): boolean {
  return /(\*\*[^*]+\*\*|^#{1,3}\s+\S|^\s*[-*]\s+\S|^\s*(?:\d+|[A-E])[.)]\s+\S)/m.test(
    text,
  );
}

export type ExecutiveChatBlock =
  | { type: "p"; text: string }
  | { type: "h"; level: 1 | 2 | 3; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

const OL_MARKER = /^\s*((?:\d+)|[A-E])[.)]\s+(.*)$/;

/**
 * Parse executive Markdown into blocks.
 * Loose numbered lists (blank lines / body between items) stay ONE ordered list
 * so browser CSS numbering is sequential (1/2/3…), not reset 1/1/1…
 */
export function parseExecutiveChatBlocks(source: string): ExecutiveChatBlock[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ExecutiveChatBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (!line.trim()) {
      i += 1;
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      blocks.push({
        type: "h",
        level: Math.min(3, heading[1]!.length) as 1 | 2 | 3,
        text: heading[2]!.trim(),
      });
      i += 1;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*[-*]\s+/, "").trim());
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }
    if (OL_MARKER.test(line)) {
      const items: string[] = [];
      while (i < lines.length) {
        while (i < lines.length && !(lines[i] ?? "").trim()) i += 1;
        if (i >= lines.length) break;
        const cur = lines[i] ?? "";
        const marker = OL_MARKER.exec(cur);
        if (!marker) break;
        if (/^(#{1,3})\s+/.test(cur)) break;
        const bodyParts: string[] = [marker[2]!.trim()];
        i += 1;
        while (i < lines.length) {
          const nxt = lines[i] ?? "";
          if (!nxt.trim()) {
            let j = i + 1;
            while (j < lines.length && !(lines[j] ?? "").trim()) j += 1;
            const peek = lines[j] ?? "";
            if (OL_MARKER.test(peek) || /^(#{1,3})\s+/.test(peek)) break;
            bodyParts.push("");
            i += 1;
            continue;
          }
          if (OL_MARKER.test(nxt) || /^(#{1,3})\s+/.test(nxt)) break;
          bodyParts.push(nxt);
          i += 1;
        }
        items.push(bodyParts.join("\n").replace(/\n{3,}/g, "\n\n").trim());
      }
      if (items.length > 0) blocks.push({ type: "ol", items });
      continue;
    }
    const parts: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      (lines[i] ?? "").trim() &&
      !/^(#{1,3})\s+/.test(lines[i] ?? "") &&
      !/^\s*[-*]\s+/.test(lines[i] ?? "") &&
      !OL_MARKER.test(lines[i] ?? "")
    ) {
      parts.push(lines[i] ?? "");
      i += 1;
    }
    blocks.push({ type: "p", text: parts.join(" ").replace(/\s+/g, " ").trim() });
  }
  return blocks;
}

/** Count top-level ordered list items after parsing (for UX certification). */
export function countTopLevelOrderedItems(source: string): number {
  const blocks = parseExecutiveChatBlocks(source);
  return blocks.filter((b) => b.type === "ol").reduce((n, b) => n + b.items.length, 0);
}

export function countOrderedListBlocks(source: string): number {
  return parseExecutiveChatBlocks(source).filter((b) => b.type === "ol").length;
}
