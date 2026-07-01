"use client";

import Link from "next/link";
import {
  ActionButton,
  Badge,
  Panel,
  StatCard,
} from "@/components/platform/ui/PlatformPrimitives";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import {
  COMMERCE_WORKSPACE_DETAIL_MILESTONES,
  getCommerceWorkspaceCompany,
} from "@/components/cockpit/widgets/commerce/commerceWorkspaceDemoData";
import { COCKPIT_BASE } from "@/lib/cockpit/types";

type CommerceWorkspaceDetailPanelProps = {
  companyId: string;
};

/** SCR-204 detail — Business workspace company view (presentation-only demo). */
export function CommerceWorkspaceDetailPanel({ companyId }: CommerceWorkspaceDetailPanelProps) {
  const company = getCommerceWorkspaceCompany(companyId);

  if (!company) {
    return (
      <div className="rounded-xl border border-gold/10 bg-white/[0.02] px-6 py-8">
        <p className="text-sm text-[#8a847a]">Company not found in demo portfolio.</p>
        <Link
          href={`${COCKPIT_BASE}/commerce/workspace`}
          className="mt-4 inline-block text-sm text-[#d4af37] hover:underline"
        >
          ← Back to workspace
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={`${COCKPIT_BASE}/commerce/workspace`}
        className="text-xs uppercase tracking-[0.15em] text-[#6f6a60] hover:text-[#d4af37]"
      >
        ← Business Workspace
      </Link>

      <div className="rounded-xl border border-gold/20 bg-white/[0.02] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="gold">{company.niche}</Badge>
            <h2 className="mt-2 font-display text-2xl text-[#f0d78c]">{company.name}</h2>
            <p className="text-sm text-[#8a847a]">{company.agent} · demo presentation mode</p>
          </div>
          <StatusBadge status={company.status} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton variant="secondary" disabled>
            Open store
          </ActionButton>
          <ActionButton variant="secondary" disabled>
            Launch centre
          </ActionButton>
          <ActionButton disabled>Approve next gate</ActionButton>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Revenue" value={company.revenue} change="Demo ledger" trend="neutral" />
        <StatCard label="Build progress" value={`${company.buildProgress}%`} change="Manufacturing" trend="up" />
        <StatCard label="Workspace ID" value={company.id} change="Detail route" trend="neutral" />
      </div>

      <Panel title="Company Milestones" subtitle="Discovery → Build → Launch → Live">
        <div className="space-y-4">
          {COMMERCE_WORKSPACE_DETAIL_MILESTONES.map((step) => (
            <div key={step.label}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-[#c8c0b0]">{step.label}</span>
                <StatusBadge status={step.status} />
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#b8922a] to-[#d4af37]"
                  style={{ width: `${step.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
