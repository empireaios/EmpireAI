import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import {
  EXECUTIVE_COMPONENT_EXPORTS,
  GLOBAL_COMPONENT_IDS,
  classifyByPath,
  inferClassification,
} from "./classifier.js";
import {
  parseDecisionRecords,
  parseExecutiveComponentExports,
  parseJourneyEntities,
  parseUxContractDependencies,
} from "./parsers.js";
import type {
  ClassifiedEntity,
  DependencyEdge,
  RelationshipEdge,
} from "./types.js";

function entityKey(id: string, classification?: string): string {
  return classification ? `${classification}:${id}` : id;
}

function upsertEntity(
  map: Map<string, ClassifiedEntity>,
  entity: ClassifiedEntity,
): void {
  const key = entityKey(entity.id, entity.classification);
  const existing = map.get(key);
  if (!existing) {
    map.set(key, entity);
    return;
  }
  map.set(key, {
    ...existing,
    ...entity,
    metadata: { ...existing.metadata, ...entity.metadata },
  });
}

export interface IntelligenceCorpus {
  entities: ClassifiedEntity[];
  bootstrap: EmpireBootstrapContext;
}

export function buildIntelligenceCorpus(
  bootstrap: EmpireBootstrapContext,
  texts: {
    journey: string | null;
    uxContract: string | null;
    decisions: string | null;
    executiveComponents: string | null;
  },
): IntelligenceCorpus {
  const entityMap = new Map<string, ClassifiedEntity>();

  upsertEntity(entityMap, {
    id: "PILLOW-002",
    classification: "bootstrap",
    label: "Repository Bootstrap Engine",
    path: "pillow/src/bootstrap/",
    description: "Mandatory first Pillow process — read-only discovery",
    status: "ready",
  });

  upsertEntity(entityMap, {
    id: "PILLOW-003",
    classification: "pillow",
    label: "Repository Intelligence Engine",
    path: "pillow/src/intelligence/",
    description: "Engineering knowledge layer — classification, graph, queries",
    status: "ready",
  });

  for (const artifact of bootstrap.artifacts) {
    const classification = inferClassification(
      artifact.descriptor.id,
      artifact.descriptor.relativePath,
    );
    upsertEntity(entityMap, {
      id: artifact.descriptor.id,
      classification,
      label: artifact.descriptor.description,
      path: artifact.descriptor.relativePath,
      status: artifact.present ? "present" : "missing",
      metadata: {
        requirement: artifact.descriptor.requirement,
        category: artifact.descriptor.category,
      },
    });
  }

  if (texts.journey) {
    for (const row of parseJourneyEntities(texts.journey)) {
      upsertEntity(entityMap, row);
    }
    upsertEntity(entityMap, {
      id: "JOURNEY",
      classification: "journey",
      label: "EmpireAI Journey",
      path: "JOURNEY.md",
      status: "present",
    });
    upsertEntity(entityMap, {
      id: "JOURNEY_AUDIT",
      classification: "journey_audit",
      label: "Journey Audit Log",
      path: "JOURNEY_AUDIT.md",
      status: "present",
    });
  }

  for (const gc of GLOBAL_COMPONENT_IDS) {
    upsertEntity(entityMap, {
      id: gc,
      classification: "global_component",
      label: gc,
      path: "UX_IMPLEMENTATION_CONTRACT.md#part-2",
      description: "Global component contract",
    });
  }

  if (texts.executiveComponents) {
    const exports = parseExecutiveComponentExports(texts.executiveComponents);
    for (const name of exports.length > 0 ? exports : EXECUTIVE_COMPONENT_EXPORTS) {
      upsertEntity(entityMap, {
        id: name,
        classification: "executive_component",
        label: name,
        path: "frontend/src/components/system/",
      });
    }
  }

  for (const audit of bootstrap.knownExecutiveAudits) {
    upsertEntity(entityMap, {
      id: audit.id,
      classification: "executive_audit",
      label: audit.id,
      path: audit.relativePath,
    });
  }

  if (texts.decisions) {
    for (const adr of parseDecisionRecords(texts.decisions)) {
      upsertEntity(entityMap, {
        id: adr.id,
        classification: "decision",
        label: adr.title,
        path: "EMPIREAI_DECISIONS.md",
        metadata: { owners: adr.owners.join("; ") },
      });
    }
  }

  for (const owner of bootstrap.realOwners) {
    upsertEntity(entityMap, {
      id: owner.missionId,
      classification: "reality_owner",
      label: owner.hint,
      path: owner.source === "runtime_module" ? owner.hint : "JOURNEY.md",
      metadata: { source: owner.source },
    });
  }

  for (const pillowMission of [
    "PILLOW-001",
    "PILLOW-004",
    "PILLOW-005",
    "PILLOW-006",
    "PILLOW-007",
    "PILLOW-008",
  ]) {
    if (!entityMap.has(entityKey(pillowMission, "pillow"))) {
      upsertEntity(entityMap, {
        id: pillowMission,
        classification: "pillow",
        label: pillowMission,
        path: "PILLOW_ARCHITECTURE_CONTRACT.md",
        status: "planned",
      });
    }
  }

  for (const ux of Array.from({ length: 23 }, (_, i) =>
    `UX-${String(i + 1).padStart(3, "0")}`,
  )) {
    if (![...entityMap.values()].some((e) => e.id === ux)) {
      upsertEntity(entityMap, {
        id: ux,
        classification: "ux",
        label: ux,
        status: "unknown",
      });
    }
  }

  return {
    entities: [...entityMap.values()].sort((a, b) =>
      a.id.localeCompare(b.id),
    ),
    bootstrap,
  };
}

