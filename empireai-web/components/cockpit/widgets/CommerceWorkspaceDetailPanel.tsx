"use client";

import Link from "next/link";
import { Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { StatusBadge } from "./shared/statusBadges";
import { LegacyReadUnavailable } from "./LegacyReadUnavailable";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";

type Company = { id: string; name: string; category: string; status: string; revenue: string; margin: string; agents: number };

/** Resolve only records returned to the authenticated session, never the demo catalogue. */
export function CommerceWorkspaceDetailPanel({ companyId }: { companyId: string }) {
  const { data, loading, error, reload } = useBrainModule<{ companies: Company[] }>("store");
  if (loading) return <Panel title="Business workspace">Loading saved workspace…</Panel>;
  // Do not retain a previously visible record after an access denial.
  if (error) return <LegacyReadUnavailable title="Business workspace" error={error} href="/cockpit/commerce/workspace" onRetry={()=>void reload()} />;
  const company = data?.companies.find(item => item.id === companyId);
  return <div className="space-y-6">
    <Link href="/cockpit/commerce/workspace" className="inline-block underline">← Back to workspace</Link>
    {!company ? <Panel title="Workspace unavailable"><p>No matching workspace was returned for this session. No record or business state is inferred.</p></Panel> : <>
      <Panel title={company.name} subtitle="Saved workspace · read-only">
        <p>{company.category}</p><StatusBadge status={company.status} />
        <p className="mt-3">These are saved portfolio observations, not independent proof of current sales or completion.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button disabled>Open store</button><button disabled>Launch centre</button><button disabled>Approve next gate</button>
        </div>
        <p>Operational actions are unavailable in this read-only workspace. Commerce remains locked.</p>
      </Panel>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Recorded revenue" value={company.revenue || "—"} change="Saved observation" trend="neutral" />
        <StatCard label="Recorded margin" value={company.margin || "—"} change="Saved observation" trend="neutral" />
        <StatCard label="Assigned agents" value={Number.isFinite(company.agents)?String(company.agents):"—"} change="Saved observation" trend="neutral" />
      </div>
      <details><summary>Workspace record</summary><p>Workspace ID: {company.id}</p><p>No dated milestone evidence is supplied by this record.</p></details>
    </>}
  </div>;
}
