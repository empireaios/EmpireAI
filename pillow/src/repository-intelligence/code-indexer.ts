import type { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CodeModuleEntry, DependencyLink, ScreenRouteEntry } from "./types.js";
import { ARCHITECTURE_BOUNDARIES } from "./architecture-registry.js";

const SCAN_ROOTS: Array<{
  relativeDir: string;
  layer: CodeModuleEntry["layer"];
  owner: string;
  maxDepth: number;
}> = [
  { relativeDir: "backend/src/brain", layer: "brain", owner: "Brain API", maxDepth: 2 },
  { relativeDir: "backend/src/orchestration/pillow-host", layer: "pillow", owner: "Pillow Host", maxDepth: 2 },
  { relativeDir: "backend/src/orchestration/business-automation", layer: "automation", owner: "Business Automation", maxDepth: 2 },
  { relativeDir: "backend/src/registry", layer: "business_engine", owner: "Registry Loader", maxDepth: 2 },
  { relativeDir: "backend/src/grand-king", layer: "governance", owner: "Grand King", maxDepth: 2 },
  { relativeDir: "empireai-web/lib/cockpit", layer: "frontend", owner: "Cockpit UI", maxDepth: 3 },
  { relativeDir: "empireai-web/lib/pillow", layer: "frontend", owner: "Pillow Client", maxDepth: 2 },
  { relativeDir: "empireai-web/lib/brain", layer: "bff", owner: "Brain BFF Client", maxDepth: 2 },
  { relativeDir: "empireai-web/components/cockpit", layer: "frontend", owner: "Cockpit Components", maxDepth: 3 },
  { relativeDir: "empireai-web/app/api", layer: "bff", owner: "Next.js API Routes", maxDepth: 3 },
  { relativeDir: "pillow/src/bootstrap", layer: "pillow", owner: "Pillow Bootstrap", maxDepth: 2 },
  { relativeDir: "pillow/src/intelligence", layer: "pillow", owner: "Repository Intelligence", maxDepth: 2 },
  { relativeDir: "pillow/src/repository-intelligence", layer: "pillow", owner: "Phase 2 Repository Intelligence", maxDepth: 2 },
  { relativeDir: "pillow/src/context", layer: "pillow", owner: "Context Builder", maxDepth: 2 },
  { relativeDir: "pillow/src/openai", layer: "pillow", owner: "OpenAI Integration", maxDepth: 2 },
  { relativeDir: "pillow/src/validation/tests", layer: "pillow", owner: "Pillow Validation Tests", maxDepth: 1 },
  { relativeDir: "backend/src/validation/tests", layer: "brain", owner: "Backend Validation Tests", maxDepth: 1 },
  { relativeDir: "backend/src/auth", layer: "brain", owner: "Auth & Permissions", maxDepth: 2 },
  { relativeDir: "backend/src/orchestration", layer: "brain", owner: "Orchestration Layer", maxDepth: 1 },
  { relativeDir: "docs/governance", layer: "governance", owner: "Governance Docs", maxDepth: 1 },
  { relativeDir: "docs/architecture", layer: "governance", owner: "Architecture Docs", maxDepth: 1 },
  { relativeDir: "deployment", layer: "deployment", owner: "Deployment Docs", maxDepth: 1 },
  { relativeDir: "empireai-web/lib/cockpit/global-assistant", layer: "frontend", owner: "Global AI Assistant", maxDepth: 2 },
];

/** Known Cockpit screen routes → component paths. */
export const SCREEN_ROUTES: ScreenRouteEntry[] = [
  {
    route: "/cockpit/development/pillow",
    componentPath: "empireai-web/components/cockpit/development/DevelopmentPillowExperience.tsx",
    description: "SCR-800 Pillow Chat experience",
  },
  {
    route: "/cockpit",
    componentPath: "empireai-web/app/cockpit/page.tsx",
    description: "Executive Home",
  },
  {
    route: "/cockpit/development",
    componentPath: "empireai-web/app/cockpit/development/page.tsx",
    description: "Development department hub",
  },
  {
    route: "/login",
    componentPath: "empireai-web/app/login/page.tsx",
    description: "Authentication login",
  },
];

