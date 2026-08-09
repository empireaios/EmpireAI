"use client";

import Link from "next/link";
import { useExecutiveHome } from "@/lib/cockpit/hooks/useExecutiveHome";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

/** Single authoritative Grand King attention surface (canonical truth). */
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
      aria-label="Grand King attention"
      className="rounded-xl border border-gold/30 bg-gradient-to-br from-gold/[0.1] via-black/50 to-transparent px-5 py-4"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d4af37]">
            Grand King Attention
          </p>
          <h2 className="mt-1 font-display text-xl text-[#f0d78c]">
            {items.length === 0 ? "No action required." : items[0]?.title}
          </h2>
        </div>
        <DataModeBadge mode="live" />
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[#c8c0b0]">
          EmpireAI and Pillow can continue autonomously. No owner decision is pending.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-gold/10 bg-black/30 px-3 py-2"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#6f6a60]">
                    {item.priority.replace(/_/g, " ")}
                  </p>
                  <p className="text-sm font-medium text-[#f0d78c]">{item.title}</p>
                  <p className="mt-1 text-xs text-[#8a847a]">{item.detail}</p>
                </div>
                {item.href && (
                  <Link href={item.href} className="shrink-0 text-xs text-[#d4af37] hover:underline">
                    Open →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