export function buildRelationshipGraph(
  corpus: IntelligenceCorpus,
  texts: {
    uxContract: string | null;
    decisions: string | null;
    journey: string | null;
  },
): RelationshipEdge[] {
  const edges: RelationshipEdge[] = [];
  const add = (edge: RelationshipEdge) => edges.push(edge);

  add({
    from: "PILLOW-003",
    to: "PILLOW-002",
    type: "depends_on",
    source: "pillow_architecture",
  });

  for (const artifact of corpus.bootstrap.artifacts) {
    if (artifact.present) {
      add({
        from: "PILLOW-002",
        to: artifact.descriptor.id,
        type: "documents",
        source: "bootstrap_catalog",
      });
    }
  }

  if (texts.uxContract) {
    for (const row of parseUxContractDependencies(texts.uxContract)) {
      for (const dep of row.dependsOn) {
        add({
          from: row.id,
          to: dep,
          type: "depends_on",
          source: "UX_IMPLEMENTATION_CONTRACT.md",
        });
      }
      for (const gc of row.usesComponents) {
        add({
          from: row.id,
          to: gc,
          type: "implements",
          source: "UX_IMPLEMENTATION_CONTRACT.md",
        });
      }
      for (const owner of row.owners) {
        if (/^REAL-\d{3}$/.test(owner)) {
          add({
            from: row.id,
            to: owner,
            type: "references",
            source: "UX_IMPLEMENTATION_CONTRACT.md",
          });
        }
      }
    }
  }

  if (texts.decisions) {
    for (const adr of parseDecisionRecords(texts.decisions)) {
      for (const ref of adr.references) {
        add({
          from: adr.id,
          to: ref,
          type: "references",
          source: "EMPIREAI_DECISIONS.md",
        });
      }
      for (const owner of adr.owners) {
        if (owner.endsWith(".md")) {
          add({
            from: adr.id,
            to: owner.replace(/\.md$/i, ""),
            type: "governs",
            source: "EMPIREAI_DECISIONS.md",
          });
        }
      }
    }
  }

  add({
    from: "JOURNEY",
    to: "JOURNEY_AUDIT",
    type: "synchronizes_with",
    source: "journey_first_doctrine",
  });

  for (const doctrine of corpus.entities.filter(
    (e) => e.classification === "doctrine",
  )) {
    add({
      from: doctrine.id,
      to: "PILLOW-002",
      type: "governs",
      source: "doctrine_hierarchy",
    });
  }

  if (texts.journey) {
    for (const row of parseJourneyEntities(texts.journey)) {
      if (row.id.startsWith("UX-")) {
        add({
          from: "JOURNEY",
          to: row.id,
          type: "documents",
          source: "JOURNEY.md",
        });
      }
    }
  }

  for (const gc of GLOBAL_COMPONENT_IDS) {
    add({
      from: gc,
      to: "UX_IMPLEMENTATION_CONTRACT.md",
      type: "part_of",
      source: "UX_IMPLEMENTATION_CONTRACT.md",
    });
  }

  for (const comp of corpus.entities.filter(
    (e) => e.classification === "executive_component",
  )) {
    add({
      from: comp.id,
      to: "GC-07",
      type: "part_of",
      source: "frontend/src/components/system/",
    });
  }

  return dedupeEdges(edges);
}

