"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copies only the owner-visible answer, preserving its paragraphs and tables. */
export function CopyPillowAnswer({ content }: { content: string }) {
  const [result, setResult] = useState<{ content: string; ok: boolean } | null>(null);
  const current = result?.content === content ? result : null;
  if (!content.trim()) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(content);
      setResult({ content, ok: true });
    } catch {
      setResult({ content, ok: false });
    }
  }

  return (
    <span className="mt-2 inline-flex items-center gap-2">
      <button type="button" onClick={() => void copy()}
        aria-label="Copy Pillow answer" title="Copy Pillow answer"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-[#b6a987] hover:bg-white/5 hover:text-[#f0d78c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4af37]">
        {current?.ok ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      </button>
      <span role="status" className="text-xs text-[#b6a987]">
        {current ? (current.ok ? "Copied" : "Copy unavailable. Select the answer text to copy.") : ""}
      </span>
    </span>
  );
}
