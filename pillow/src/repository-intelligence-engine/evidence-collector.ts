import type { RepositoryIntelligenceEngineConfiguration } from "./configuration.js";
import type { RepositoryIntelligenceEngineDependencies } from "./integrations.js";
import { nextSnapshotId } from "./audit-store.js";
import {
  classifyArchitectureLayer,
  computeRepositoryFingerprint,
  extractExportNames,
  extractImportSpecifiers,
  ENGINE_ID_PATTERN,
  MISSION_ID_PATTERN,
  resolveRelativeImport,
  scanRepository,
  type ScannedFile,
} from "./repository-scanner.js";
import type {
  ArchitectureLayerSummary,
  ConflictEntry,
  DependencyEdge,
  DependencyGraph,
  DependencyNode,
  ExistingImplementationEntry,
  IntegrationGraph,
  ModuleInventoryEntry,
  Q1301ContractObservation,
  Q1302ContractConsumed,
  Q1302Prerequisite,
  Q1301MissionPrerequisite,
  RepositoryIntelligenceSnapshot,
  ReusableComponentEntry,
  RiskEntry,
  ServiceInventoryEntry,
  TechnicalDebtFinding,
} from "./types.js";

const SERVICE_KIND_PATTERNS: Array<{ kind: ServiceInventoryEntry["kind"]; pattern: RegExp }> = [
  { kind: "engine", pattern: /engine\.(ts|js)$/i },
  { kind: "controller", pattern: /controller\.(ts|js)$/i },
  { kind: "manager", pattern: /manager\.(ts|js)$/i },
  { kind: "route", pattern: /routes?\.(ts|js)$/i },
  { kind: "bridge", pattern: /bridge\.(ts|js)$/i },
  { kind: "service", pattern: /service\.(ts|js)$/i },
];

function moduleIdFromPath(relativePath: string): string {
  const parts = relativePath.split("/");
  if (parts.length >= 2) return parts.slice(0, -1).join("/");
  return relativePath.replace(/\.[^.]+$/, "");
}

function groupFilesByModule(files: ScannedFile[]): Map<string, ScannedFile[]> {
  const modules = new Map<string, ScannedFile[]>();
  for (const file of files) {
    const modulePath = moduleIdFromPath(file.relativePath);
    const existing = modules.get(modulePath) ?? [];
    existing.push(file);
    modules.set(modulePath, existing);
  }
  return modules;
}