export async function indexCodeModules(reader: RepositoryReader): Promise<{
  modules: CodeModuleEntry[];
  indexedPaths: number;
}> {
  const modules: CodeModuleEntry[] = [];
  let indexedPaths = 0;

  for (const root of SCAN_ROOTS) {
    if (!(await reader.exists(root.relativeDir))) continue;

    const entryFiles = await collectEntryFiles(reader, root.relativeDir, root.maxDepth);
    indexedPaths += entryFiles.length;

    const name = root.relativeDir.split("/").pop() ?? root.relativeDir;
    modules.push({
      id: root.relativeDir.replace(/\//g, ":"),
      name,
      layer: root.layer,
      rootPath: root.relativeDir,
      owner: root.owner,
      entryFiles: entryFiles.slice(0, 12),
    });
  }

  for (const boundary of ARCHITECTURE_BOUNDARIES) {
    if (modules.some((m) => m.rootPath === boundary.rootPath)) continue;
    if (!(await reader.exists(boundary.rootPath))) continue;
    modules.push({
      id: boundary.id,
      name: boundary.name,
      layer: boundary.layer,
      rootPath: boundary.rootPath,
      owner: boundary.owner,
      entryFiles: [],
    });
  }

  return { modules, indexedPaths };
}

export function buildArchitectureDependencies(): DependencyLink[] {
  const links: DependencyLink[] = [];

  for (const boundary of ARCHITECTURE_BOUNDARIES) {
    for (const dep of boundary.dependsOn) {
      links.push({
        from: boundary.id,
        to: dep,
        kind: "runtime",
        critical: boundary.id === "pillow-host" || boundary.id === "bff",
      });
    }
  }

  links.push(
    { from: "bff", to: "brain", kind: "proxies", critical: true },
    { from: "cockpit", to: "bff", kind: "imports", critical: true },
    { from: "pillow-host", to: "pillow-package", kind: "imports", critical: true },
    { from: "brain", to: "redis", kind: "runtime", critical: false },
    { from: "worker", to: "redis", kind: "runtime", critical: true },
    { from: "vercel", to: "railway", kind: "deploys", critical: true },
    { from: "railway", to: "github", kind: "deploys", critical: true },
  );

  return links;
}

async function collectEntryFiles(
  reader: RepositoryReader,
  relativeDir: string,
  maxDepth: number,
  depth = 0,
): Promise<string[]> {
  if (depth > maxDepth) return [];

  const files = await reader.listFiles(relativeDir);
  const paths = files
    .filter((f) => /\.(ts|tsx|md|json|toml)$/i.test(f))
    .map((f) => `${relativeDir}/${f}`.replace(/\\/g, "/"));

  if (depth >= maxDepth) return paths;

  const subdirs = await reader.listSubdirs(relativeDir);
  for (const sub of subdirs) {
    if (sub === "node_modules" || sub === "dist") continue;
    const nested = await collectEntryFiles(
      reader,
      `${relativeDir}/${sub}`.replace(/\\/g, "/"),
      maxDepth,
      depth + 1,
    );
    paths.push(...nested);
  }

  return paths;
}

export function findModuleByKeyword(
  modules: CodeModuleEntry[],
  keyword: string,
): CodeModuleEntry[] {
  const q = keyword.toLowerCase();
  return modules.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.rootPath.toLowerCase().includes(q) ||
      m.owner.toLowerCase().includes(q) ||
      m.entryFiles.some((f) => f.toLowerCase().includes(q)),
  );
}

export function findScreenByKeyword(screens: ScreenRouteEntry[], keyword: string): ScreenRouteEntry[] {
  const q = keyword.toLowerCase();
  return screens.filter(
    (s) =>
      s.route.toLowerCase().includes(q) ||
      s.componentPath.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q),
  );
}
