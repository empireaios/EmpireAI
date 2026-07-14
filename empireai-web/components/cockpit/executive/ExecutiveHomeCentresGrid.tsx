"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useExecutiveHome } from "@/lib/cockpit/hooks/useExecutiveHome";

function CentreLink({ href, title, children }: { href: string; title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-gold/15 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-lg text-[#f0d78c]">{title}</h3>
        <div className="flex items-center gap-3">
          {title === "Mission Centre" && (
            <Link href="/cockpit/founder/live-eta" className="text-xs text-[#d4af37] hover:underline">
              Live ETA →
            </Link>
          )}
          {title === "Business Centre" && (
            <>
              <Link href="/cockpit/commerce/factory" className="text-xs text-[#d4af37] hover:underline">
                Business Factory →
              </Link>
              <Link href="/cockpit/commerce/operating" className="text-xs text-[#d4af37] hover:underline">
                Commerce →
              </Link>
            </>
          )}
          <Link href={href} className="text-xs text-[#d4af37] hover:underline">
            Open centre →
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-2 border-b border-gold/5 py-1.5 text-sm last:border-0">
      <span className="text-[#8a847a]">{label}</span>
      <span className="text-right text-[#e8e0d0]">{value}</span>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-sm text-[#6f6a60]">None</p>;
  return (
    <ul className="space-y-1 text-sm text-[#c8c0b0]">
      {items.map((item) => (
        <li key={item}>◆ {item}</li>
      ))}
    </ul>
  );
}

/** P7-04 — Mission · Pillow · Business · Production centre previews. */
export function ExecutiveHomeCentresGrid() {
  const { data, loading } = useExecutiveHome();
  const centres = data?.centreSummaries;

  if (loading && !centres) {
    return <div className="h-64 animate-pulse rounded-xl border border-gold/10 bg-white/[0.02]" />;
  }

  if (!centres) return null;

  return (
    <section id="executive-centres" aria-label="Executive centres" className="grid gap-4 lg:grid-cols-2">
      <CentreLink href={centres.mission.href} title="Mission Centre">
        <Row label="Current Mission" value={centres.mission.currentMission} />
        <Row label="Owner" value={centres.mission.missionOwner} />
        <Row label="Progress" value={`${centres.mission.progress}%`} />
        <Row label="ETA" value={centres.mission.eta} />
        <Row label="Validation" value={centres.mission.validationStatus} />
        <Row label="Recovery" value={centres.mission.recoveryStatus} />
        {centres.mission.currentRisks.length > 0 && (
          <div className="mt-2">
            <p className="text-[10px] uppercase text-[#6f6a60]">Risks</p>
            <BulletList items={centres.mission.currentRisks} />
          </div>
        )}
      </CentreLink>

      <CentreLink href="/cockpit" title="Pillow Centre">
        <BulletList items={centres.pillow.recommendations.slice(0, 3)} />
        <div className="mt-3 space-y-2">
          <p className="text-[10px] uppercase text-[#6f6a60]">Vision</p>
          <p className="text-sm text-[#c8c0b0]">{centres.pillow.visionAlignment}</p>
        </div>
        {centres.pillow.commercialOpportunities.length > 0 && (
          <div className="mt-2">
            <p className="text-[10px] uppercase text-[#6f6a60]">Commercial</p>
            <BulletList items={centres.pillow.commercialOpportunities.slice(0, 2)} />
          </div>
        )}
      </CentreLink>

      <CentreLink href={centres.business.href} title="Business Centre">
        <Row label="Active Businesses" value={centres.business.activeBusinesses} />
        <Row label="Revenue" value={centres.business.revenue} />
        <Row label="Orders" value={centres.business.orders} />
        <Row label="Profit" value={centres.business.profit} />
        <Row label="Marketing" value={centres.business.marketingPerformance} />
        <Row label="Health" value={centres.business.businessHealth} />
        <Row label="Trend" value={centres.business.growthTrend} />
      </CentreLink>

      <CentreLink href={centres.production.href} title="Production Centre">
        <Row label="Production" value={centres.production.productionHealth} />
        <Row label="Runtime" value={centres.production.runtimeHealth} />
        <Row label="Guardian" value={centres.production.guardianStatus} />
        <Row label="Deployment" value={centres.production.deploymentStatus} />
        <Row label="Infrastructure" value={centres.production.infrastructure} />
        {centres.production.currentIncidents.length > 0 ? (
          <div className="mt-2">
            <p className="text-[10px] uppercase text-[#6f6a60]">Incidents</p>
            <BulletList items={centres.production.currentIncidents.slice(0, 3)} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-emerald-300/90">No active incidents</p>
        )}
      </CentreLink>
    </section>
  );
}
