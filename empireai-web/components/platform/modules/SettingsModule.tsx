"use client";

import { useState } from "react";
import { BrainModuleShell } from "@/components/platform/brain/BrainModuleShell";
import {
  ActionButton,
  Panel,
  PlatformPageHeader,
} from "@/components/platform/ui/PlatformPrimitives";
import { useAuth } from "@/lib/auth/context";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";

const tabs = [
  { id: "account", label: "Account" },
  { id: "workspace", label: "Workspace" },
  { id: "integrations", label: "Integrations" },
  { id: "notifications", label: "Notifications" },
  { id: "security", label: "Security" },
] as const;

type SettingsView = {
  account: { name: string; email: string };
  workspace: { name: string; companies: number; plan: string };
  integrations: Array<{ name: string; status: string }>;
  notifications: string[];
  security: { lastLogin: string; activeSessions: number };
};

export function SettingsModule() {
  const { user, logout } = useAuth();
  const { data, loading, error, reload } = useBrainModule<SettingsView>("settings");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("account");

  return (
    <BrainModuleShell loading={loading} error={error} onRetry={reload}>
      {!data ? null : (
        <>
          <PlatformPageHeader
            eyebrow="Platform Configuration"
            title="Settings"
            description="Manage your workspace, integrations, security, and notification preferences."
            actions={<ActionButton>Save changes</ActionButton>}
          />

          <div className="mb-6 flex flex-wrap gap-2 border-b border-gold/10 pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-gold/10 text-[#f0d78c]"
                    : "text-[#6f6a60] hover:text-[#a8a095]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Panel title={tabs.find((t) => t.id === activeTab)?.label ?? "Settings"}>
            {activeTab === "account" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-[#6f6a60]">
                    Full name
                  </span>
                  <input
                    defaultValue={user?.name ?? data.account.name}
                    className="mt-2 w-full rounded-lg border border-gold/15 bg-white/[0.03] px-4 py-2.5 text-sm text-[#f0d78c] outline-none focus:border-gold/40"
                  />
                </label>
                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-[#6f6a60]">
                    Email
                  </span>
                  <input
                    defaultValue={user?.email ?? data.account.email}
                    className="mt-2 w-full rounded-lg border border-gold/15 bg-white/[0.03] px-4 py-2.5 text-sm text-[#f0d78c] outline-none focus:border-gold/40"
                  />
                </label>
              </div>
            )}
            {activeTab === "workspace" && (
              <p className="text-sm text-[#8a847a]">
                Portfolio workspace:{" "}
                <strong className="text-[#f0d78c]">{data.workspace.name}</strong> ·{" "}
                {data.workspace.companies} active companies · {data.workspace.plan} plan
              </p>
            )}
            {activeTab === "integrations" && (
              <ul className="space-y-3 text-sm text-[#c8c0b0]">
                {data.integrations.map((integration) => (
                  <li
                    key={integration.name}
                    className="flex justify-between rounded-lg border border-gold/10 px-4 py-3"
                  >
                    {integration.name}{" "}
                    <span className="text-emerald-400">{integration.status}</span>
                  </li>
                ))}
              </ul>
            )}
            {activeTab === "notifications" && (
              <ul className="space-y-3">
                {data.notifications.map((item) => (
                  <li
                    key={item}
                    className="flex items-center justify-between rounded-lg border border-gold/10 px-4 py-3 text-sm text-[#c8c0b0]"
                  >
                    {item}
                    <input type="checkbox" defaultChecked className="accent-[#d4af37]" />
                  </li>
                ))}
              </ul>
            )}
            {activeTab === "security" && (
              <div className="space-y-4">
                <ActionButton variant="secondary">Change password</ActionButton>
                <ActionButton variant="secondary">Enable 2FA</ActionButton>
                <p className="text-xs text-[#6f6a60]">
                  Last login: {data.security.lastLogin} · {data.security.activeSessions}{" "}
                  active session
                </p>
                <ActionButton variant="ghost" onClick={() => void logout()}>
                  Sign out
                </ActionButton>
              </div>
            )}
          </Panel>
        </>
      )}
    </BrainModuleShell>
  );
}
