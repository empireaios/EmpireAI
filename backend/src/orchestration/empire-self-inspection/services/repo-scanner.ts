import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, "../../../../..");
export const BACKEND_ROOT = path.join(REPO_ROOT, "backend");
export const BACKEND_SRC = path.join(BACKEND_ROOT, "src");
export const FRONTEND_SRC = path.join(REPO_ROOT, "frontend", "src");
export const ESIS_CACHE_PATH = path.join(REPO_ROOT, ".empire", "esis-cache.json");
export const REVIEW_PACKAGE_PATH = path.join(REPO_ROOT, "EMPIRE_REVIEW_PACKAGE.md");

export function sortAlpha<T>(items: T[], key: (item: T) => string): T[] {
  return [...items].sort((a, b) => key(a).localeCompare(key(b)));
}

export function readText(filePath: string): string {
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf8");
}

export function listDirectories(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

export function listFilesRecursive(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...listFilesRecursive(full, ext));
    else if (entry.name.endsWith(ext)) results.push(full);
  }
  return results.sort();
}

export function countPatternMatches(content: string, patterns: RegExp[]): number {
  let count = 0;
  for (const pattern of patterns) {
    const matches = content.match(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`));
    if (matches) count += matches.length;
  }
  return count;
}

export function extractRegisterRoutes(content: string): string[] {
  const routes: string[] = [];
  const routeRegex = /app\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/g;
  let match: RegExpExecArray | null;
  while ((match = routeRegex.exec(content)) !== null) {
    if (match[2]) routes.push(match[2]);
  }
  return [...new Set(routes)].sort();
}

export function extractBrainToolNames(toolsFileContent: string): string[] {
  const names: string[] = [];
  const nameRegex = /name:\s*["'`]([^"'`]+)["'`]/g;
  let match: RegExpExecArray | null;
  while ((match = nameRegex.exec(toolsFileContent)) !== null) {
    if (match[1]) names.push(match[1]);
  }
  return [...new Set(names)].sort();
}

export function extractDatabaseTables(databaseContent: string): string[] {
  const tables: string[] = [];
  const tableRegex = /CREATE TABLE IF NOT EXISTS\s+(\w+)/g;
  let match: RegExpExecArray | null;
  while ((match = tableRegex.exec(databaseContent)) !== null) {
    if (match[1]) tables.push(match[1]);
  }
  return [...new Set(tables)].sort();
}

export function extractValidationSuites(): string[] {
  const testDir = path.join(BACKEND_SRC, "validation", "tests");
  return listFilesRecursive(testDir, ".test.ts")
    .map((f) => path.basename(f))
    .sort();
}

export function extractModuleRoutesFromIndex(): Map<string, string[]> {
  const indexContent = readText(path.join(BACKEND_SRC, "index.ts"));
  const routes = new Map<string, string[]>();
  const registerRegex = /register(\w+)Routes/g;
  const modules = [...indexContent.matchAll(registerRegex)].map((m) => m[1]);
  for (const mod of modules.sort()) {
    if (!mod) continue;
    const kebab = mod.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "");
    routes.set(mod, [`/${kebab}/*`]);
  }
  return routes;
}

export function scanPlaceholdersInDir(dir: string): string[] {
  const patterns = [
    /publishBlocked:\s*true/g,
    /executionBlocked:\s*true/g,
    /transactionBlocked:\s*true/g,
    /preview:\/\//g,
    /build:\/\//g,
    /mock:\/\//g,
    /placeholder:\/\//g,
    /SCOUT_MOCK/g,
    /_MOCK/g,
    /no live API/gi,
  ];
  const findings: string[] = [];
  for (const file of listFilesRecursive(dir, ".ts")) {
    const content = readText(file);
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        findings.push(`${path.relative(REPO_ROOT, file)}:${pattern.source}`);
        break;
      }
    }
  }
  return [...new Set(findings)].sort();
}

export function deterministicHash(payload: unknown): string {
  const normalized = JSON.stringify(payload);
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

export function writeJson(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

export function readJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(readText(filePath)) as T;
  } catch {
    return null;
  }
}

