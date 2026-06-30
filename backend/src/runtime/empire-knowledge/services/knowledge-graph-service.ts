import { randomUUID } from "node:crypto";

import type { GraphQueryResult, KnowledgeEdge } from "../models/knowledge-graph.js";
import { CreateKnowledgeEdgeInputSchema } from "../models/knowledge-graph.js";
import type { CreateKnowledgeEdgeInput } from "../models/knowledge-graph.js";
import { KNOWLEDGE_SEED_EDGES } from "../data/knowledge-seed-data.js";
import { getEmpireKnowledgeRepository } from "../repositories/sqlite-empire-knowledge-repository.js";
import { ensureKnowledgeSeeded, getKnowledgeObject, listKnowledgeObjects } from "./knowledge-object-service.js";

function seedEdges(workspaceId: string): void {
  const repo = getEmpireKnowledgeRepository();
  const existing = repo.listEdges(workspaceId);
  if (existing.length > 0) return;

  const ts = new Date().toISOString();
  for (const seed of KNOWLEDGE_SEED_EDGES) {
    const edge: KnowledgeEdge = {
      edgeId: seed.edgeId,
      workspaceId,
      fromObjectId: seed.fromObjectId,
      toObjectId: seed.toObjectId,
      relationship: seed.relationship,
      weight: seed.weight ?? 50,
      evidence: seed.evidence,
      createdAt: ts,
    };
    repo.saveEdge(edge);
  }
}

/** K-002 — Knowledge Graph with queryable relationships. */
export function createKnowledgeEdge(workspaceId: string, input: CreateKnowledgeEdgeInput): KnowledgeEdge {
  ensureKnowledgeSeeded(workspaceId);
  seedEdges(workspaceId);
  const parsed = CreateKnowledgeEdgeInputSchema.parse(input);
  const edge: KnowledgeEdge = {
    edgeId: randomUUID(),
    workspaceId,
    fromObjectId: parsed.fromObjectId,
    toObjectId: parsed.toObjectId,
    relationship: parsed.relationship,
    weight: parsed.weight ?? 50,
    evidence: parsed.evidence,
    createdAt: new Date().toISOString(),
  };
  getEmpireKnowledgeRepository().saveEdge(edge);
  return edge;
}

export function listKnowledgeEdges(workspaceId: string): KnowledgeEdge[] {
  ensureKnowledgeSeeded(workspaceId);
  seedEdges(workspaceId);
  return getEmpireKnowledgeRepository().listEdges(workspaceId);
}

export function queryKnowledgeGraph(
  workspaceId: string,
  rootObjectId: string,
  depth = 2,
): GraphQueryResult | null {
  ensureKnowledgeSeeded(workspaceId);
  seedEdges(workspaceId);
  const root = getKnowledgeObject(rootObjectId);
  if (!root) return null;

  const repo = getEmpireKnowledgeRepository();
  const visited = new Set<string>([rootObjectId]);
  const edges: KnowledgeEdge[] = [];
  let frontier = [rootObjectId];

  for (let d = 0; d < depth; d++) {
    const next: string[] = [];
    for (const id of frontier) {
      const out = repo.listEdgesFrom(id);
      const inn = repo.listEdgesTo(id);
      for (const e of [...out, ...inn]) {
        edges.push(e);
        for (const nid of [e.fromObjectId, e.toObjectId]) {
          if (!visited.has(nid)) {
            visited.add(nid);
            next.push(nid);
          }
        }
      }
    }
    frontier = next;
  }

  const uniqueEdges = [...new Map(edges.map((e) => [e.edgeId, e])).values()];
  const nodes = [...visited]
    .map((id) => getKnowledgeObject(id))
    .filter((n): n is NonNullable<typeof n> => n !== null)
    .map((n) => ({ objectId: n.objectId, objectType: n.objectType, displayName: n.displayName }));

  return { rootObjectId, nodes, edges: uniqueEdges, depth };
}

export function findRelatedObjects(workspaceId: string, objectId: string, relationship?: KnowledgeEdge["relationship"]) {
  ensureKnowledgeSeeded(workspaceId);
  seedEdges(workspaceId);
  const repo = getEmpireKnowledgeRepository();
  const edges = [...repo.listEdgesFrom(objectId), ...repo.listEdgesTo(objectId)].filter(
    (e) => !relationship || e.relationship === relationship,
  );
  const relatedIds = new Set<string>();
  for (const e of edges) {
    relatedIds.add(e.fromObjectId === objectId ? e.toObjectId : e.fromObjectId);
  }
  return [...relatedIds]
    .map((id) => getKnowledgeObject(id))
    .filter((o): o is NonNullable<typeof o> => o !== null);
}

export function findGraphPath(workspaceId: string, fromObjectId: string, toObjectId: string): KnowledgeEdge[] | null {
  ensureKnowledgeSeeded(workspaceId);
  seedEdges(workspaceId);
  const repo = getEmpireKnowledgeRepository();
  const queue: Array<{ id: string; path: KnowledgeEdge[] }> = [{ id: fromObjectId, path: [] }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    if (id === toObjectId) return path;
    if (visited.has(id)) continue;
    visited.add(id);

    for (const e of repo.listEdgesFrom(id)) {
      queue.push({ id: e.toObjectId, path: [...path, e] });
    }
  }
  return null;
}

export function getGraphStats(workspaceId: string) {
  ensureKnowledgeSeeded(workspaceId);
  seedEdges(workspaceId);
  const edges = listKnowledgeEdges(workspaceId);
  const objects = listKnowledgeObjects(workspaceId);
  return { nodes: objects.length, edges: edges.length };
}
