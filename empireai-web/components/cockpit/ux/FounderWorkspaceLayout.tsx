"use client";

import Link from "next/link";
import { useFounderShell } from "@/lib/founder-shell/FounderShellProvider";
import { getCockpitCentreById } from "@/lib/cockpit-ux/navigation";
import { CockpitPageHeader } from "@/components/cockpit/layout/CockpitPageHeader";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

export function FounderWorkspaceLayout({
  centreId,
  title,
  subtitle,
  children,
}: {
  centreId: Parameters<typeof getCockpitCentreById>[0];
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { activeNavId, data, loading } = useFounderShell();
  const centre = getCockpitCentreById(centreId);
  const shellHealth = data?.founderShellEngine.cockpit.shellHealth ?? "—";

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <CockpitPageHeader
        eyebrow={`Executive Cockpit · ${centre?.label ?? title}`}
        title={title}
        dataMode="live"
      />
      {(subtitle ?? centre?.description) && (
        <p className="text-sm text-[#8a847a]">{subtitle ?? centre?.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gold/10 bg-white/[0.02] px-4 py-2 text-xs text-[#8a847a]">
        <DataModeBadge mode="live" />
        <span>Shell health: {shellHealth}</span>
        <span>Active workspace: {activeNavId.replace(/_/g, " ")}</span>
        {loading && <span>Syncing…</span>}
        <Link href={centre?.href ?? "/cockpit"} className="ml-auto text-[#d4af37] hover:underline">
          ← Executive Home
        </Link>
      </div>
      {children}
    </div>
  );
}