export function buildModuleInventory(files: ScannedFile[]): ModuleInventoryEntry[] {
  const modules = groupFilesByModule(files);
  const inventory: ModuleInventoryEntry[] = [];
  for (const [modulePath, moduleFiles] of modules.entries()) {
    const sourceTypes = Array.from(new Set(moduleFiles.map((file) => file.sourceType))).sort();
    inventory.push({
      moduleId: modulePath.replace(/\//g, "-"),
      path: modulePath,
      fileCount: moduleFiles.length,
      sourceTypes,
      evidencePaths: moduleFiles.map((file) => file.relativePath).slice(0, 5),
    });
  }
  return inventory.sort((a, b) => a.path.localeCompare(b.path));
}

export function buildServiceInventory(files: ScannedFile[]): ServiceInventoryEntry[] {
  const services: ServiceInventoryEntry[] = [];
  for (const file of files) {
    if (!file.content) continue;
    for (const { kind, pattern } of SERVICE_KIND_PATTERNS) {
      if (!pattern.test(file.relativePath)) continue;
      const exportHints = extractExportNames(file.content);
      services.push({
        serviceId: `${kind}-${file.relativePath.replace(/[^\w]+/g, "-")}`,
        kind,
        path: file.relativePath,
        exportHints,
        evidencePaths: [file.relativePath],
      });
      break;
    }
  }
  return services.sort((a, b) => a.path.localeCompare(b.path));
}

export function buildDependencyGraph(
  files: ScannedFile[],
  repositoryRoot: string,
): DependencyGraph {
  const nodeMap = new Map<string, DependencyNode>();
  const edges: DependencyEdge[] = [];
  const adjacency = new Map<string, Set<string>>();

  for (const file of files) {
    if (!file.content) continue;
    if (file.sourceType !== "typescript" && file.sourceType !== "javascript") continue;
    nodeMap.set(file.relativePath, { id: file.relativePath, path: file.relativePath, kind: "file" });
    const specifiers = extractImportSpecifiers(file.content);
    for (const specifier of specifiers) {
      let classification: DependencyEdge["classification"] = "external";
      let target = specifier;
      if (specifier.startsWith(".")) {
        const resolved = resolveRelativeImport(file.relativePath, specifier, repositoryRoot);
        if (resolved) {
          classification = "internal";
          target = resolved;
          nodeMap.set(resolved, { id: resolved, path: resolved, kind: "file" });
        } else {
          classification = "unresolved";
          target = `${file.relativePath}=>${specifier}`;
          nodeMap.set(target, { id: target, path: target, kind: "unresolved" });
        }
      } else {
        nodeMap.set(specifier, { id: specifier, path: specifier, kind: "external" });
      }
      edges.push({ from: file.relativePath, to: target, specifier, classification });
      if (classification === "internal") {
        const set = adjacency.get(file.relativePath) ?? new Set<string>();
        set.add(target);
        adjacency.set(file.relativePath, set);
      }
    }
  }

  const cycles = detectCycles(adjacency);
  const unresolvedCount = edges.filter((edge) => edge.classification === "unresolved").length;
  const externalCount = edges.filter((edge) => edge.classification === "external").length;
  const internalCount = edges.filter((edge) => edge.classification === "internal").length;

  return {
    nodes: Array.from(nodeMap.values()).sort((a, b) => a.id.localeCompare(b.id)),
    edges: edges.sort((a, b) => `${a.from}->${a.to}`.localeCompare(`${b.from}->${b.to}`)),
    cycles,
    unresolvedCount,
    externalCount,
    internalCount,
    computedAt: new Date().toISOString(),
  };
}

function detectCycles(adjacency: Map<string, Set<string>>): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string) {
    if (stack.has(node)) {
      const start = path.indexOf(node);
      if (start >= 0) cycles.push(path.slice(start).concat(node));
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    stack.add(node);
    path.push(node);
    for (const next of adjacency.get(node) ?? []) dfs(next);
    path.pop();
    stack.delete(node);
  }

  for (const node of adjacency.keys()) dfs(node);
  return cycles.slice(0, 20);
}

export function buildIntegrationGraph(
  files: ScannedFile[],
  dependencyGraph: DependencyGraph,
): IntegrationGraph {
  const integrationFiles = files.filter(
    (file) =>
      file.relativePath.endsWith("integrations.ts") ||
      file.relativePath.endsWith("session.ts") ||
      file.relativePath.includes("/routes/"),
  );
  const nodes = integrationFiles.map((file) => ({
    id: file.relativePath,
    path: file.relativePath,
    integrationHints: (file.content ?? "")
      .split("\n")
      .filter((line) => /bindIntegrations|connect|import.*bridge|Runtime/i.test(line))
      .slice(0, 5)
      .map((line) => line.trim()),
  }));

  const edges: IntegrationGraph["edges"] = [];
  for (const node of nodes) {
    const related = dependencyGraph.edges.filter((edge) => edge.from === node.path && edge.classification === "internal");
    for (const edge of related.slice(0, 10)) {
      edges.push({
        from: node.path,
        to: edge.to,
        relationship: "dependency",
        evidence: edge.specifier,
      });
    }
  }

  return {
    nodes: nodes.sort((a, b) => a.id.localeCompare(b.id)),
    edges: edges.sort((a, b) => `${a.from}->${a.to}`.localeCompare(`${b.from}->${b.to}`)),
    computedAt: new Date().toISOString(),
  };
}

