"use client";

import Link from "next/link";
import { Panel } from "@/components/platform/ui/PlatformPrimitives";
import {
  CockpitErrorState,
  CockpitHealthBadge,
  CockpitLoadingState,
  DataModeBadge,
} from "@/components/cockpit/ui";
import { useExecutiveRelationshipGraph } from "@/lib/cockpit/hooks/useExecutiveRelationshipGraph";
import type {
  RelationshipGraphEdge,
  RelationshipGraphNode,
} from "@/lib/cockpit/panel-types";
import { engineCenterHref } from "@/lib/cockpit/engine-centers";

function EngineRelationshipNodeCard({ node }: { node: RelationshipGraphNode }) {
  if (!node.route) return null;

  return (
    <Link
      href={node.route}
      className="group flex flex-col gap-2 rounded-lg border border-gold/10 px-3 py-3 transition hover:border-gold/30 hover:bg-white/[0.02]"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-[#f0d78c] group-hover:underline">{node.label}</p>
          <p className="text-[10px] text-[#6f6a60]">{node.department}</p>
        </div>
        <CockpitHealthBadge health={node.health} />
      </div>
      {node.currentState && (
        <p className="line-clamp-2 text-[11px] text-[#8a847a]">{node.currentState}</p>
      )}
      <div className="flex flex-wrap gap-1.5 text-[10px]">
        <span className="rounded border border-gold/10 px-1.5 py-0.5 text-[#8a847a]">
          ↑ {node.upstream.length} upstream
        </span>
        <span className="rounded border border-gold/10 px-1.5 py-0.5 text-[#8a847a]">
          ↓ {node.downstream.length} downstream
        </span>
        {node.activeMissions.length > 0 && (
          <span className="rounded border border-gold/15 bg-gold/5 px-1.5 py-0.5 text-[#d4af37]">
            {node.activeMissions.length} mission(s)
          </span>
        )}
        {node.blockingIssues.length > 0 && (
          <span className="rounded border border-red-500/20 bg-red-500/5 px-1.5 py-0.5 text-red-200/90">
            {node.blockingIssues.length} blocker(s)
          </span>
        )}
      </div>
    </Link>
  );
}

function RelationshipEdgeList({
  title,
  edges,
  nodesById,
}: {
  title: string;
  edges: RelationshipGraphEdge[];
  nodesById: Map<string, RelationshipGraphNode>;
}) {
  if (edges.length === 0) {
    return (
      <Panel title={title}>
        <p className="text-sm text-[#6f6a60]">No relationships in this category.</p>
      </Panel>
    );
  }

  return (
    <Panel title={title}>
      <ul className="max-h-64 space-y-1.5 overflow-y-auto text-xs text-[#8a847a]">
        {edges.map((edge) => {
          const fromNode = nodesById.get(edge.from);
          const toNode = nodesById.get(edge.to);
          const fromHref = fromNode?.route ?? null;
          const toHref = toNode?.route ?? (edge.to.startsWith("mission:") ? "/cockpit/missions" : null);

          return (
            <li key={edge.id} className="rounded border border-gold/10 px-2 py-1.5">
              {fromHref ? (
                <Link href={fromHref} className="text-[#d4af37] hover:underline">
                  {fromNode?.label ?? edge.from}
                </Link>
              ) : (
                <span>{fromNode?.label ?? edge.from}</span>
              )}
              {" → "}
              {toHref ? (
                <Link href={toHref} className="text-[#d4af37] hover:underline">
                  {toNode?.label ?? edge.to.replace(/^mission:/, "Mission ")}
                </Link>
              ) : (
                <span>{toNode?.label ?? edge.to}</span>
              )}
              <span className="text-[#6f6a60]"> · {edge.label}</span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/** G4-08 — Executive Relationship Graph (static layout, no animations). */
export function ExecutiveRelationshipGraphPanel() {
  const { data, loading, error, reload, lastUpdatedAt } = useExecutiveRelationshipGraph();

  if (loading && !data) {
    return (
      <Panel title="Executive Relationship Graph">
        <CockpitLoadingState />
      </Panel>
    );
  }

  if (error || !data) {
    return (
      <Panel title="Executive Relationship Graph">
        <CockpitErrorState onRetry={() => void reload()} />
      </Panel>
    );
  }

  const engineNodes = data.nodes.filter((n) => n.kind === "engine");
  const nodesById = new Map(data.nodes.map((n) => [n.id, n]));
  const dependencyEdges = data.edges.filter((e) => e.kind === "depends_on");
  const missionEdges = data.edges.filter((e) => e.kind === "active_mission");
  const blockerEdges = data.edges.filter((e) => e.kind === "blocking_issue");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DataModeBadge mode="live" />
        {lastUpdatedAt && (
          <p className="text-[10px] text-[#6f6a60]">
            Updated {new Date(lastUpdatedAt).toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-gold/10 px-3 py-2">
          <p className="text-[10px] uppercase text-[#6f6a60]">Engines</p>
          <p className="text-lg text-[#f0d78c]">{data.summary.totalEngines}</p>
        </div>
        <div className="rounded-lg border border-gold/10 px-3 py-2">
          <p className="text-[10px] uppercase text-[#6f6a60]">Healthy</p>
          <p className="text-lg text-emerald-200/90">{data.summary.healthyEngines}</p>
        </div>
        <div className="rounded-lg border border-gold/10 px-3 py-2">
          <p className="text-[10px] uppercase text-[#6f6a60]">With blockers</p>
          <p className="text-lg text-red-200/90">{data.summary.enginesWithBlockers}</p>
        </div>
        <div className="rounded-lg border border-gold/10 px-3 py-2">
          <p className="text-[10px] uppercase text-[#6f6a60]">Mission links</p>
          <p className="text-lg text-[#d4af37]">{data.summary.activeMissionLinks}</p>
        </div>
        <div className="rounded-lg border border-gold/10 px-3 py-2">
          <p className="text-[10px] uppercase text-[#6f6a60]">Dependencies</p>
          <p className="text-lg text-[#c8c0b0]">{data.summary.dependencyEdges}</p>
        </div>
      </div>

      <Panel
        title="Version 1 Engine Nodes"
        subtitle="Click any node to open its Engine Center · G4-08"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {engineNodes.map((node) => (
            <EngineRelationshipNodeCard key={node.id} node={node} />
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <RelationshipEdgeList
          title="Dependencies · V1 commercial spine"
          edges={dependencyEdges}
          nodesById={nodesById}
        />
        <RelationshipEdgeList
          title="Active mission links"
          edges={missionEdges}
          nodesById={nodesById}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RelationshipEdgeList
          title="Blocking issues"
          edges={blockerEdges}
          nodesById={nodesById}
        />
        <Panel title="Per-engine upstream / downstream">
          <ul className="max-h-80 space-y-3 overflow-y-auto text-xs">
            {engineNodes.map((node) => (
              <li key={node.id} className="rounded border border-gold/10 px-3 py-2">
                <Link href={node.route ?? engineCenterHref(node.engineId ?? "")} className="font-medium text-[#f0d78c] hover:underline">
                  {node.label}
                </Link>
                {node.upstream.length > 0 && (
                  <p className="mt-1 text-[#8a847a]">
                    Upstream:{" "}
                    {node.upstream.map((u, i) => (
                      <span key={u.engineId}>
                        {i > 0 && ", "}
                        <Link href={u.route} className="text-[#d4af37]">
                          {u.label}
                        </Link>
                      </span>
                    ))}
                  </p>
                )}
                {node.downstream.length > 0 && (
                  <p className="mt-1 text-[#8a847a]">
                    Downstream:{" "}
                    {node.downstream.map((d, i) => (
                      <span key={d.engineId}>
                        {i > 0 && ", "}
                        <Link href={d.route} className="text-[#d4af37]">
                          {d.label}
                        </Link>
                      </span>
                    ))}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Future expansion (architecture only)" subtitle="No additional nodes in V1">
        <p className="mb-2 text-sm text-[#8a847a]">{data.futureExpansion.registrationPattern}</p>
        <p className="mb-3 text-xs text-[#6f6a60]">
          Reserved node kinds: {data.futureExpansion.nodeKinds.join(", ")}
        </p>
        <ul className="space-y-1 text-xs text-[#6f6a60]">
          {data.futureExpansion.notes.map((note) => (
            <li key={note}>· {note}</li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
