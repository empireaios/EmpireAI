import type { RepositoryReader } from "../bootstrap/repository-reader.js";
import { ARCHITECTURE_BOUNDARIES } from "./architecture-registry.js";
import {
  SCREEN_ROUTES,
  buildArchitectureDependencies,
  indexCodeModules,
} from "./code-indexer.js";
import { MISSION_REGISTRY } from "./mission-registry.js";
import { RUNTIME_FLOWS } from "./runtime-flows.js";
import { discoverRepositoryInventory } from "./repository-discovery.js";
import { buildComponentIntelligence } from "./component-intelligence.js";
import { buildFolderIntelligence } from "./folder-intelligence.js";
import { buildFileIntelligence } from "./file-intelligence.js";
import { buildDependencyGraphIntelligence } from "./dependency-intelligence.js";
import { getAllExecutionFlows } from "./execution-flows-extended.js";
import { buildSearchIndex } from "./impact-analysis.js";
import type { RepositoryArchitectureIntelligence, RepositoryDomainSummary, RepositoryKnowledgeModel } from "./types.js";

const DOMAIN_CATALOG: Array<{
  id: string;
  name: string;
  rootPath: string;
  description: string;
}> = [
  { id: "source", name: "Source Code", rootPath: "backend/src", description: "Brain API, orchestration, registry, auth" },
  { id: "frontend", name: "Cockpit Frontend", rootPath: "empireai-web", description: "Next.js Cockpit, BFF, Pillow client" },
  { id: "pillow", name: "Pillow Package", rootPath: "pillow/src", description: "Bootstrap, intelligence, context, OpenAI layer" },
  { id: "governance", name: "Governance Artifacts", rootPath: "docs/governance", description: "Doctrines, registers, ADR supplements" },
  { id: "architecture-docs", name: "Architecture Documentation", rootPath: "docs/architecture", description: "Canonical architecture references" },
  { id: "root-governance", name: "Root Governance", rootPath: ".", description: "JOURNEY, contracts, constitution, status" },
  { id: "deployment", name: "Deployment & Infrastructure", rootPath: "deployment", description: "Railway, Vercel, managed deployment" },
  { id: "tests-pillow", name: "Pillow Tests", rootPath: "pillow/src/validation/tests", description: "Pillow subsystem validation suite" },
  { id: "tests-backend", name: "Backend Tests", rootPath: "backend/src/validation/tests", description: "Brain and orchestration validation suite" },
];

/** Build unified Phase 2 repository knowledge model. */
export async function buildRepositoryKnowledgeModel(
  reader: RepositoryReader,
): Promise<RepositoryKnowledgeModel> {
  const { modules, indexedPaths } = await indexCodeModules(reader);
  const dependencies = buildArchitectureDependencies();
  const domains = await buildDomainSummaries(reader);
  const criticalPaths = deriveCriticalPaths(dependencies);
  const architectureIntelligence = await buildArchitectureIntelligence({
    reader,
    modules,
    dependencies,
    domains,
    indexedPaths,
    criticalPaths,
  });

  return {
    version: "PILLOW-RI-002",
    builtAt: new Date().toISOString(),
    architecture: ARCHITECTURE_BOUNDARIES,
    runtimeFlows: RUNTIME_FLOWS,
    modules,
    screens: SCREEN_ROUTES,
    dependencies,
    indexedPaths,
    domains,
    criticalPaths,
    missions: MISSION_REGISTRY,
    architectureIntelligence,
  };
}

async function buildArchitectureIntelligence(input: {
  reader: RepositoryReader;
  modules: RepositoryKnowledgeModel["modules"];
  dependencies: RepositoryKnowledgeModel["dependencies"];
  domains: RepositoryDomainSummary[];
  indexedPaths: number;
  criticalPaths: string[];
}): Promise<RepositoryArchitectureIntelligence> {
  const inventory = await discoverRepositoryInventory(input.reader, input.indexedPaths);
  const components = buildComponentIntelligence({
    architecture: ARCHITECTURE_BOUNDARIES,
    modules: input.modules,
    dependencies: input.dependencies,
    criticalPaths: input.criticalPaths,
  });
  const folders = await buildFolderIntelligence({
    reader: input.reader,
    modules: input.modules,
    domains: input.domains,
  });
  const files = await buildFileIntelligence({
    reader: input.reader,
    modules: input.modules,
    criticalPaths: input.criticalPaths,
  });
  const dependencyGraph = buildDependencyGraphIntelligence({
    dependencies: input.dependencies,
    components,
    architecture: ARCHITECTURE_BOUNDARIES,
  });
  const executionFlows = getAllExecutionFlows();
  const searchIndex = buildSearchIndex({ components, folders, files });

  return {
    inventory,
    components,
    folders,
    files,
    dependencyGraph,
    executionFlows,
    searchIndex,
  };
}

/** Compact summary for LLM context assembly. */
export function formatKnowledgeModelSummary(model: RepositoryKnowledgeModel): string {
  const layers = [...new Set(model.architecture.map((b) => `${b.name} (${b.layer})`))];
  const domainList = model.domains.map((d) => `${d.name}: ${d.rootPath} (${d.artifactCount} files)`).join("; ");
  const flows = model.runtimeFlows.map((f) => f.name).join(", ");
  const critical = model.criticalPaths.join(" → ");

  return [
    `Repository Intelligence ${model.version} — ${model.indexedPaths} indexed paths`,
    `Architecture intelligence: ${model.architectureIntelligence.components.length} components · ${model.architectureIntelligence.folders.length} folders · ${model.architectureIntelligence.files.length} files`,
    `Architecture layers: ${layers.join("; ")}`,
    `Domains: ${domainList}`,
    `Runtime flows: ${flows}`,
    `Critical path: ${critical}`,
    `Registered missions: ${model.missions.map((m) => m.id).join(", ")}`,
  ].join("\n");
}

async function buildDomainSummaries(
  reader: RepositoryReader,
): Promise<RepositoryDomainSummary[]> {
  const domains: RepositoryDomainSummary[] = [];

  for (const entry of DOMAIN_CATALOG) {
    if (!(await reader.exists(entry.rootPath))) continue;

    let artifactCount = 0;
    if (entry.rootPath === ".") {
      const rootFiles = await reader.listFiles(".");
      artifactCount = rootFiles.filter((f) => /\.(md|json|toml)$/i.test(f)).length;
    } else {
      const files = await reader.listFiles(entry.rootPath);
      artifactCount = files.length;
      const subdirs = await reader.listSubdirs(entry.rootPath);
      for (const sub of subdirs.slice(0, 8)) {
        if (sub === "node_modules" || sub === "dist") continue;
        const nested = await reader.listFiles(`${entry.rootPath}/${sub}`);
        artifactCount += nested.length;
      }
    }

    domains.push({
      id: entry.id,
      name: entry.name,
      rootPath: entry.rootPath,
      artifactCount,
      description: entry.description,
    });
  }

  return domains;
}

function deriveCriticalPaths(dependencies: RepositoryKnowledgeModel["dependencies"]): string[] {
  const critical = dependencies.filter((d) => d.critical);
  const chain = ["cockpit", "bff", "brain", "pillow-host", "pillow-package"];
  const inChain = chain.filter((id) =>
    critical.some((d) => d.from === id || d.to === id),
  );
  return inChain.length > 0 ? inChain : ["cockpit", "bff", "brain", "pillow-host"];
}
