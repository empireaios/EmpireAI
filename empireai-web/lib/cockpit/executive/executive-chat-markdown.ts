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
/** Mid-paragraph next section: "…. 3. Heading" (not "are 0. Focus") */
const INLINE_OL_SPLIT =
  /(?<=[.!?…])[ \t]+(?=[1-9]\d?[.)]\s+(?:\*\*[A-Za-z]|[A-Z]))/;

/**
 * Split a string that may contain inline numbered section markers into
 * leading body + subsequent "N. rest" chunks (each chunk starts with a marker).
 */
export function splitInlineOrderedMarkers(text: string): string[] {
  const raw = String(text || "");
  if (!INLINE_OL_SPLIT.test(raw) && !/\s\d{1,2}[.)]\s+\S/.test(raw)) {
    return [raw];
  }
  // Normalize inline markers onto line starts, then split by lines.
  const normalized = raw
    .replace(/([.!?…])[ \t]+([1-9]\d?[.)]\s+(?:\*\*[A-Za-z]|[A-Z]))/g, "$1\n$2")
    .replace(/([.!?…])[ \t]+([A-E][.)]\s+(?:\*\*[A-Za-z]|[A-Z]))/g, "$1\n$2");
  const lines = normalized.split("\n");
  const chunks: string[] = [];
  let buf: string[] = [];
  for (const line of lines) {
    if (OL_MARKER.test(line) && buf.length > 0) {
      chunks.push(buf.join("\n").trim());
      buf = [line];
    } else {
      buf.push(line);
    }
  }
  if (buf.length) chunks.push(buf.join("\n").trim());
  return chunks.filter(Boolean);
}

/**
 * Count inline "text. N. Next" occurrences (certification oracle).
 */
export function countInlineNextSectionOccurrences(source: string): number {
  const t = String(source || "");
  const a = t.match(/[.!?…][ \t]+[1-9]\d?[.)]\s+(?:\*\*[A-Za-z]|[A-Z])/g) || [];
  return a.length;
}

/**
 * Parse executive Markdown into blocks.
 * Loose numbered lists (blank lines / body between items) stay ONE ordered list
 * so browser CSS numbering is sequential (1/2/3…), not reset 1/1/1…
 * Inline "…. 3. Heading" is split into separate list items.
 */
export function parseExecutiveChatBlocks(source: string): ExecutiveChatBlock[] {
  // Pre-normalize inline section markers so line-based parsing sees them.
  // Only after sentence punctuation into 1-99. / 1-99) + capital/bold heading.
  const normalized = String(source || "")
    .replace(/\r\n/g, "\n")
    .replace(/([.!?…])[ \t]+([1-9]\d?[.)]\s+(?:\*\*[A-Za-z]|[A-Z]))/g, "$1\n\n$2")
    .replace(/([.!?…])[ \t]+([A-E][.)]\s+(?:\*\*[A-Za-z]|[A-Z]))/g, "$1\n\n$2");
  const lines = normalized.split("\n");
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
          // If a continuation line itself embeds a later section marker, split it out.
          const split = splitInlineOrderedMarkers(nxt);
          if (split.length > 1 && OL_MARKER.test(split[1] ?? "")) {
            bodyParts.push(split[0]!);
            // Push remaining marker lines back for outer loop by splicing into lines array.
            const rest = split.slice(1);
            lines.splice(i + 1, 0, ...rest);
            i += 1;
            break;
          }
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
    const para = parts.join(" ").replace(/\s+/g, " ").trim();
    const paraSplit = splitInlineOrderedMarkers(para);
    if (paraSplit.length > 1 && OL_MARKER.test(paraSplit[1] ?? "")) {
      if (paraSplit[0] && !OL_MARKER.test(paraSplit[0])) {
        blocks.push({ type: "p", text: paraSplit[0] });
      }
      // Re-queue remaining as synthetic lines for ol parsing.
      const restLines = paraSplit
        .slice(OL_MARKER.test(paraSplit[0] ?? "") ? 0 : 1)
        .flatMap((c) => c.split("\n"));
      lines.splice(i, 0, "", ...restLines);
      continue;
    }
    blocks.push({ type: "p", text: para });
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
