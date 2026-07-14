import type { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CodeModuleEntry, FolderIntelligence, RepositoryDomainSummary } from "./types.js";

const FOLDER_CATALOG: Array<{
  path: string;
  purpose: string;
  owner: string;
  businessRelevance: string;
  editingBoundaries: string;
}> = [
  {
    path: "pillow/src",
    purpose: "Pillow intelligence package — bootstrap, context, OpenAI, P4–P7 engines",
    owner: "Pillow Runtime",
    businessRelevance: "All executive reasoning and mission orchestration",
    editingBoundaries: "Minimal diff · match subsystem patterns · add tests",
  },
  {
    path: "backend/src/orchestration/pillow-host",
    purpose: "In-process Pillow host — sessions, chat routing, subsystem APIs",
    owner: "Brain Orchestration",
    businessRelevance: "Grand King chat and Cockpit live data",
    editingBoundaries: "Mirror pillow-host bridge pattern for new routes",
  },
  {
    path: "empireai-web",
    purpose: "Next.js Cockpit — Founder Shell, BFF, executive UI",
    owner: "Cockpit Frontend",
    businessRelevance: "Grand King operating environment",
    editingBoundaries: "SCR registry · navigation.ts · no duplicate dashboards",
  },
  {
    path: "backend/src/brain",
    purpose: "Brain API — auth, LLM, dispatch, queue",
    owner: "Brain API",
    businessRelevance: "Mandatory orchestration execution path",
    editingBoundaries: "Constitutional dispatch · permissions matrix",
  },
  {
    path: "docs/governance",
    purpose: "Canonical governance doctrines and mission registers",
    owner: "Repository Governance",
    businessRelevance: "Constitutional source of truth",
    editingBoundaries: "Tier 3 law format · cross-reference hierarchy",
  },
  {
    path: "deployment",
    purpose: "Railway, Vercel, managed deployment truth",
    owner: "Infrastructure",
    businessRelevance: "Production deployment authority",
    editingBoundaries: "MANAGED_DEPLOYMENT.md alignment",
  },
];

/** Build folder intelligence for major repository folders. */
export async function buildFolderIntelligence(input: {
  reader: RepositoryReader;
  modules: CodeModuleEntry[];
  domains: RepositoryDomainSummary[];
}): Promise<FolderIntelligence[]> {
  const folders: FolderIntelligence[] = [];

  for (const entry of FOLDER_CATALOG) {
    if (!(await input.reader.exists(entry.path))) continue;
    const files = await input.reader.listFiles(entry.path);
    const subdirs = await input.reader.listSubdirs(entry.path);
    let fileCount = files.length;
    for (const sub of subdirs.slice(0, 6)) {
      if (sub === "node_modules") continue;
      const nested = await input.reader.listFiles(`${entry.path}/${sub}`);
      fileCount += nested.length;
    }

    const moduleDeps = input.modules
      .filter((m) => m.rootPath.startsWith(entry.path))
      .map((m) => m.owner);

    folders.push({
      path: entry.path,
      purpose: entry.purpose,
      owner: entry.owner,
      responsibilities: [`Own ${entry.path} artifacts`, `Maintain ${entry.owner} conventions`],
      interfaces: files.filter((f) => f === "index.ts" || f.endsWith("routes.ts")).map(
        (f) => `${entry.path}/${f}`,
      ),
      dependencies: [...new Set(moduleDeps)].slice(0, 5),
      relatedTests: inferRelatedTests(entry.path),
      businessRelevance: entry.businessRelevance,
      editingBoundaries: entry.editingBoundaries,
      fileCount,
    });
  }

  for (const domain of input.domains) {
    if (folders.some((f) => f.path === domain.rootPath)) continue;
    folders.push({
      path: domain.rootPath,
      purpose: domain.description,
      owner: domain.name,
      responsibilities: [`Domain: ${domain.name}`],
      interfaces: [],
      dependencies: [],
      relatedTests: inferRelatedTests(domain.rootPath),
      businessRelevance: domain.description,
      editingBoundaries: "Follow EMPIREAI_REPOSITORY_STRUCTURE.md",
      fileCount: domain.artifactCount,
    });
  }

  return folders;
}

function inferRelatedTests(rootPath: string): string[] {
  if (rootPath.startsWith("pillow")) return ["pillow/src/validation/tests"];
  if (rootPath.startsWith("backend")) return ["backend/src/validation/tests"];
  if (rootPath.startsWith("empireai-web")) return ["empireai-web (component tests via build)"];
  return [];
}
