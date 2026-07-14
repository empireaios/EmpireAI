import type { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CodeModuleEntry, CriticalityLevel, FileIntelligenceEntry } from "./types.js";

const IMPORTANT_FILE_PATTERNS = [
  /index\.ts$/,
  /engine\.ts$/,
  /page\.tsx$/,
  /routes?\.ts$/,
  /pillow-host\.ts$/,
  /navigation\.ts$/,
];

/** Build file intelligence for important repository files. */
export async function buildFileIntelligence(input: {
  reader: RepositoryReader;
  modules: CodeModuleEntry[];
  criticalPaths: string[];
}): Promise<FileIntelligenceEntry[]> {
  const candidates = new Set<string>();

  for (const mod of input.modules) {
    for (const file of mod.entryFiles) {
      if (IMPORTANT_FILE_PATTERNS.some((p) => p.test(file))) {
        candidates.add(file);
      }
    }
  }

  const priorityFiles = [
    "pillow/src/session.ts",
    "pillow/src/repository-intelligence/knowledge-model.ts",
    "backend/src/orchestration/pillow-host/pillow-host.ts",
    "backend/src/orchestration/pillow-host/routes/pillow-routes.ts",
    "empireai-web/lib/cockpit/navigation.ts",
    "empireai-web/components/cockpit/shell/CockpitShell.tsx",
    "pillow/src/openai/engine.ts",
    "pillow/src/context/engine.ts",
  ];

  for (const f of priorityFiles) candidates.add(f);

  const files: FileIntelligenceEntry[] = [];

  for (const filePath of [...candidates].slice(0, 40)) {
    const content = await input.reader.readText(filePath);
    if (!content) continue;

    const imports = extractImports(content);
    const exports = extractExports(content);
    const mod = input.modules.find((m) => filePath.startsWith(m.rootPath));

    files.push({
      path: filePath,
      purpose: inferFilePurpose(filePath),
      responsibilities: [inferFilePurpose(filePath)],
      ownedCapability: mod?.owner ?? inferOwnerFromPath(filePath),
      imports: imports.slice(0, 12),
      exports: exports.slice(0, 12),
      consumers: [],
      dependencyChain: imports.slice(0, 5),
      riskLevel: deriveFileRisk(filePath, input.criticalPaths),
    });
  }

  return files;
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  const fromRegex = /from\s+["']([^"']+)["']/g;
  const importRegex = /import\s+["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = fromRegex.exec(content)) !== null) imports.push(m[1]!);
  while ((m = importRegex.exec(content)) !== null) imports.push(m[1]!);
  return [...new Set(imports)];
}

function extractExports(content: string): string[] {
  const exports: string[] = [];
  const exportRegex = /export\s+(?:async\s+)?(?:function|class|const|type|interface)\s+(\w+)/g;
  let m: RegExpExecArray | null;
  while ((m = exportRegex.exec(content)) !== null) exports.push(m[1]!);
  return [...new Set(exports)].slice(0, 15);
}

function inferFilePurpose(path: string): string {
  if (path.includes("session.ts")) return "Pillow session bootstrap and subsystem wiring";
  if (path.includes("pillow-host")) return "Brain Pillow host — chat routing and subsystem APIs";
  if (path.includes("navigation.ts")) return "Canonical Cockpit navigation registry";
  if (path.includes("knowledge-model")) return "Repository knowledge model builder";
  if (path.includes("engine.ts")) return "Subsystem engine entry point";
  if (path.includes("page.tsx")) return "Next.js route page component";
  if (path.includes("openai/engine")) return "Pillow LLM message assembly and completion";
  return `Repository artifact: ${path.split("/").pop()}`;
}

function inferOwnerFromPath(path: string): string {
  if (path.startsWith("pillow/")) return "Pillow Runtime";
  if (path.startsWith("backend/")) return "Brain Backend";
  if (path.startsWith("empireai-web/")) return "Cockpit Frontend";
  return "Repository";
}

function deriveFileRisk(path: string, criticalPaths: string[]): CriticalityLevel {
  const criticalPatterns = ["session.ts", "pillow-host", "navigation.ts", "knowledge-model"];
  if (criticalPatterns.some((p) => path.includes(p))) return "critical";
  if (path.includes("engine.ts") || path.includes("routes")) return "high";
  return "medium";
}
