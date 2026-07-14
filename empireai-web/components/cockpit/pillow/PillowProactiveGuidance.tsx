"use client";

import type { PillowGuidanceItem } from "@/lib/pillow-ux/types";

const KIND_COLORS: Record<PillowGuidanceItem["kind"], string> = {
  recommendation: "border-[#d4af37]/30 bg-gold/5 text-[#f0d78c]",
  warning: "border-amber-500/30 bg-amber-500/5 text-amber-100",
  risk: "border-red-500/30 bg-red-500/5 text-red-200",
  opportunity: "border-emerald-500/30 bg-emerald-500/5 text-emerald-200",
  recovery: "border-orange-500/30 bg-orange-500/5 text-orange-100",
  mission: "border-blue-500/30 bg-blue-500/5 text-blue-100",
};

export function PillowProactiveGuidance({
  items,
  onAsk,
}: {
  items: PillowGuidanceItem[];
  onAsk: (prompt: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-[#6f6a60]">
        Proactive Guidance
      </p>
      {items.map((item) => (
        <details
          key={item.id}
          className={`rounded-lg border px-3 py-2 text-xs ${KIND_COLORS[item.kind]}`}
        >
          <summary className="cursor-pointer font-medium">{item.title}</summary>
          <div className="mt-2 space-y-1.5 text-[11px] text-[#c8c0b0]">
            <p><span className="text-[#6f6a60]">WHY:</span> {item.why}</p>
            <p><span className="text-[#6f6a60]">WHAT:</span> {item.what}</p>
            <p><span className="text-[#6f6a60]">HOW:</span> {item.how}</p>
            {item.proof && <p><span className="text-[#6f6a60]">PROOF:</span> {item.proof}</p>}
            {item.expectedBenefit && (
              <p><span className="text-[#6f6a60]">Benefit:</span> {item.expectedBenefit}</p>
            )}
            {item.suggestedPrompt && (
              <button
                type="button"
                className="mt-1 text-[#d4af37] hover:underline"
                onClick={() => onAsk(item.suggestedPrompt!)}
              >
                Ask Pillow →
              </button>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
