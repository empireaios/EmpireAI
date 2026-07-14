import type { RepositoryReader } from "../bootstrap/repository-reader.js";
import { ARCHITECTURE_BOUNDARIES } from "./architecture-registry.js";
import type { RepositoryInventory } from "./types.js";

const PACKAGE_PATHS = [
  { path: "pillow/package.json", name: "@empireai/pillow" },
  { path: "backend/package.json", name: "@empireai/backend" },
  { path: "empireai-web/package.json", name: "empireai-web" },
  { path: "frontend/package.json", name: "empireai-founder-shell" },
];

const TOP_LEVEL_SCAN = [
  "backend",
  "empireai-web",
  "pillow",
  "frontend",
  "docs",
  "deployment",
  "scripts",
];

/** Discover complete repository inventory (PILLOW-RI-002). */
export async function discoverRepositoryInventory(
  reader: RepositoryReader,
  indexedPaths: number,
): Promise<RepositoryInventory> {
  const topLevelFolders: string[] = [];
  const fileCounts: Record<string, number> = {
    typescript: 0,
    tsx: 0,
    markdown: 0,
    json: 0,
    test: 0,
  };

  for (const dir of TOP_LEVEL_SCAN) {
    if (await reader.exists(dir)) topLevelFolders.push(dir);
  }

  const packages: RepositoryInventory["packages"] = [];
  for (const pkg of PACKAGE_PATHS) {
    if (await reader.exists(pkg.path)) {
      packages.push({ name: pkg.name, path: pkg.path });
    }
  }

  const countPaths = async (root: string, maxFiles = 500): Promise<void> => {
    if (!(await reader.exists(root))) return;
    const files = await reader.listFiles(root);
    for (const f of files) {
      if (f.endsWith(".ts") && !f.endsWith(".tsx")) fileCounts.typescript = (fileCounts.typescript ?? 0) + 1;
      if (f.endsWith(".tsx")) fileCounts.tsx = (fileCounts.tsx ?? 0) + 1;
      if (f.endsWith(".md")) fileCounts.markdown = (fileCounts.markdown ?? 0) + 1;
      if (f.endsWith(".json")) fileCounts.json = (fileCounts.json ?? 0) + 1;
      if (/\.test\.(ts|tsx)$/i.test(f)) fileCounts.test = (fileCounts.test ?? 0) + 1;
    }
    if (files.length >= maxFiles) return;
    const subdirs = await reader.listSubdirs(root);
    for (const sub of subdirs.slice(0, 12)) {
      if (sub === "node_modules" || sub === "dist" || sub === ".git") continue;
      await countPaths(`${root}/${sub}`, maxFiles - files.length);
    }
  };

  await countPaths("backend/src", 300);
  await countPaths("empireai-web", 300);
  await countPaths("pillow/src", 300);

  const services = ARCHITECTURE_BOUNDARIES.filter(
    (b) => b.layer === "brain" || b.layer === "pillow" || b.layer === "bff",
  ).map((b) => b.name);

  const apis = [
    "backend/src/brain",
    "backend/src/orchestration",
    "empireai-web/app/api",
  ].filter((p) => true);

  const uiSurfaces = ARCHITECTURE_BOUNDARIES.filter((b) => b.layer === "frontend").map(
    (b) => b.rootPath,
  );

  const businessEngines = [
    "backend/src/orchestration/business-automation",
    "backend/src/registry",
    "backend/src/orchestration/commerce-readiness-engine",
    "backend/src/intelligence",
  ];

  const pillowModules = (await reader.exists("pillow/src"))
    ? (await reader.listSubdirs("pillow/src")).filter(
        (d) => !["validation", "node_modules"].includes(d),
      )
    : [];

  return {
    topLevelFolders,
    packages,
    fileCounts,
    totalIndexedFiles: indexedPaths,
    services,
    apis,
    uiSurfaces,
    businessEngines,
    pillowModules,
    infrastructurePaths: ["deployment", "backend/src/brain/queue", "backend/src/infrastructure"].filter(
      (p) => true,
    ),
    testPaths: [
      "pillow/src/validation/tests",
      "backend/src/validation/tests",
      "empireai-web",
    ],
    documentationPaths: [
      "docs/governance",
      "docs/architecture",
      "docs/audits",
      ".",
    ],
  };
}
