"use client";

import { useState } from "react";
import { ActionButton, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { CockpitPageHeader } from "@/components/cockpit/layout/CockpitPageHeader";
import { CockpitEmptyState, CockpitErrorState, CockpitLoadingState } from "@/components/cockpit/ui/CockpitStates";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import { getCockpitScreenDataMode } from "@/lib/cockpit/kpis/registry";
import type { AuthorizationCentreDetailView, AuthorizationCentreView } from "@/lib/cockpit/panel-types";
import { brainDispatch } from "@/lib/brain/client";

/** SCR-304 — Authorization Centre (Brain-only — G8-00 through G8-04 aggregation). */
export function AuthorizationCentrePanel() {
  const { data, loading, error, reload } = useBrainModule<AuthorizationCentreView>("cockpit-authorization-centre");
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const detail = useBrainModule<AuthorizationCentreDetailView & { found?: boolean }>(
    "cockpit-authorization-centre",
    "load_detail",
    {
      enabled: Boolean(selectedProviderId),
      payload: selectedProviderId ? { providerId: selectedProviderId } : undefined,
    },
  );

  if (loading) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <CockpitPageHeader
          eyebrow="Operations"
          title="Authorization Centre"
          dataMode={getCockpitScreenDataMode("SCR-304")}
        />
        <CockpitLoadingState message="Loading Authorization Centre from Brain…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <CockpitPageHeader
          eyebrow="Operations"
          title="Authorization Centre"
          dataMode={getCockpitScreenDataMode("SCR-304")}
        />
        <CockpitErrorState message="Authorization Centre unavailable via Brain" onRetry={() => void reload()} />
      </div>
    );
  }

  async function executeAction(action: string, providerId: string, extra?: Record<string, unknown>) {
    setActionMessage(null);
    const result = (await brainDispatch({
      module: "cockpit-authorization-centre",
      action: "execute_action",
      payload: {
        action,
        providerId,
        workspaceId: data!.workspaceId,
        actorId: "grand-king",
        ownerId: "grand-king",
        accountHolderId: "grand-king",
        ...extra,
      },
    })) as { success?: boolean; reason?: string };
    setActionMessage(result.success ? `${action} completed` : (result.reason ?? "Action failed"));
    void reload();
    if (selectedProviderId === providerId) detail.reload();
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6" aria-label="Authorization Centre">
      <CockpitPageHeader
        eyebrow="Operations"
        title="Authorization Centre"
        dataMode={getCockpitScreenDataMode("SCR-304")}
      />
      <p className="text-sm text-[#8a847a]">
        Executive control surface for external accounts, OAuth connections, API credentials, and connection health —
        all data via Pillow-governed Brain tools. No secrets exposed.
      </p>

      {actionMessage ? (
        <p className="rounded-lg border border-[#2a2824] bg-[#1a1917] px-3 py-2 text-sm text-[#c9c4b8]" role="status">
          {actionMessage}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" role="region" aria-label="Authorization readiness KPIs">
        <StatCard label="Overall Readiness" value={`${data.overview.overallReadinessPercent}%`} trend="neutral" />
        <StatCard label="Connected" value={String(data.overview.connectedProviders)} trend="neutral" />
        <StatCard label="Missing Credentials" value={String(data.overview.missingCredentials)} trend="neutral" />
        <StatCard label="Reconnect Required" value={String(data.overview.reconnectRequired)} trend="neutral" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Disconnected" value={String(data.overview.disconnectedProviders)} trend="neutral" />
        <StatCard label="Expired" value={String(data.overview.expiredAuthorizations)} trend="neutral" />
        <StatCard label="Missing Permissions" value={String(data.overview.missingPermissions)} trend="neutral" />
      </div>

      {data.attentionItems.length > 0 ? (
        <Panel title="Executive Attention Items" subtitle="Requires review">
          <ul className="space-y-2" aria-label="Executive attention items">
            {data.attentionItems.map((item) => (
              <li
                key={item.attentionId}
                className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-[#f0d78c]"
              >
                <strong>{item.providerId}</strong>: {item.message}
                {item.requiredAction ? ` — ${item.requiredAction}` : ""}
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <Panel title="Executive Attention Items">
          <CockpitEmptyState title="No connections require immediate executive attention." />
        </Panel>
      )}

      <Panel title="Provider Health Matrix" subtitle="Registry-driven health across all providers">
        <DataTable
          keyField="id"
          data={data.providerMatrix.map((row) => ({
            id: row.providerId,
            displayName: row.displayName,
            status: row.status,
            severity: row.severity,
            checkCount: String(row.checkCount),
          }))}
          columns={[
            { key: "displayName", header: "Provider" },
            { key: "status", header: "Status" },
            { key: "severity", header: "Severity" },
            { key: "checkCount", header: "Checks" },
          ]}
        />
      </Panel>

      <Panel title="Connected Providers" subtitle="Registry-derived provider cards">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" role="list" aria-label="Provider cards">
          {data.providerCards.map((card) => (
            <article
              key={card.providerId}
              role="listitem"
              className={`rounded-lg border p-4 transition ${
                selectedProviderId === card.providerId
                  ? "border-[#c9a227]/50 bg-[#c9a227]/5"
                  : "border-[#2a2824] bg-[#141312]"
              }`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-[#e8e4dc]">{card.providerName}</h3>
                  <p className="text-xs text-[#8a847a]">{card.providerCategory}</p>
                </div>
                <StatusBadge status={card.healthStatus} />
              </div>
              <dl className="space-y-1 text-xs text-[#a8a399]">
                <div className="flex justify-between">
                  <dt>Connection</dt>
                  <dd>{card.connectionStatus}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Authorization</dt>
                  <dd>{card.authorizationStatus}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Credential</dt>
                  <dd>{card.credentialStatus}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Account holder</dt>
                  <dd>{card.accountHolderType}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Environment</dt>
                  <dd>{card.environment}</dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                <ActionButton variant="secondary" onClick={() => setSelectedProviderId(card.providerId)}>
                  Details
                </ActionButton>
                {card.primaryAction === "connect" || card.primaryAction === "reconnect" ? (
                  <ActionButton
                    variant="primary"
                    onClick={() =>
                      void executeAction(
                        card.primaryAction === "reconnect" ? "reconnect" : "start_authorization",
                        card.providerId,
                      )
                    }
                  >
                    {card.primaryAction === "reconnect" ? "Reconnect" : "Connect"}
                  </ActionButton>
                ) : null}
                <ActionButton variant="secondary" onClick={() => void executeAction("run_health_check", card.providerId)}>
                  Health Check
                </ActionButton>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Account Holder Connections">
          <ul className="space-y-2 text-sm text-[#c9c4b8]">
            {data.accountHolderGroups.map((group) => (
              <li key={group.accountHolderTypeId}>
                <strong>{group.accountHolderTypeName}</strong>: {group.connectionCount} provider(s)
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recent Authorization Activity" subtitle="EKLS reference summaries only">
          {data.recentActivity.length === 0 ? (
            <CockpitEmptyState title="No recent authorization activity recorded." />
          ) : (
            <ul className="max-h-64 space-y-2 overflow-y-auto text-sm" aria-label="Recent activity">
              {data.recentActivity.slice(0, 10).map((item) => (
                <li key={item.activityId} className="border-b border-[#2a2824] pb-2 text-[#a8a399]">
                  <span className="text-[#8a847a]">{new Date(item.recordedAt).toLocaleString()}</span>
                  <br />
                  {item.kind}: {item.summary}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {selectedProviderId && detail.data && detail.data.found !== false ? (
        <ProviderDetailPanel
          detail={detail.data as AuthorizationCentreDetailView}
          onAction={executeAction}
          onClose={() => setSelectedProviderId(null)}
        />
      ) : null}

      {data.pluginWidgets.length > 0 ? (
        <Panel title="Plugin Widgets">
          <ul className="space-y-2 text-sm text-[#c9c4b8]">
            {data.pluginWidgets.map((w) => (
              <li key={w.pluginId}>
                <strong>{w.title}</strong>: {w.summary}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}

function ProviderDetailPanel({
  detail,
  onAction,
  onClose,
}: {
  detail: AuthorizationCentreDetailView;
  onAction: (action: string, providerId: string, extra?: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}) {
  return (
    <Panel title={`${detail.providerName} — Detail`} subtitle="Scopes, permissions, credentials (redacted), EKLS refs">
      <div className="mb-4 flex flex-wrap gap-2">
        <ActionButton variant="secondary" onClick={onClose}>
          Close
        </ActionButton>
        <ActionButton variant="secondary" onClick={() => void onAction("refresh_status", detail.providerId)}>
          Refresh Status
        </ActionButton>
        <ActionButton variant="secondary" onClick={() => void onAction("view_ekls_events", detail.providerId)}>
          View EKLS Events
        </ActionButton>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section aria-label="Connection summary">
          <h4 className="mb-2 text-sm font-medium text-[#e8e4dc]">Connection Summary</h4>
          <dl className="space-y-1 text-xs text-[#a8a399]">
            {Object.entries(detail.connectionSummary).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4">
                <dt>{key}</dt>
                <dd>{String(value ?? "—")}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section aria-label="Pillow governance">
          <h4 className="mb-2 text-sm font-medium text-[#e8e4dc]">Pillow Governance</h4>
          <p className="text-xs text-[#a8a399]">State: {detail.pillowGovernanceState}</p>
          <ul className="mt-2 text-xs text-[#8a847a]">
            {Object.entries(detail.governanceChecks).map(([k, v]) => (
              <li key={k}>
                {k}: {v ? "pass" : "fail"}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ScopePermissionBlock title="Scopes" required={detail.requiredScopes} granted={detail.grantedScopes} missing={detail.missingScopes} />
        <ScopePermissionBlock
          title="Permissions"
          required={detail.requiredPermissions}
          granted={detail.grantedPermissions}
          missing={detail.missingPermissions}
        />
      </div>

      <div className="mt-4">
        <h4 className="mb-2 text-sm font-medium text-[#e8e4dc]">Credential References (metadata only)</h4>
        {detail.credentialReferences.length === 0 ? (
          <p className="text-xs text-[#8a847a]">No credential references on file.</p>
        ) : (
          <ul className="text-xs text-[#a8a399]">
            {detail.credentialReferences.map((ref) => (
              <li key={ref.credentialRefId}>
                {ref.credentialType} — {ref.status} ({ref.vaultBackend})
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4">
        <h4 className="mb-2 text-sm font-medium text-[#e8e4dc]">Health Checks</h4>
        {detail.healthChecks.length === 0 ? (
          <p className="text-xs text-[#8a847a]">No health checks run yet.</p>
        ) : (
          <ul className="text-xs text-[#a8a399]">
            {detail.healthChecks.map((check) => (
              <li key={check.healthCheckId}>
                {check.checkType}: {check.status} — {check.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4">
        <h4 className="mb-2 text-sm font-medium text-[#e8e4dc]">EKLS Events (references only)</h4>
        {detail.eklsEvents.length === 0 ? (
          <p className="text-xs text-[#8a847a]">No EKLS events for this provider.</p>
        ) : (
          <ul className="max-h-40 overflow-y-auto text-xs text-[#a8a399]">
            {detail.eklsEvents.map((event) => (
              <li key={event.referenceId}>
                {event.kind}: {event.summary}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

function ScopePermissionBlock({
  title,
  required,
  granted,
  missing,
}: {
  title: string;
  required: string[];
  granted: string[];
  missing: string[];
}) {
  return (
    <section aria-label={title}>
      <h4 className="mb-2 text-sm font-medium text-[#e8e4dc]">{title}</h4>
      <p className="text-xs text-[#8a847a]">Required: {required.length} · Granted: {granted.length}</p>
      {missing.length > 0 ? (
        <ul className="mt-1 text-xs text-amber-400/90">
          {missing.map((item) => (
            <li key={item}>Missing: {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-[#6f8f6a]">Complete</p>
      )}
    </section>
  );
}