export const FRONTEND_PAGE_REGISTRY: Array<{
  route: string;
  component: string;
  title: string;
  purpose: string;
  navSection: string;
  commercialObjective: string;
  boundApis: string[];
  futureHooks: string[];
}> = [
  { route: "/", component: "LandingPage", title: "EmpireAI Landing", purpose: "Public positioning and login entry", navSection: "public", commercialObjective: "Acquire founders", boundApis: [], futureHooks: ["signup funnel analytics"] },
  { route: "/login", component: "LoginPage", title: "Login", purpose: "Authenticate Founder/Grand King", navSection: "public", commercialObjective: "Secure access", boundApis: ["/auth/login", "/auth/me"], futureHooks: [] },
  { route: "/dashboard", component: "MissionHomePage", title: "Mission Control", purpose: "Daily mission briefing and blockers", navSection: "command", commercialObjective: "Drive daily execution", boundApis: ["/ecommerce-os/dashboard", "/operation-first-dollar/dashboard", "/eye-series/dashboard", "/execution-layer/executive-command", "/empire-self-inspection/dashboard"], futureHooks: ["ESIS auto-refresh"] },
  { route: "/dashboard/command", component: "EmpireCommandCenterPage", title: "Empire Command Center", purpose: "Executive metrics and health", navSection: "command", commercialObjective: "CEO visibility", boundApis: ["/ecommerce-os/dashboard", "/operation-first-dollar/dashboard"], futureHooks: ["risk radar"] },
  { route: "/dashboard/intelligence", component: "ProductDiscoveryPage", title: "Business Intelligence", purpose: "Product discovery pipeline", navSection: "workspaces", commercialObjective: "Find winning products", boundApis: ["/product-discovery/sessions"], futureHooks: ["live scout catalog"] },
  { route: "/dashboard/brands", component: "BusinessWorkspacePage", title: "Brand Workspace", purpose: "Business opportunity portfolio", navSection: "workspaces", commercialObjective: "Choose business to launch", boundApis: ["/business-workspace/opportunities"], futureHooks: [] },
  { route: "/dashboard/brands/:opportunityId", component: "BusinessDetailPage", title: "Brand HQ", purpose: "Single business deep dive", navSection: "workspaces", commercialObjective: "Validate business model", boundApis: ["/business-workspace/opportunities"], futureHooks: [] },
  { route: "/dashboard/brands/:opportunityId/preview", component: "BusinessPreviewPage", title: "Business Preview", purpose: "Generate and approve preview", navSection: "workspaces", commercialObjective: "Pre-build validation", boundApis: ["/brain/dispatch"], futureHooks: [] },
  { route: "/dashboard/launch", component: "LaunchCenterPage", title: "Launch Mission", purpose: "Readiness and launch workflow", navSection: "workspaces", commercialObjective: "Go live", boundApis: ["/commerce-readiness/*", "/ecommerce-os/workflows/*"], futureHooks: [] },
  { route: "/dashboard/operations", component: "OrdersPage", title: "Commerce Operations", purpose: "Orders and fulfillment monitoring", navSection: "workspaces", commercialObjective: "Fulfill and profit", boundApis: ["/customer-orders/pipelines"], futureHooks: [] },
  { route: "/dashboard/infrastructure", component: "InfrastructurePage", title: "Infrastructure", purpose: "Connector and account setup", navSection: "system", commercialObjective: "Connect commerce stack", boundApis: ["/reality-integration/dashboard", "/marketplace-infrastructure/*"], futureHooks: ["OAuth flows"] },
  { route: "/dashboard/settings", component: "SettingsPage", title: "Empire Settings", purpose: "Account and workspace settings", navSection: "system", commercialObjective: "Configure empire", boundApis: ["/auth/me"], futureHooks: [] },
];

export const COMMERCE_LIFECYCLE_STAGES = [
  { stage: "Discovery", module: "product-discovery-opportunity-engine", canonPhase: "DISCOVER" },
  { stage: "Workspace", module: "business-opportunity-workspace", canonPhase: "EVALUATE" },
  { stage: "Preview", module: "business-preview-studio", canonPhase: "PREVIEW" },
  { stage: "Build", module: "business-build-engine", canonPhase: "BUILD" },
  { stage: "Simulation", module: "business-simulation-engine", canonPhase: "SIMULATE" },
  { stage: "Readiness", module: "commerce-readiness-engine", canonPhase: "READY" },
  { stage: "Publication", module: "product-publishing-engine", canonPhase: "PUBLISH" },
  { stage: "Marketing", module: "execution-layer", canonPhase: "MARKET" },
  { stage: "Orders", module: "customer-order-pipeline", canonPhase: "ORDER" },
  { stage: "Fulfillment", module: "live-cj-fulfillment", canonPhase: "FULFILL" },
  { stage: "Operation First Dollar", module: "operation-first-dollar", canonPhase: "PROFIT" },
  { stage: "Reality Integration", module: "reality-integration", canonPhase: "CONNECT" },
] as const;

export const DASHBOARD_SOURCES = [
  { dashboard: "Grand Kings Dashboard", sourceModule: "ecommerce-os-orchestrator", route: "/ecommerce-os/dashboard" },
  { dashboard: "Commerce Readiness", sourceModule: "commerce-readiness-engine", route: "/commerce-readiness/dashboard" },
  { dashboard: "Product Discovery", sourceModule: "product-discovery-opportunity-engine", route: "/product-discovery/dashboard" },
  { dashboard: "Business Workspace", sourceModule: "business-opportunity-workspace", route: "/business-workspace/dashboard" },
  { dashboard: "Business Preview", sourceModule: "business-preview-studio", route: "/business-preview/dashboard" },
  { dashboard: "Market Strategy", sourceModule: "market-domination-strategy-engine", route: "/market-strategy/dashboard" },
  { dashboard: "Business Build", sourceModule: "business-build-engine", route: "/business-build/dashboard" },
  { dashboard: "Business Simulation", sourceModule: "business-simulation-engine", route: "/business-simulation/dashboard" },
  { dashboard: "Execution Layer", sourceModule: "execution-layer", route: "/execution-layer/dashboard" },
  { dashboard: "Reality Integration", sourceModule: "reality-integration", route: "/reality-integration/dashboard" },
  { dashboard: "Eye Series", sourceModule: "eye-series", route: "/eye-series/dashboard" },
  { dashboard: "Operation First Dollar", sourceModule: "operation-first-dollar", route: "/operation-first-dollar/dashboard" },
  { dashboard: "ESIS Self-Inspection", sourceModule: "empire-self-inspection", route: "/empire-self-inspection/dashboard" },
] as const;
