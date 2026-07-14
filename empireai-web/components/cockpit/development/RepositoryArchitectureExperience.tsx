"use client";

import { useCallback, useEffect, useState } from "react";
import { PlatformPageHeader, Panel, DataTable } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type ArchitecturePayload = {
  repositoryArchitectureIntelligence: {
    computedAt: string;
    snapshot: {
      version: string;
      inventorySummary: string;
      componentCount: number;
      folderCount: number;
      fileCount: number;
      flowCount: number;
      hotspotCount: number;
      circularDependencyCount: number;
      grandKingSummary: string;
      criticalComponents: Array<{ id: string; name: string; layer: string; criticality: string; rootPath: string }>;
      executionFlows: Array<{ id: string; name: string; steps: Array<{ order: number; component: string; description: string }> }>;
      dependencyHotspots: Array<{ id: string; score: number; reason: string }>;
      inventory: {
        topLevelFolders: string[];
        packages: Array<{ name: string; path: string }>;
        fileCounts: Record<string, number>;
        businessEngines: string[];
        pillowModules: string[];
      };
      components: Array<{ id: string; name: string; layer: string; owner: string; rootPath: string; criticality: string; dependencies: string[]; dependents: string[] }>;
      folders: Array<{ path: string; purpose: string; owner: string; fileCount: number; businessRelevance: string }>;
      files: Array<{ path: string; purpose: string; riskLevel: string; imports: string[] }>;
      dependencyGraph: {
        circularDependencies: string[][];
        unusedComponents: string[];
        duplicatedResponsibilities: string[];
      };
      searchIndex: Array<{ id: string; kind: string; label: string; path: string; snippet: string }>;
    };
    searchResults?: Array<{ id: string; kind: string; label: string; path: string; snippet: string }>;
    impactAnalysis?: {
      target: string;
      affectedFolders: string[];
      affectedFiles: string[];
      affectedComponents: string[];
      dependencyImpact: string[];
      requiredTests: string[];
      architecturalRisks: string[];
      recommendation: string;
    };
  };
};

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "components", label: "Components" },
  { id: "folders", label: "Folders" },
  { id: "files", label: "Files" },
  { id: "dependencies", label: "Dependencies" },
  { id: "flows", label: "Execution Flows" },
  { id: "critical", label: "Critical" },
  { id: "search", label: "Search" },
  { id: "impact", label: "Impact Analysis" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** Repository Architecture Intelligence — Executive UX (PILLOW-RI-002). */
export function RepositoryArchitectureExperience() {
  const [data, setData] = useState<ArchitecturePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [impactTarget, setImpactTarget] = useState("pillow-host");

  const load = useCallback(async (opts?: { search?: string; impactTarget?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (opts?.search) params.set("search", opts.search);
      if (opts?.impactTarget) params.set("impactTarget", opts.impactTarget);
      const qs = params.toString();
      const res = await fetch(
        `/api/pillow/repository-architecture-intelligence${qs ? `?${qs}` : ""}`,
        { credentials: "include" },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ArchitecturePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load repository architecture");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return <Panel title="Repository Architecture">Loading repository intelligence…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Repository Architecture">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void load()}>
          Retry
        </button>
      </Panel>
    );
  }

  const { snapshot } = data.repositoryArchitectureIntelligence;

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        title="Repository Architecture"
        subtitle="Complete repository understanding — inventory · dependencies · flows · impact analysis"
      />

      <Panel title="Repository Architecture Intelligence">
        <div className="flex flex-wrap items-center gap-3">
          <DataModeBadge mode="live" />
          <span className="text-xs text-[#6f6a60]">
            {snapshot.version} · Updated{" "}
            {new Date(data.repositoryArchitectureIntelligence.computedAt).toLocaleTimeString()}
          </span>
        </div>
        <p className="mt-3 text-sm text-[#c8c0b0]">{snapshot.grandKingSummary}</p>
        <p className="mt-2 text-xs text-[#8a847a]">{snapshot.inventorySummary}</p>
      </Panel>

      <div className="flex flex-wrap gap-2 border-b border-gold/10 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ${
              activeTab === tab.id
                ? "bg-gold/15 text-[#d4af37]"
                : "text-[#6f6a60] hover:text-[#f0d78c]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Repository Inventory">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-[#6f6a60]">Top folders</dt><dd>{snapshot.inventory.topLevelFolders.join(", ")}</dd></div>
              <div className="flex justify-between"><dt className="text-[#6f6a60]">Packages</dt><dd>{snapshot.inventory.packages.map((p) => p.name).join(", ")}</dd></div>
              <div className="flex justify-between"><dt className="text-[#6f6a60]">TypeScript files</dt><dd>{snapshot.inventory.fileCounts.typescript ?? 0}</dd></div>
              <div className="flex justify-between"><dt className="text-[#6f6a60]">Test files</dt><dd>{snapshot.inventory.fileCounts.test ?? 0}</dd></div>
              <div className="flex justify-between"><dt className="text-[#6f6a60]">Pillow modules</dt><dd>{snapshot.inventory.pillowModules.length}</dd></div>
            </dl>
          </Panel>
          <Panel title="Architecture Metrics">
            <dl className="space-y-2 text-sm">
              {[
                ["Components", snapshot.componentCount],
                ["Folders", snapshot.folderCount],
                ["Important files", snapshot.fileCount],
                ["Execution flows", snapshot.flowCount],
                ["Hotspots", snapshot.hotspotCount],
                ["Circular deps", snapshot.circularDependencyCount],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between gap-4">
                  <dt className="text-[#6f6a60]">{label}</dt>
                  <dd className="text-[#d4af37]">{value}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      )}

      {activeTab === "components" && (
        <Panel title="Component Explorer">
          <DataTable
            columns={[
              { key: "name", header: "Component" },
              { key: "layer", header: "Layer" },
              { key: "owner", header: "Owner" },
              { key: "criticality", header: "Criticality" },
            ]}
            data={snapshot.components.map((c) => ({ ...c, key: c.id }))}
            keyField="key"
          />
        </Panel>
      )}

      {activeTab === "folders" && (
        <Panel title="Folder Explorer">
          <DataTable
            columns={[
              { key: "path", header: "Folder" },
              { key: "owner", header: "Owner" },
              { key: "fileCount", header: "Files" },
              { key: "businessRelevance", header: "Business relevance" },
            ]}
            data={snapshot.folders.map((f) => ({ ...f, key: f.path }))}
            keyField="key"
          />
        </Panel>
      )}

      {activeTab === "files" && (
        <Panel title="File Intelligence">
          <DataTable
            columns={[
              { key: "path", header: "File" },
              { key: "purpose", header: "Purpose" },
              { key: "riskLevel", header: "Risk" },
            ]}
            data={snapshot.files.map((f) => ({ ...f, key: f.path }))}
            keyField="key"
          />
        </Panel>
      )}

      {activeTab === "dependencies" && (
        <div className="space-y-6">
          <Panel title="Dependency Hotspots">
            <ul className="space-y-2 text-sm text-[#c8c0b0]">
              {snapshot.dependencyHotspots.map((h) => (
                <li key={h.id}>{h.id} — score {h.score} ({h.reason})</li>
              ))}
            </ul>
          </Panel>
          {snapshot.dependencyGraph.duplicatedResponsibilities.length > 0 && (
            <Panel title="Duplicated Responsibilities">
              <ul className="space-y-1 text-sm text-amber-200">
                {snapshot.dependencyGraph.duplicatedResponsibilities.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      )}

      {activeTab === "flows" && (
        <div className="space-y-4">
          {snapshot.executionFlows.map((flow) => (
            <Panel key={flow.id} title={flow.name}>
              <ol className="space-y-1 text-sm text-[#c8c0b0]">
                {flow.steps.map((s) => (
                  <li key={s.order}>
                    {s.order}. <span className="text-[#d4af37]">{s.component}</span> — {s.description}
                  </li>
                ))}
              </ol>
            </Panel>
          ))}
        </div>
      )}

      {activeTab === "critical" && (
        <Panel title="Critical Components">
          <DataTable
            columns={[
              { key: "name", header: "Component" },
              { key: "criticality", header: "Level" },
              { key: "rootPath", header: "Path" },
            ]}
            data={snapshot.criticalComponents.map((c) => ({ ...c, key: c.id }))}
            keyField="key"
          />
        </Panel>
      )}

      {activeTab === "search" && (
        <Panel title="Repository Search">
          <div className="mb-4 flex gap-2">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search components, folders, files…"
              className="flex-1 rounded-lg border border-gold/15 bg-black/40 px-3 py-2 text-sm text-[#f0d78c]"
            />
            <button
              type="button"
              onClick={() => void load({ search: searchQuery })}
              className="rounded-lg border border-gold/25 px-4 py-2 text-xs uppercase tracking-wider text-[#d4af37]"
            >
              Search
            </button>
          </div>
          <ul className="space-y-2 text-sm">
            {(data.repositoryArchitectureIntelligence.searchResults ?? snapshot.searchIndex.slice(0, 15)).map(
              (entry) => (
                <li key={entry.id} className="rounded border border-gold/10 p-2 text-[#c8c0b0]">
                  <span className="text-[#d4af37]">[{entry.kind}]</span> {entry.label} — {entry.path}
                  <p className="text-xs text-[#6f6a60]">{entry.snippet}</p>
                </li>
              ),
            )}
          </ul>
        </Panel>
      )}

      {activeTab === "impact" && (
        <Panel title="Impact Analysis">
          <div className="mb-4 flex gap-2">
            <input
              value={impactTarget}
              onChange={(e) => setImpactTarget(e.target.value)}
              placeholder="Target path or component (e.g. pillow-host)"
              className="flex-1 rounded-lg border border-gold/15 bg-black/40 px-3 py-2 text-sm text-[#f0d78c]"
            />
            <button
              type="button"
              onClick={() => void load({ impactTarget })}
              className="rounded-lg border border-gold/25 px-4 py-2 text-xs uppercase tracking-wider text-[#d4af37]"
            >
              Analyze
            </button>
          </div>
          {data.repositoryArchitectureIntelligence.impactAnalysis ? (
            <dl className="space-y-3 text-sm text-[#c8c0b0]">
              <div><dt className="text-[#6f6a60]">Recommendation</dt><dd className="mt-1">{data.repositoryArchitectureIntelligence.impactAnalysis.recommendation}</dd></div>
              <div><dt className="text-[#6f6a60]">Affected components</dt><dd>{data.repositoryArchitectureIntelligence.impactAnalysis.affectedComponents.join(", ") || "None"}</dd></div>
              <div><dt className="text-[#6f6a60]">Affected folders</dt><dd>{data.repositoryArchitectureIntelligence.impactAnalysis.affectedFolders.join(", ") || "None"}</dd></div>
              <div><dt className="text-[#6f6a60]">Required tests</dt><dd>{data.repositoryArchitectureIntelligence.impactAnalysis.requiredTests.join(", ")}</dd></div>
              {data.repositoryArchitectureIntelligence.impactAnalysis.architecturalRisks.length > 0 && (
                <div><dt className="text-[#6f6a60]">Risks</dt><dd className="text-amber-200">{data.repositoryArchitectureIntelligence.impactAnalysis.architecturalRisks.join("; ")}</dd></div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-[#8a847a]">Enter a target and click Analyze before starting a Cursor mission.</p>
          )}
        </Panel>
      )}
    </div>
  );
}
