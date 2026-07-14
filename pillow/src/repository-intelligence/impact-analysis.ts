import type {
  ComponentIntelligence,
  FileIntelligenceEntry,
  FolderIntelligence,
  ImpactAnalysisResult,
  RepositoryKnowledgeModel,
} from "./types.js";

/** Pre-mission repository impact analysis (PILLOW-RI-002). */
export function analyzeRepositoryImpact(input: {
  model: RepositoryKnowledgeModel;
  target?: string;
  keyword?: string;
  missionDescription?: string;
}): ImpactAnalysisResult {
  const query = (input.target ?? input.keyword ?? input.missionDescription ?? "").toLowerCase();
  const ai = input.model.architectureIntelligence;

  const affectedComponents = ai.components
    .filter(
      (c) =>
        !query ||
        c.id.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query) ||
        c.rootPath.toLowerCase().includes(query) ||
        c.owner.toLowerCase().includes(query),
    )
    .map((c) => c.id);

  const affectedFolders = ai.folders
    .filter(
      (f) =>
        !query ||
        f.path.toLowerCase().includes(query) ||
        f.purpose.toLowerCase().includes(query),
    )
    .map((f) => f.path);

  const affectedFiles = ai.files
    .filter(
      (f) =>
        !query ||
        f.path.toLowerCase().includes(query) ||
        f.ownedCapability.toLowerCase().includes(query),
    )
    .map((f) => f.path);

  const dependencyImpact = collectDependencyImpact(
    affectedComponents,
    ai.components,
    input.model.dependencies,
  );

  const requiredTests = inferRequiredTests(affectedFolders, ai.folders);
  const architecturalRisks = inferArchitecturalRisks(
    affectedComponents,
    ai.components,
    input.model.criticalPaths,
  );

  return {
    target: query || "general",
    affectedFolders,
    affectedFiles,
    affectedComponents,
    dependencyImpact,
    requiredTests,
    architecturalRisks,
    recommendation: buildRecommendation(
      affectedComponents,
      affectedFolders,
      architecturalRisks,
    ),
  };
}

function collectDependencyImpact(
  componentIds: string[],
  components: ComponentIntelligence[],
  dependencies: RepositoryKnowledgeModel["dependencies"],
): string[] {
  const impacts: string[] = [];
  for (const id of componentIds) {
    const comp = components.find((c) => c.id === id);
    if (!comp) continue;
    if (comp.dependents.length > 0) {
      impacts.push(`${id} affects dependents: ${comp.dependents.join(", ")}`);
    }
    const criticalEdges = dependencies.filter(
      (d) => d.critical && (d.from === id || d.to === id),
    );
    for (const edge of criticalEdges) {
      impacts.push(`Critical edge: ${edge.from} → ${edge.to} (${edge.kind})`);
    }
  }
  return impacts.slice(0, 10);
}

function inferRequiredTests(
  folders: string[],
  allFolders: FolderIntelligence[],
): string[] {
  const tests = new Set<string>();
  for (const folder of folders) {
    const match = allFolders.find((f) => f.path === folder);
    for (const t of match?.relatedTests ?? []) tests.add(t);
  }
  if (tests.size === 0) {
    tests.add("pillow/src/validation/tests");
    tests.add("backend/src/validation/tests");
  }
  return [...tests];
}

function inferArchitecturalRisks(
  componentIds: string[],
  components: ComponentIntelligence[],
  criticalPaths: string[],
): string[] {
  const risks: string[] = [];
  for (const id of componentIds) {
    if (criticalPaths.includes(id)) {
      risks.push(`Critical path component: ${id}`);
    }
    const comp = components.find((c) => c.id === id);
    if (comp?.criticality === "critical") {
      risks.push(`High criticality: ${comp.name} (${comp.rootPath})`);
    }
  }
  return risks;
}

function buildRecommendation(
  components: string[],
  folders: string[],
  risks: string[],
): string {
  if (components.length === 0 && folders.length === 0) {
    return "Run impact analysis with a target path or keyword before implementation.";
  }
  if (risks.length > 0) {
    return `Review critical path impact · run required tests · obtain Grand King approval if production-affecting. Risks: ${risks.slice(0, 2).join("; ")}`;
  }
  return `Affected: ${components.length} components · ${folders.length} folders · run pillow and backend validation tests before merge.`;
}

/** Search repository architecture index. */
export function searchRepositoryArchitecture(
  model: RepositoryKnowledgeModel,
  query: string,
  limit = 20,
): RepositoryKnowledgeModel["architectureIntelligence"]["searchIndex"] {
  const q = query.trim().toLowerCase();
  if (!q) return model.architectureIntelligence.searchIndex.slice(0, limit);

  return model.architectureIntelligence.searchIndex
    .filter(
      (entry) =>
        entry.label.toLowerCase().includes(q) ||
        entry.path.toLowerCase().includes(q) ||
        entry.snippet.toLowerCase().includes(q) ||
        entry.kind.toLowerCase().includes(q),
    )
    .slice(0, limit);
}

export function buildSearchIndex(input: {
  components: ComponentIntelligence[];
  folders: FolderIntelligence[];
  files: FileIntelligenceEntry[];
}): RepositoryKnowledgeModel["architectureIntelligence"]["searchIndex"] {
  const index: RepositoryKnowledgeModel["architectureIntelligence"]["searchIndex"] = [];

  for (const c of input.components) {
    index.push({
      id: `component:${c.id}`,
      kind: "component",
      label: c.name,
      path: c.rootPath,
      snippet: c.purpose,
    });
  }
  for (const f of input.folders) {
    index.push({
      id: `folder:${f.path}`,
      kind: "folder",
      label: f.path,
      path: f.path,
      snippet: f.purpose,
    });
  }
  for (const file of input.files) {
    index.push({
      id: `file:${file.path}`,
      kind: "file",
      label: file.path.split("/").pop() ?? file.path,
      path: file.path,
      snippet: file.purpose,
    });
  }

  return index;
}
