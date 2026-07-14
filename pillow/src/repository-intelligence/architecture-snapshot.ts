import type {
  RepositoryArchitectureCockpitSnapshot,
  RepositoryKnowledgeModel,
} from "./types.js";

/** Build Cockpit snapshot for Repository Architecture page. */
export function buildRepositoryArchitectureSnapshot(
  model: RepositoryKnowledgeModel,
): RepositoryArchitectureCockpitSnapshot {
  const ai = model.architectureIntelligence;
  const inventory = ai.inventory;

  const inventorySummary = [
    `${inventory.topLevelFolders.length} top-level folders`,
    `${inventory.packages.length} packages`,
    `${ai.components.length} components`,
    `${ai.folders.length} folders indexed`,
    `${ai.files.length} important files`,
    `${ai.executionFlows.length} execution flows`,
  ].join(" · ");

  const criticalComponents = ai.components.filter(
    (c) => c.criticality === "critical" || c.criticality === "high",
  );

  return {
    computedAt: new Date().toISOString(),
    version: model.version,
    inventorySummary,
    componentCount: ai.components.length,
    folderCount: ai.folders.length,
    fileCount: ai.files.length,
    flowCount: ai.executionFlows.length,
    hotspotCount: ai.dependencyGraph.architecturalHotspots.length,
    circularDependencyCount: ai.dependencyGraph.circularDependencies.length,
    criticalComponents: criticalComponents.slice(0, 12),
    executionFlows: ai.executionFlows,
    dependencyHotspots: ai.dependencyGraph.architecturalHotspots,
    inventory,
    components: ai.components,
    folders: ai.folders,
    files: ai.files,
    dependencyGraph: ai.dependencyGraph,
    searchIndex: ai.searchIndex,
    grandKingSummary: [
      "Repository Architecture Intelligence active — complete repository understanding without reading source code.",
      inventorySummary,
      `${criticalComponents.length} critical/high components · ${ai.dependencyGraph.architecturalHotspots.length} architectural hotspots.`,
      "Use Repository Search and Impact Analysis before Cursor missions to eliminate repository guessing.",
    ].join(" "),
  };
}
