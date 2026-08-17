/** Pure helpers for Pillow chat Markdown detection (no React). */

/** True when content likely contains Markdown worth structured rendering. */
export function looksLikeMarkdown(text: string): boolean {
  return /(\*\*[^*]+\*\*|^#{1,3}\s+\S|^\s*[-*]\s+\S|^\s*(?:\d+|[A-E])[.)]\s+\S)/m.test(
    text,
  );
}