export function buildDependencyGraph(
  relationships: RelationshipEdge[],
  corpus: IntelligenceCorpus,
): DependencyEdge[] {
  const deps: DependencyEdge[] = [];

  for (const edge of relationships) {
    if (edge.type !== "depends_on") continue;
    deps.push({
      from: edge.from,
      to: edge.to,
      kind: inferDependencyKind(edge.from, edge.to),
      source: edge.source,
    });
  }

  for (const edge of relationships) {
    if (edge.type === "references" && /^REAL-\d{3}$/.test(edge.to)) {
      deps.push({
        from: edge.from,
        to: edge.to,
        kind: "owner",
        source: edge.source,
      });
    }
  }

  for (const edge of relationships) {
    if (edge.type === "implements") {
      deps.push({
        from: edge.from,
        to: edge.to,
        kind: "contract",
        source: edge.source,
      });
    }
  }

  for (const edge of relationships) {
    if (edge.type === "governs") {
      deps.push({
        from: edge.from,
        to: edge.to,
        kind: "governance",
        source: edge.source,
      });
    }
  }

  if (corpus.bootstrap.knownArchitecture.pillowDoctrinePaths.length > 0) {
    deps.push({
      from: "PILLOW-004",
      to: "PILLOW-003",
      kind: "mission",
      source: "PILLOW_ARCHITECTURE_CONTRACT.md#part-7",
    });
    deps.push({
      from: "PILLOW-005",
      to: "PILLOW-004",
      kind: "mission",
      source: "PILLOW_ARCHITECTURE_CONTRACT.md#part-7",
    });
    deps.push({
      from: "PILLOW-006",
      to: "PILLOW-005",
      kind: "mission",
      source: "PILLOW_ARCHITECTURE_CONTRACT.md#part-7",
    });
    deps.push({
      from: "PILLOW-003",
      to: "PILLOW-002",
      kind: "mission",
      source: "PILLOW-002 session gate",
    });
  }

  addCommercialSpineDependencies(deps, corpus);

  return dedupeDependencies(deps);
}

function inferDependencyKind(from: string, to: string): DependencyEdge["kind"] {
  if (/^UX-\d{3}$/.test(from) && /^UX-\d{3}$/.test(to)) return "mission";
  if (/^PILLOW-\d{3}$/.test(from)) return "mission";
  if (/^GC-\d{2}$/.test(to)) return "contract";
  if (/^REAL-\d{3}$/.test(to)) return "owner";
  if (/^ADR-\d{3}$/.test(from)) return "architecture";
  if (/^BL-[A-C]$/.test(to)) return "governance";
  return "mission";
}

function addCommercialSpineDependencies(
  deps: DependencyEdge[],
  corpus: IntelligenceCorpus,
): void {
  const spine = [
    "UX-005",
    "UX-006",
    "UX-007",
    "UX-008",
    "UX-009",
    "UX-010",
    "UX-011",
  ];
  for (let i = 1; i < spine.length; i++) {
    const from = spine[i];
    const to = spine[i - 1];
    if (!from || !to) continue;
    deps.push({
      from,
      to,
      kind: "commercial",
      source: "UX_IMPLEMENTATION_CONTRACT.md#part-5",
    });
  }

  const commercialEntity = corpus.entities.find(
    (e) => e.path && classifyByPath(e.path) === "commercial_spine",
  );
  if (commercialEntity) {
    deps.push({
      from: "UX-005",
      to: commercialEntity.id,
      kind: "commercial",
      source: "commercial_spine",
    });
  }
}

function dedupeEdges(edges: RelationshipEdge[]): RelationshipEdge[] {
  const seen = new Set<string>();
  return edges.filter((e) => {
    const key = `${e.from}|${e.to}|${e.type}|${e.source}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeDependencies(deps: DependencyEdge[]): DependencyEdge[] {
  const seen = new Set<string>();
  return deps.filter((d) => {
    const key = `${d.from}|${d.to}|${d.kind}|${d.source}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function summarizeGraph(
  entities: ClassifiedEntity[],
  relationships: RelationshipEdge[],
  dependencies: DependencyEdge[],
): import("./types.js").GraphSummary {
  const byClassification: Partial<
    Record<ClassifiedEntity["classification"], number>
  > = {};

  for (const entity of entities) {
    byClassification[entity.classification] =
      (byClassification[entity.classification] ?? 0) + 1;
  }

  return {
    nodeCount: entities.length,
    edgeCount: relationships.length,
    dependencyCount: dependencies.length,
    byClassification,
  };
}
