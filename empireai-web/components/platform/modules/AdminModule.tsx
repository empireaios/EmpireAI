"use client";

import { BrainModuleShell } from "@/components/platform/brain/BrainModuleShell";
import {
  ActionButton,
  Badge,
  Panel,
  PlatformPageHeader,
  StatCard,
} from "@/components/platform/ui/PlatformPrimitives";
import { useAuth } from "@/lib/auth/context";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import { useBrainAction } from "@/lib/brain/hooks/useBrainAction";

type AdminView = {
  metrics: Array<{ label: string; value: string }>;
  alerts: Array<{ severity: string; message: string }>;
  fleet: Array<{ region: string; agents: number; status: string }>;
};

export function AdminModule() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useBrainModule<AdminView>("admin", "load", {
    enabled: user?.role === "admin",
  });
  const { execute, loading: acting } = useBrainAction();

  if (user && user.role !== "admin") {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8">
        <p className="text-sm font-medium text-red-300">Access denied</p>
        <p className="mt-2 text-sm text-[#a8a095]">
          Admin console requires administrator role permissions from the Brain.
        </p>
      </div>
    );
  }

  return (
    <BrainModuleShell loading={loading} error={error} onRetry={reload}>
      {!data ? null : (
        <>
          <PlatformPageHeader
            eyebrow="Platform Operations"
            title="Admin Console"
            description="System health, tenant management, agent fleet monitoring, and platform-wide orchestration controls."
            actions={
              <>
                <ActionButton
                  variant="secondary"
                  disabled={acting}
                  onClick={() => void execute({ module: "production-deploy", action: "get_logs" })}
                >
                  View logs
                </ActionButton>
                <ActionButton
                  disabled={acting}
                  onClick={() => void execute({ module: "production-deploy", action: "prepare" })}
                >
                  Deploy update
                </ActionButton>
              </>
            }
          />

          <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
            Restricted access · Platform administrator session
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.metrics.map((metric) => (
              <StatCard key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="System Alerts">
              <ul className="space-y-3">
                {data.alerts.map((alert) => (
                  <li
                    key={alert.message}
                    className="flex items-start gap-3 rounded-lg border border-gold/10 px-4 py-3"
                  >
                    <Badge
                      variant={
                        alert.severity === "warning"
                          ? "warning"
                          : alert.severity === "success"
                            ? "success"
                            : "default"
                      }
                    >
                      {alert.severity}
                    </Badge>
                    <p className="text-sm text-[#c8c0b0]">{alert.message}</p>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Agent Fleet" subtitle="43,416 agents deployed">
              <div className="space-y-4">
                {data.fleet.map((region) => (
                  <div
                    key={region.region}
                    className="flex items-center justify-between rounded-lg border border-gold/10 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#f0d78c]">{region.region}</p>
                      <p className="text-xs text-[#6f6a60]">
                        {region.agents.toLocaleString()} agents
                      </p>
                    </div>
                    <Badge variant="success">{region.status}</Badge>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}
    </BrainModuleShell>
  );
}
