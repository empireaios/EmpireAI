import type { ArchitectureBoundary, ComponentIntelligence, DependencyGraphIntelligence, DependencyLink } from "./types.js";

/** Analyze dependency graph — incoming, outgoing, cycles, hotspots. */
export function buildDependencyGraphIntelligence(input: {
  dependencies: DependencyLink[];
  components: ComponentIntelligence[];
  architecture: ArchitectureBoundary[];
}): DependencyGraphIntelligence {
  const nodes = [...new Set([
    ...input.dependencies.map((d) => d.from),
    ...input.dependencies.map((d) => d.to),
    ...input.components.map((c) => c.id),
  ])];

  const incoming: Record<string, string[]> = {};
  const outgoing: Record<string, string[]> = {};

  for (const node of nodes) {
    incoming[node] = input.dependencies.filter((d) => d.to === node).map((d) => d.from);
    outgoing[node] = input.dependencies.filter((d) => d.from === node).map((d) => d.to);
  }

  const circularDependencies = detectCircularDependencies(nodes, outgoing);
  const unusedComponents = nodes.filter(
    (n) => (incoming[n]?.length ?? 0) === 0 && (outgoing[n]?.length ?? 0) === 0,
  );

  const duplicatedResponsibilities = findDuplicatedResponsibilities(input.architecture);

  const architecturalHotspots = nodes
    .map((id) => {
      const inCount = incoming[id]?.length ?? 0;
      const outCount = outgoing[id]?.length ?? 0;
      const score = inCount + outCount + (input.dependencies.some((d) => d.critical && (d.from === id || d.to === id)) ? 3 : 0);
      return {
        id,
        score,
        reason: `${inCount} incoming · ${outCount} outgoing dependencies`,
      };
    })
    .filter((h) => h.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  return {
    nodes,
    edges: input.dependencies,
    incoming,
    outgoing,
    circularDependencies,
    unusedComponents,
    duplicatedResponsibilities,
    architecturalHotspots,
  };
}

function detectCircularDependencies(
  nodes: string[],
  outgoing: Record<string, string[]>,
): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack = new Set<string>();

  function dfs(node: string, path: string[]): void {
    if (stack.has(node)) {
      const cycleStart = path.indexOf(node);
      if (cycleStart >= 0) cycles.push(path.slice(cycleStart).concat(node));
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    stack.add(node);
    for (const next of outgoing[node] ?? []) {
      dfs(next, [...path, node]);
    }
    stack.delete(node);
  }

  for (const node of nodes) dfs(node, []);
  return cycles.slice(0, 5);
}

function findDuplicatedResponsibilities(architecture: ArchitectureBoundary[]): string[] {
  const byOwner = new Map<string, string[]>();
  for (const b of architecture) {
    const list = byOwner.get(b.owner) ?? [];
    list.push(b.name);
    byOwner.set(b.owner, list);
  }
  return [...byOwner.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([owner, names]) => `${owner}: ${names.join(", ")}`);
}
