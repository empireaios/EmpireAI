"use client";

import Link from "next/link";
import { useExecutiveHome } from "@/lib/cockpit/hooks/useExecutiveHome";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import {
  attentionPriorityLabel,
  scrubMachineLanguage,
} from "@/lib/cockpit/executive/executive-presentation";

/** Pillow Needs Your Attention — decision-first Grand King surface. */
export function GrandKingAttentionPanel() {
  const { data, loading } = useExecutiveHome();
  const truth = data?.canonicalTruth;
  const items = truth?.grandKingAttention ?? [];

  if (loading && !truth) {
    return <div className="h-28 animate-pulse rounded-xl border border-gold/10 bg-white/[0.02]" />;
  }

  return (
    <section
      id="grand-king-attention"
      aria-label="Pillow needs your attention"
      className="rounded-xl border border-gold/30 bg-gradient-to-br from-gold/[0.1] via-black/50 to-transparent px-4 py-3"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d4af37]">
            Pillow needs your attention
          </p>
          <h2 className="mt-1 font-display text-xl text-[#f0d78c]">
            {items.length === 0
              ? "Nothing requires you right now."
              : scrubMachineLanguage(items[0]?.title ?? "Attention required")}
          </h2>
          <p className="mt-1 text-xs text-[#8a847a]">
            {items.length === 0
              ? "Pillow can continue within authority. Check what changed below when you return."
              : `${items.length} item${items.length === 1 ? "" : "s"} · most urgent first`}
          </p>
        </div>
        <DataModeBadge mode="live" />
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[#c8c0b0]">
          No owner decision is pending. Pillow remains subordinate to Cost Guard and governance.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const severity = attentionPriorityLabel(item.priority);
            const detail = scrubMachineLanguage(item.detail);
            const decision =
              item.priority === "money_approval" || item.priority === "commercial_opportunity";
            return (
              <li
                key={item.id}
                className="rounded-lg border border-gold/10 bg-black/30 px-3 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#d4af37]">
                      {severity}
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#f0d78c]">
                      {scrubMachineLanguage(item.title)}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#8a847a]">{detail}</p>
                    <p className="mt-2 text-xs text-[#c8c0b0]">
                      {decision
                        ? "What you need to do: review the opportunity, then approve or reject in the approval queue — or ask Pillow to explain."
                        : "What you need to do: open the related surface or ask Pillow what changed."}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    {decision && (
                      <a
                        href="#commerce-decision-workspace"
                        className="text-xs text-[#d4af37] hover:underline"
                      >
                        Review decision →
                      </a>
                    )}
                    {decision && (
                      <a
                        href="#executive-pillow-anchor"
                        className="text-xs text-[#8a847a] hover:underline"
                      >
                        Ask Pillow →
                      </a>
                    )}
                    {item.href && !decision && (
                      <Link href={item.href} className="text-xs text-[#d4af37] hover:underline">
                        Open →
                      </Link>
                    )}
                  </div>
                </div>
                {item.engineeringId && (
                  <details className="mt-2 text-[10px] text-[#5a564e]">
                    <summary className="cursor-pointer">Technical details</summary>
                    <p className="mt-1 font-mono">{item.engineeringId}</p>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
