"use client";

import Link from "next/link";
import { DataModeBadge, CockpitHealthBadge } from "@/components/cockpit/ui";
import { CockpitExplainButton } from "@/components/cockpit/interaction/CockpitInteractionDrawer";
import { isLiveWidgetData, widgetDataModeLabel } from "@/lib/cockpit/executive-widgets";
import type { ExecutiveSummaryCard } from "@/lib/cockpit/panel-types";

/** G4-06 — shared contract: live runtime data or Status / Dependency / Next Action. */
export function ExecutiveLiveWidgetFrame({ card }: { card: ExecutiveSummaryCard }) {
  const showLive = isLiveWidgetData(card);

  const body = (
    <div className="flex h-full flex-col rounded-xl border border-gold/10 bg-white/[0.02] p-4 transition hover:border-gold/20">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6f6a60]">
            {card.title}
          </p>
          <p className="mt-0.5 text-[9px] text-[#5a554d]">{card.widgetId}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {card.health && <CockpitHealthBadge health={card.health} />}
          <DataModeBadge mode={card.dataMode === "unavailable" ? "demo" : card.dataMode} />
          <CockpitExplainButton label={card.title} targetId={card.id} value={card.primaryValue ?? undefined} />
        </div>
      </div>

      {showLive ? (
        <>
          <p className="font-display text-2xl text-[#f0d78c]">{card.primaryValue}</p>
          <p className="mt-2 text-sm text-[#8a847a]">{card.status}</p>
          {card.items.length > 0 && (
            <ul className="mt-3 space-y-1.5 border-t border-gold/10 pt-3 text-xs">
              {card.items.slice(0, 3).map((item) => (
                <li key={`${item.label}-${item.value}`} className="flex justify-between gap-2">
                  <span className="text-[#6f6a60]">{item.label}</span>
                  <span className="truncate text-right text-[#c8c0b0]">{item.value}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-auto pt-3 text-xs text-[#d4af37]">{card.nextAction}</p>
          {card.engineCenterId && (
            <p className="mt-1 text-[10px] text-[#6f6a60]">Engine Center · {card.engineCenterId}</p>
          )}
        </>
      ) : (
        <div className="space-y-2 text-sm">
          <div>
            <p className="text-[10px] uppercase text-[#6f6a60]">Status</p>
            <p className="text-[#c8c0b0]">{card.status}</p>
          </div>
          {card.dependency && (
            <div>
              <p className="text-[10px] uppercase text-[#6f6a60]">Dependency</p>
              <p className="text-[#8a847a]">{card.dependency}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] uppercase text-[#6f6a60]">Next Action</p>
            <p className="text-[#d4af37]">{card.nextAction}</p>
          </div>
          <p className="pt-2 text-[10px] text-[#5a554d]">
            {widgetDataModeLabel(card.dataMode)} · refreshes every {card.refreshSeconds}s
          </p>
        </div>
      )}
    </div>
  );

  if (card.href) {
    return (
      <Link href={card.href} className="block h-full">
        {body}
      </Link>
    );
  }
  return body;
}
