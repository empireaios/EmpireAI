import { randomUUID } from "node:crypto";

import type { DependencyGraphEdge, DependencyGraphNode, ExpansionDependencyGraph } from "../models/dependency-graph.js";
import { buildCountryInfrastructureProfile } from "./infrastructure-model-service.js";
import { getProviderDependencies, listProviderDependenciesForCountry } from "./infrastructure-dependency-service.js";
import { computeInfrastructureReadiness } from "./infrastructure-readiness-service.js";
import { getMarketplacesByCountry } from "../../global-commerce/services/global-commerce-registry-service.js";

const GRAPH_CHAIN: Array<{ nodeType: DependencyGraphNode["nodeType"]; layerId?: string; label: string }> = [
  { nodeType: "country", label: "Country" },
  { nodeType: "marketplace", layerId: "marketplace", label: "Marketplace" },
  { nodeType: "payment", layerId: "payment", label: "Payments" },
  { nodeType: "logistics", layerId: "logistics", label: "Logistics" },
  { nodeType: "supplier", layerId: "supplier", label: "Supplier" },
  { nodeType: "advertising", layerId: "advertising", label: "Advertising" },
  { nodeType: "compliance", layerId: "compliance", label: "Compliance" },
  { nodeType: "ready", label: "Ready" },
];

function nodeStatus(score: number, blockers: number): DependencyGraphNode["status"] {
  if (blockers > 0) return "BLOCKED";
  if (score >= 75) return "COMPLETE";
  if (score >= 40) return "PARTIAL";
  return "MISSING";
}

/** D-004 — Expansion Dependency Graph. */
export function buildExpansionDependencyGraph(
  workspaceId: string,
  companyId: string,
  countryCode: string,
  providerId?: string,
): ExpansionDependencyGraph | null {
  const profile = buildCountryInfrastructureProfile(countryCode);
  if (!profile) return null;

  const readiness = computeInfrastructureReadiness(workspaceId, companyId, countryCode);
  const marketplaces = getMarketplacesByCountry(countryCode);
  const targetMp = providerId
    ? marketplaces.find((m) => m.providerId === providerId)
    : marketplaces[0];
  const mpDeps = targetMp ? getProviderDependencies(targetMp.providerId, countryCode) : null;

  const nodes: DependencyGraphNode[] = [];
  const edges: DependencyGraphEdge[] = [];
  let prevNodeId: string | null = null;

  for (const step of GRAPH_CHAIN) {
    const nodeId = `gci-${countryCode}-${step.nodeType}${targetMp ? `-${targetMp.providerId}` : ""}`;
    let displayName = step.label;
    let score = 50;
    let status: DependencyGraphNode["status"] = "PARTIAL";

    if (step.nodeType === "country") {
      displayName = profile.displayName;
      score = profile.infrastructureScore;
      status = nodeStatus(score, readiness?.criticalBlockers.length ?? 0);
    } else if (step.nodeType === "marketplace" && targetMp) {
      displayName = targetMp.displayName;
      score = profile.layers.find((l) => l.layerId === "marketplace")?.coverageScore ?? 50;
      status = score >= 60 ? "COMPLETE" : "PARTIAL";
    } else if (step.nodeType === "ready") {
      displayName = "Ready to Sell";
      score = readiness?.infrastructureScore ?? 0;
      status = readiness?.readinessPhase === "READY" ? "READY" : readiness?.readinessPhase === "BLOCKED" ? "BLOCKED" : "PARTIAL";
    } else if (step.layerId) {
      const layer = profile.layers.find((l) => l.layerId === step.layerId);
      displayName = layer?.displayName ?? step.label;
      score = layer?.coverageScore ?? 30;
      const dep = mpDeps?.dependencies.find((d) => d.layerId === step.layerId);
      if (dep?.requirement === "REQUIRED" && dep.humanActionRequired) status = "MISSING";
      else if (dep?.requirement === "NOT_REQUIRED") status = "COMPLETE";
      else status = nodeStatus(score, 0);
    }

    nodes.push({
      nodeId,
      nodeType: step.nodeType,
      displayName,
      countryCode,
      providerId: targetMp?.providerId,
      layerId: step.layerId,
      status,
      score,
    });

    if (prevNodeId) {
      edges.push({
        edgeId: randomUUID(),
        fromNodeId: prevNodeId,
        toNodeId: nodeId,
        relationship: step.nodeType === "ready" ? "LEADS_TO" : "REQUIRES",
        requirement: mpDeps?.dependencies.find((d) => d.layerId === step.layerId)?.requirement,
      });
    }
    prevNodeId = nodeId;
  }

  const readyNode = nodes.find((n) => n.nodeType === "ready");

  return {
    graphId: randomUUID(),
    countryCode,
    displayName: profile.displayName,
    nodes,
    edges,
    readyNodeId: readyNode?.nodeId,
    computedAt: new Date().toISOString(),
  };
}

export function listExpansionDependencyGraphs(
  workspaceId: string,
  companyId: string,
  countryCode: string,
): ExpansionDependencyGraph[] {
  const marketplaces = getMarketplacesByCountry(countryCode);
  return marketplaces
    .slice(0, 5)
    .map((m) => buildExpansionDependencyGraph(workspaceId, companyId, countryCode, m.providerId))
    .filter((g): g is ExpansionDependencyGraph => g !== null);
}

export function getProviderDependencyGraphCoverage(): number {
  return listProviderDependenciesForCountry("SG").length + listProviderDependenciesForCountry("US").length;
}