export function buildArchitectureLayers(
  files: ScannedFile[],
  moduleInventory: ModuleInventoryEntry[],
): ArchitectureLayerSummary[] {
  const layerMap = new Map<string, { paths: string[]; modules: Set<string> }>();
  for (const file of files) {
    const bucket = layerMap.get(file.layer) ?? { paths: [], modules: new Set<string>() };
    bucket.paths.push(file.relativePath);
    bucket.modules.add(moduleIdFromPath(file.relativePath));
    layerMap.set(file.layer, bucket);
  }

  const summaries: ArchitectureLayerSummary[] = [];
  for (const [layer, bucket] of layerMap.entries()) {
    const constraints: string[] = [];
    const violations: string[] = [];
    if (layer === "pillow") constraints.push("Pillow runtime modules must not import backend internals directly");
    if (layer === "backend") constraints.push("Backend bridges should delegate to Pillow session");
    if (layer === "web") constraints.push("Web layer should consume backend APIs only");

    for (const filePath of bucket.paths) {
      const file = files.find((candidate) => candidate.relativePath === filePath);
      if (!file?.content) continue;
      if (layer === "pillow" && /from\s+['"]\.\.\/\.\.\/backend/.test(file.content)) {
        violations.push(`${filePath}: direct backend import from pillow layer`);
      }
    }

    summaries.push({
      layer: layer as ArchitectureLayerSummary["layer"],
      pathCount: bucket.paths.length,
      moduleCount: bucket.modules.size,
      constraints,
      violations,
      evidencePaths: bucket.paths.slice(0, 5),
    });
  }

  return summaries.sort((a, b) => a.layer.localeCompare(b.layer));
}

export function detectExistingImplementations(files: ScannedFile[]): ExistingImplementationEntry[] {
  const entries = new Map<string, ExistingImplementationEntry>();
  for (const file of files) {
    if (!file.content) continue;
    const missionMatches = file.content.match(MISSION_ID_PATTERN) ?? [];
    const engineMatches = file.content.match(ENGINE_ID_PATTERN) ?? [];
    const identities = new Set([...missionMatches, ...engineMatches]);
    for (const identity of identities) {
      const key = identity.toUpperCase();
      const existing = entries.get(key) ?? {
        identity: key,
        missionId: /^Q/i.test(key) ? key : null,
        engineId: /^PILLOW/i.test(key) ? key : null,
        paths: [],
        evidence: [],
      };
      if (!existing.paths.includes(file.relativePath)) existing.paths.push(file.relativePath);
      existing.evidence.push(`${file.relativePath}:${identity}`);
      entries.set(key, existing);
    }
  }
  return Array.from(entries.values()).sort((a, b) => a.identity.localeCompare(b.identity));
}

export function identifyReusableComponents(
  files: ScannedFile[],
  dependencyGraph: DependencyGraph,
): ReusableComponentEntry[] {
  const exportMap = new Map<string, { path: string; exports: string[] }>();
  for (const file of files) {
    if (!file.content) continue;
    const exports = extractExportNames(file.content);
    if (exports.length > 0) exportMap.set(file.relativePath, { path: file.relativePath, exports });
  }

  const dependentCount = new Map<string, number>();
  for (const edge of dependencyGraph.edges) {
    if (edge.classification !== "internal") continue;
    dependentCount.set(edge.to, (dependentCount.get(edge.to) ?? 0) + 1);
  }

  const reusable: ReusableComponentEntry[] = [];
  for (const [path, info] of exportMap.entries()) {
    const dependents = dependentCount.get(path) ?? 0;
    if (info.exports.length >= 2 || dependents >= 2) {
      reusable.push({
        componentId: path.replace(/[^\w]+/g, "-"),
        path,
        exportCount: info.exports.length,
        dependentCount: dependents,
        evidence: [`exports=${info.exports.length}`, `dependents=${dependents}`, path],
      });
    }
  }
  return reusable.sort((a, b) => b.dependentCount - a.dependentCount || a.path.localeCompare(b.path));
}

export function detectTechnicalDebt(
  files: ScannedFile[],
  moduleInventory: ModuleInventoryEntry[],
  dependencyGraph: DependencyGraph,
  config: RepositoryIntelligenceEngineConfiguration,
): TechnicalDebtFinding[] {
  const findings: TechnicalDebtFinding[] = [];
  let debtSeq = 0;

  for (const edge of dependencyGraph.edges) {
    if (edge.classification !== "unresolved") continue;
    debtSeq += 1;
    findings.push({
      debtId: `debt-unresolved-${String(debtSeq).padStart(4, "0")}`,
      category: "unresolved_import",
      severity: "medium",
      description: `Unresolved import ${edge.specifier} from ${edge.from}`,
      evidencePaths: [edge.from],
    });
  }

  for (const cycle of dependencyGraph.cycles) {
    debtSeq += 1;
    findings.push({
      debtId: `debt-cycle-${String(debtSeq).padStart(4, "0")}`,
      category: "cycle",
      severity: "high",
      description: `Dependency cycle detected: ${cycle.join(" -> ")}`,
      evidencePaths: cycle.slice(0, 3),
    });
  }

  for (const file of files) {
    if (!file.content) continue;
    const lineCount = file.content.split("\n").length;
    if (lineCount >= config.oversizedFileLines) {
      debtSeq += 1;
      findings.push({
        debtId: `debt-oversized-file-${String(debtSeq).padStart(4, "0")}`,
        category: "oversized_file",
        severity: lineCount >= config.oversizedFileLines * 2 ? "high" : "medium",
        description: `Oversized file ${file.relativePath} (${lineCount} lines)`,
        evidencePaths: [file.relativePath],
      });
    }
  }

  for (const module of moduleInventory) {
    if (module.fileCount >= config.oversizedModuleFiles) {
      debtSeq += 1;
      findings.push({
        debtId: `debt-oversized-module-${String(debtSeq).padStart(4, "0")}`,
        category: "oversized_module",
        severity: "medium",
        description: `Oversized module ${module.path} (${module.fileCount} files)`,
        evidencePaths: module.evidencePaths,
      });
    }
    const indexPath = `${module.path}/index.ts`;
    const hasIndex = files.some((file) => file.relativePath === indexPath || file.relativePath === `${module.path}/index.js`);
    if (module.fileCount >= 3 && !hasIndex) {
      debtSeq += 1;
      findings.push({
        debtId: `debt-missing-index-${String(debtSeq).padStart(4, "0")}`,
        category: "missing_index",
        severity: "low",
        description: `Module ${module.path} lacks index export`,
        evidencePaths: module.evidencePaths,
      });
    }
  }

  return findings.sort((a, b) => a.debtId.localeCompare(b.debtId));
}

export function detectConflictsAndDuplicates(files: ScannedFile[]): ConflictEntry[] {
  const exportIndex = new Map<string, string[]>();
  const moduleNames = new Map<string, string[]>();
  const conflicts: ConflictEntry[] = [];
  let conflictSeq = 0;

  for (const file of files) {
    if (!file.content) continue;
    for (const exportName of extractExportNames(file.content)) {
      const paths = exportIndex.get(exportName) ?? [];
      paths.push(file.relativePath);
      exportIndex.set(exportName, paths);
    }
    const moduleName = file.relativePath.split("/").slice(-2, -1)[0] ?? file.relativePath;
    const modulePaths = moduleNames.get(moduleName) ?? [];
    modulePaths.push(file.relativePath);
    moduleNames.set(moduleName, modulePaths);
  }

  for (const [name, paths] of exportIndex.entries()) {
    const uniquePaths = Array.from(new Set(paths));
    if (uniquePaths.length <= 1) continue;
    conflictSeq += 1;
    conflicts.push({
      conflictId: `conflict-export-${String(conflictSeq).padStart(4, "0")}`,
      kind: "duplicate_export",
      name,
      paths: uniquePaths,
      evidence: uniquePaths.map((path) => `${path}:export ${name}`),
    });
  }

  for (const [name, paths] of moduleNames.entries()) {
    const uniqueModules = Array.from(new Set(paths.map((path) => moduleIdFromPath(path))));
    if (uniqueModules.length <= 1) continue;
    conflictSeq += 1;
    conflicts.push({
      conflictId: `conflict-module-${String(conflictSeq).padStart(4, "0")}`,
      kind: "near_duplicate_module",
      name,
      paths: uniqueModules,
      evidence: uniqueModules.map((path) => `module:${path}`),
    });
  }

  return conflicts.sort((a, b) => a.conflictId.localeCompare(b.conflictId));
}

export function buildRiskSummary(
  technicalDebt: TechnicalDebtFinding[],
  prerequisite: Q1302Prerequisite,
  q1301Observation: Q1301ContractObservation,
): RiskEntry[] {
  const risks: RiskEntry[] = [];
  let riskSeq = 0;

  if (!prerequisite.implementationSpecificationEnginePresent) {
    riskSeq += 1;
    risks.push({
      riskId: `risk-q1302-${String(riskSeq).padStart(4, "0")}`,
      category: "prerequisite",
      description: "Q13-01 Implementation Specification Engine missing — repository intelligence confidence reduced",
      severity: "high",
      evidence: prerequisite.evidence,
    });
  }

  for (const debt of technicalDebt.filter((item) => item.severity === "high").slice(0, 10)) {
    riskSeq += 1;
    risks.push({
      riskId: `risk-debt-${String(riskSeq).padStart(4, "0")}`,
      category: debt.category,
      description: debt.description,
      severity: "high",
      evidence: debt.evidencePaths,
    });
  }

  if (q1301Observation.attempted && !q1301Observation.consumed) {
    riskSeq += 1;
    risks.push({
      riskId: `risk-q1301-contract-${String(riskSeq).padStart(4, "0")}`,
      category: "integration",
      description: "Q1301 contract observation attempted but not consumed from aiInnovationFactory",
      severity: "medium",
      evidence: [q1301Observation.evidence],
    });
  }

  return risks;
}

export function observeQ1301Contract(deps: RepositoryIntelligenceEngineDependencies): Q1301ContractObservation {
  const factory = deps.aiInnovationFactory;
  if (!factory?.getQ1301ConsumableContract) {
    return {
      attempted: false,
      consumed: false,
      contractVersion: null,
      fields: [],
      evidence: "aiInnovationFactory not bound or lacks getQ1301ConsumableContract",
    };
  }
  try {
    const contract = factory.getQ1301ConsumableContract();
    return {
      attempted: true,
      consumed: true,
      contractVersion: contract.contractVersion ?? null,
      fields: [...(contract.exposedFields ?? [])],
      evidence: `observed Q1301 contract from aiInnovationFactory consumerMissionId=${contract.consumerMissionId ?? "unknown"}`,
    };
  } catch (error) {
    return {
      attempted: true,
      consumed: false,
      contractVersion: null,
      fields: [],
      evidence: `Q1301 observation failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export function observeQ1302Contract(deps: RepositoryIntelligenceEngineDependencies): Q1302ContractConsumed {
  const engine = deps.implementationSpecificationEngine ?? deps.q1301MissionEngine;
  if (!engine?.getQ1302ConsumableContract) {
    return {
      attempted: false,
      consumed: false,
      contractVersion: null,
      fields: [],
      evidence: "implementationSpecificationEngine not bound or lacks getQ1302ConsumableContract",
    };
  }
  try {
    const contract = engine.getQ1302ConsumableContract();
    const validConsumer = contract.consumerMissionId === "Q13-02";
    return {
      attempted: true,
      consumed: validConsumer,
      contractVersion: contract.contractVersion ?? null,
      fields: [...(contract.exposedFields ?? [])],
      evidence: `consumed Q1302 contract from ISENG consumerMissionId=${contract.consumerMissionId ?? "unknown"}`,
    };
  } catch (error) {
    return {
      attempted: true,
      consumed: false,
      contractVersion: null,
      fields: [],
      evidence: `Q1302 consumption failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function toLegacyPrerequisite(prerequisite: Q1302Prerequisite): Q1301MissionPrerequisite {
  return {
    ...prerequisite,
    q1301MissionPresent: prerequisite.implementationSpecificationEnginePresent,
  };
}

export function verifyQ1302Prerequisite(deps: RepositoryIntelligenceEngineDependencies): Q1302Prerequisite {
  const engine = deps.implementationSpecificationEngine ?? deps.q1301MissionEngine;
  if (engine?.getQ1302ConsumableContract) {
    try {
      const contract = engine.getQ1302ConsumableContract();
      const validConsumer = contract.consumerMissionId === "Q13-02";
      return {
        verified: validConsumer,
        implementationSpecificationEnginePresent: true,
        q1302ContractAvailable: validConsumer,
        outstandingPrerequisiteIssues: validConsumer
          ? []
          : ["ISENG contract consumerMissionId is not Q13-02"],
        evidence: [
          `implementationSpecificationEngine bound with contractVersion=${contract.contractVersion ?? "unknown"}`,
        ],
      };
    } catch (error) {
      return {
        verified: false,
        implementationSpecificationEnginePresent: true,
        q1302ContractAvailable: false,
        outstandingPrerequisiteIssues: ["ISENG present but getQ1302ConsumableContract failed"],
        evidence: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  return {
    verified: false,
    implementationSpecificationEnginePresent: false,
    q1302ContractAvailable: false,
    outstandingPrerequisiteIssues: [
      "Q13-01 Implementation Specification Engine missing — no getQ1302ConsumableContract",
    ],
    evidence: ["implementationSpecificationEngine not bound; Q1302 contract unavailable"],
  };
}

/** @deprecated Use verifyQ1302Prerequisite */
export function verifyQ1301MissionPrerequisite(deps: RepositoryIntelligenceEngineDependencies): Q1301MissionPrerequisite {
  return toLegacyPrerequisite(verifyQ1302Prerequisite(deps));
}

export function computeConfidenceScore(
  prerequisite: Q1302Prerequisite,
  fileCount: number,
  validationDecision: string,
  debtCount: number,
): number {
  let score = 0.55;
  if (fileCount > 0) score += 0.15;
  if (validationDecision === "passed") score += 0.1;
  if (validationDecision === "partial") score += 0.05;
  if (prerequisite.implementationSpecificationEnginePresent && prerequisite.q1302ContractAvailable) score += 0.15;
  if (!prerequisite.implementationSpecificationEnginePresent) score -= 0.2;
  if (debtCount > 50) score -= 0.05;
  if (debtCount > 200) score -= 0.1;
  return Math.max(0.1, Math.min(0.95, Number(score.toFixed(3))));
}

export function buildOutstandingIssues(
  prerequisite: Q1302Prerequisite,
  q1302ContractConsumed: Q1302ContractConsumed,
  q1301Observation?: Q1301ContractObservation,
): string[] {
  const issues = [...prerequisite.outstandingPrerequisiteIssues];
  if (!prerequisite.implementationSpecificationEnginePresent) {
    issues.push("Q13-01 Implementation Specification Engine missing — never certify Q13-01 from RIENG");
  }
  if (q1302ContractConsumed.attempted && q1302ContractConsumed.consumed) {
    issues.push(`q1302ContractConsumed=true contractVersion=${q1302ContractConsumed.contractVersion ?? "unknown"}`);
  }
  if (q1301Observation?.attempted && q1301Observation.consumed) {
    issues.push(`q1301Observation=true contractVersion=${q1301Observation.contractVersion ?? "unknown"}`);
  }
  issues.push("neverImplementQ1303OrLater=true");
  return Array.from(new Set(issues));
}

export function buildRepositorySnapshot(
  repositoryRoot: string,
  config: RepositoryIntelligenceEngineConfiguration,
): { snapshot: RepositoryIntelligenceSnapshot; files: ScannedFile[] } {
  const { files, discovery } = scanRepository(repositoryRoot, config);
  const moduleInventory = buildModuleInventory(files);
  const serviceInventory = buildServiceInventory(files);
  const dependencyGraph = buildDependencyGraph(files, repositoryRoot);
  const integrationGraph = buildIntegrationGraph(files, dependencyGraph);
  const architectureLayers = buildArchitectureLayers(files, moduleInventory);
  const existingImplementations = detectExistingImplementations(files);
  const reusableComponents = identifyReusableComponents(files, dependencyGraph);
  const technicalDebtFindings = detectTechnicalDebt(files, moduleInventory, dependencyGraph, config);
  const conflicts = detectConflictsAndDuplicates(files);

  const snapshot: RepositoryIntelligenceSnapshot = {
    repositorySnapshotId: nextSnapshotId(),
    repositoryVersion: discovery.repositoryVersion,
    repositoryFingerprint: discovery.repositoryFingerprint,
    moduleInventory,
    serviceInventory,
    dependencyGraph,
    integrationGraph,
    architectureLayers,
    existingImplementations,
    reusableComponents,
    technicalDebtFindings,
    conflicts,
    risks: [],
    timestamp: new Date().toISOString(),
  };

  return { snapshot, files };
}

export function wrapLegacyIntelligenceContext(
  deps: RepositoryIntelligenceEngineDependencies,
  files: ScannedFile[],
): string[] {
  const evidence: string[] = [];
  const context = deps.intelligenceContext as { getState?: () => unknown } | null | undefined;
  if (context?.getState) {
    try {
      context.getState();
      evidence.push("intelligenceContext.getState() available — legacy PILLOW-003 context observed");
    } catch {
      evidence.push("intelligenceContext bound but getState failed");
    }
  }
  if (files.some((file) => file.relativePath.includes("repository-intelligence/"))) {
    evidence.push("legacy PILLOW-RI-002 repository-intelligence module detected in scan scope");
  }
  return evidence;
}

export { scanRepository, classifyArchitectureLayer, computeRepositoryFingerprint };
