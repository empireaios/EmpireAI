"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useEnterpriseConstitutionalGuardian } from "@/lib/enterprise-constitutional-guardian/useEnterpriseConstitutionalGuardian";

/** Compact Enterprise Constitutional Guardian strip for Executive Home. */
export function EnterpriseConstitutionalGuardianStrip() {
  const { view, loading, live } = useEnterpriseConstitutionalGuardian();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Enterprise Constitutional Guardian…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E5-13 Constitutional Guardian</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/enterprise-constitutional-guardian" className="text-xs text-[#d4af37] hover:underline">
          Guardian panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Constitution Health</p>
          <p className="text-sm text-[#d4af37]">{view.constitutionHealthScore}/100</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Protected Assets</p>
          <p className="text-sm text-rose-300">{view.protectedAssetCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Active Violations</p>
          <p className="text-sm text-[#e8e0d0]">{view.activeViolationCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Status</p>
          <p className="text-sm text-[#e8e0d0]">{view.constitutionHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E5-13 — Permanent Enterprise Constitutional Guardian panel. */
export function EnterpriseConstitutionalGuardianDashboard() {
  const { view, loading, error, reload, live, data } = useEnterpriseConstitutionalGuardian();

  if (loading && !view) {
    return <Panel title="Enterprise Constitutional Guardian">Loading constitutional guardian…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Enterprise Constitutional Guardian" subtitle="E5-13 · Constitutional Protection">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-rose-500/50 bg-gradient-to-br from-rose-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E5-13 Enterprise Constitutional Guardian</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE514 && (
            <Link href="/cockpit/founder/executive-resilience-engine" className="text-xs text-[#d4af37] hover:underline">
              Ready for E5-14 →
            </Link>
          )}
          <Link href="/cockpit/founder/executive-trust-engine" className="text-xs text-[#d4af37] hover:underline">
            E5-12 Trust Engine →
          </Link>
          <Link href="/cockpit/founder/executive-policy-evolution" className="text-xs text-[#d4af37] hover:underline">
            E5-11 Policy Evolution →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Constitution Health" value={`${view.constitutionHealthScore}/100`} />
        <StatCard label="Protected Assets" value={String(view.protectedAssetCount)} />
        <StatCard label="Active Violations" value={String(view.activeViolationCount)} />
        <StatCard label="Resolved Events" value={String(view.resolvedEventCount)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Unresolved Critical" value={String(view.unresolvedCriticalCount)} />
        <StatCard label="Engine Health" value={view.engineHealth} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
      </div>

      <Panel title="Constitution Health">
        <DataTable
          columns={[
            { key: "domain", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.constitutionHealthEntries}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Protected Assets">
          <DataTable
            columns={[
              { key: "assetName", header: "Asset" },
              { key: "category", header: "Category" },
              { key: "protectionLevel", header: "Level" },
              { key: "status", header: "Status" },
            ]}
            rows={view.protectedAssets}
          />
        </Panel>

        <Panel title="Constitution Violations">
          <DataTable
            columns={[
              { key: "protectedAsset", header: "Asset" },
              { key: "detectedThreat", header: "Threat" },
              { key: "severity", header: "Severity" },
              { key: "status", header: "Status" },
            ]}
            rows={view.constitutionViolations}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Repository Integrity">
          <DataTable
            columns={[
              { key: "domain", header: "Domain" },
              { key: "score", header: "Score" },
              { key: "buildStatus", header: "Build" },
              { key: "status", header: "Status" },
            ]}
            rows={view.repositoryIntegrity}
          />
        </Panel>

        <Panel title="Architecture Integrity">
          <DataTable
            columns={[
              { key: "domain", header: "Domain" },
              { key: "score", header: "Score" },
              { key: "canonicalCompliance", header: "Compliance" },
              { key: "status", header: "Status" },
            ]}
            rows={view.architectureIntegrity}
          />
        </Panel>
      </div>

      <Panel title="Protection Events">
        <DataTable
          columns={[
            { key: "protectedAsset", header: "Asset" },
            { key: "event", header: "Event" },
            { key: "severity", header: "Severity" },
            { key: "actionTaken", header: "Action" },
          ]}
          rows={view.protectionEvents}
        />
      </Panel>

      <Panel title="Guardian Protection Register">
        <DataTable
          columns={[
            { key: "protectedAsset", header: "Asset" },
            { key: "detectedThreat", header: "Threat" },
            { key: "severity", header: "Severity" },
            { key: "currentStatus", header: "Status" },
            { key: "confidence", header: "Confidence" },
          ]}
          rows={view.guardianProtectionRegister}
        />
      </Panel>

      <Panel title="Constitutional Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.constitutionalAnalysis}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Constitutional Guardian Pipeline">
          <DataTable
            columns={[
              { key: "label", header: "Phase" },
              { key: "order", header: "Order" },
              { key: "status", header: "Status" },
            ]}
            rows={view.constitutionalGuardianPipeline}
          />
        </Panel>

        <Panel title="Background Monitoring">
          <div className="space-y-2 text-sm text-[#c8c0b0]">
            <p>Status: {view.monitoringStatus.backgroundMonitoring}</p>
            <p>Total events: {view.monitoringStatus.totalProtectionEvents}</p>
            <p>Active violations: {view.monitoringStatus.activeViolations}</p>
            <p>Constitution health: {view.monitoringStatus.constitutionHealthScore}/100</p>
            <p>Last scan: {new Date(view.monitoringStatus.lastScanAt).toLocaleString()}</p>
          </div>
        </Panel>
      </div>

      <Panel title="Executive Recommendations">
        <div className="space-y-4">
          {view.recommendedActions.map((rec) => (
            <div key={rec.id} className="rounded-lg border border-gold/20 px-4 py-3">
              <p className="font-medium text-[#d4af37]">{rec.title}</p>
              <p className="mt-1 text-sm text-[#c8c0b0]">{rec.why}</p>
              <p className="mt-1 text-xs text-[#8a847a]">
                {rec.what} · Confidence {rec.confidencePercent}%
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Pillow Advisory">
        <ul className="list-inside list-disc space-y-1 text-sm text-[#c8c0b0]">
          {view.pillowAdvisory.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Panel>

      <Panel title="E5 Integration Status">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(view.integrations).map(([key, value]) => (
            <div key={key} className="rounded border border-gold/10 px-3 py-2 text-xs">
              <p className="text-[#6f6a60]">{key}</p>
              <p className="text-[#e8e0d0]">{value}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
