import fs from "node:fs";
import path from "node:path";

import type { EsisBackendModule } from "../models/esis-inspection.js";
import {
  BACKEND_SRC,
  extractBrainToolNames,
  extractDatabaseTables,
  extractRegisterRoutes,
  extractValidationSuites,
  listDirectories,
  listFilesRecursive,
  readText,
  scanPlaceholdersInDir,
  sortAlpha,
} from "./repo-scanner.js";

const MODULE_PURPOSES: Record<string, string> = {
  "empire-self-inspection": "Self-inspection and review package generation (S001)",
  "commerce-runtime": "Commerce Runtime execution kernel — planning, routing, events (CRT-001)",
  "runtime-plugins": "Runtime plugin framework — marketplace plugins, registry (B-001–B-005)",
  "global-commerce": "Global commerce registry, identity, expansion planner (B-006–B-010)",
  "global-commerce-intelligence": "Global commerce intelligence — country scores, ecosystem, opportunity ranking (B-011–B-015)",
  "empire-knowledge": "Empire Knowledge Engine — objects, graph, learning records, reasoning (K-001–K-005)",
  "global-commerce-infrastructure": "Global commerce infrastructure — layers, dependencies, readiness, graphs (D-001–D-005)",
  "founder-automation": "Founder automation — journey, human action queue, automation planner (E-011–E-015)",
  "amazon-global-seller": "Amazon Global Seller — capability profile, listing package, readiness (RS-001–RS-005)",
  "commerce-intelligence-studio": "Commercial brain — review, winning listings, strategy, experiments (CIS-001–CIS-005)",
  "executive-council": "Artificial Executive Team — registry, debate, accountability, headquarters (EC-001–EC-010)",
  "executive-surveillance": "Proactive observation layer — watchers, signals, missions, briefings (ESS-001–ESS-010)",
  "grand-king": "Grand King single account — products, tasks, suppliers, orders, AI decisions, automation",
  "grand-king-revenue-pipeline": "First-dollar commercial orchestration — lifecycle, state machine, revenue HQ (GKR-001–GKR-010)",
  "reality-integration": "Connector connection layer, vault, credential governance, reality readiness (REAL-001–REAL-005)",
  "execution-layer": "Marketing, fulfillment, revenue execution packages",
  "commerce-readiness-engine": "Launch readiness evaluation and blockers",
  "product-discovery-opportunity-engine": "Product discovery pipeline",
  "business-opportunity-workspace": "Business opportunity portfolio",
  "business-preview-studio": "Business preview generation",
  "business-build-engine": "Business build package generation",
  "business-simulation-engine": "Financial and commercial simulation",
  "ecommerce-os-orchestrator": "Grand King launch orchestration",
  "operation-first-dollar": "First dollar milestones and KPI engine",
  "live-payment-engine": "Stripe checkout and webhook processing",
  "live-cj-fulfillment": "CJ Dropshipping live order submission",
  "product-publishing-engine": "Product catalog publishing",
  "customer-order-pipeline": "Order lifecycle pipeline",
  brain: "Brain orchestration, tools, database, audit",
  guardian: "Safety engine and architecture validation",
};

function categorizeModule(modulePath: string): string {
  const parts = modulePath.split(path.sep);
  if (parts.includes("orchestration")) return "orchestration";
  if (parts.includes("execution")) return "execution";
  if (parts.includes("revenue")) return "revenue";
  if (parts.includes("foundation")) return "foundation";
  if (parts.includes("intelligence")) return "intelligence";
  if (parts.includes("operation-first-dollar")) return "operation";
  return "core";
}

function findModuleRoots(): Array<{ moduleId: string; rootPath: string; category: string }> {
  const modules: Array<{ moduleId: string; rootPath: string; category: string }> = [];
  const topLevel = listDirectories(BACKEND_SRC);

  for (const dir of topLevel) {
    if (dir === "validation" || dir === "config") continue;
    const dirPath = path.join(BACKEND_SRC, dir);
    if (dir === "orchestration" || dir === "execution" || dir === "revenue" || dir === "foundation" || dir === "intelligence") {
      for (const sub of listDirectories(dirPath)) {
        modules.push({
          moduleId: sub,
          rootPath: path.join(dirPath, sub),
          category: dir,
        });
      }
    } else if (dir === "runtime") {
      for (const sub of listDirectories(dirPath)) {
        modules.push({
          moduleId: sub,
          rootPath: path.join(dirPath, sub),
          category: "runtime",
        });
      }
      const pluginsPath = path.join(dirPath, "plugins");
      if (fsExists(pluginsPath)) {
        modules.push({
          moduleId: "runtime-plugins",
          rootPath: pluginsPath,
          category: "runtime",
        });
      }
    } else if (dir === "operation-first-dollar") {
      modules.push({ moduleId: dir, rootPath: dirPath, category: "operation" });
    } else {
      modules.push({ moduleId: dir, rootPath: dirPath, category: categorizeModule(dirPath) });
    }
  }

  return sortAlpha(modules, (m) => m.moduleId);
}

function listSubdirFiles(root: string, subdir: string): string[] {
  const dir = path.join(root, subdir);
  if (!fsExists(dir)) return [];
  return listFilesRecursive(dir, ".ts")
    .map((f) => path.basename(f, ".ts"))
    .sort();
}

function fsExists(p: string): boolean {
  return fs.existsSync(p);
}

function inferHealth(placeholders: string[], hasRoutes: boolean, hasTools: boolean): EsisBackendModule["health"] {
  if (placeholders.length >= 3) return "WARNING";
  if (!hasRoutes && !hasTools && placeholders.length > 0) return "WARNING";
  if (placeholders.some((p) => p.includes("executionBlocked") || p.includes("publishBlocked"))) return "WARNING";
  return "HEALTHY";
}

export function inspectBackend(): {
  summary: string;
  modules: EsisBackendModule[];
  routeCount: number;
  toolCount: number;
  tableCount: number;
} {
  const databaseContent = readText(path.join(BACKEND_SRC, "brain", "database.ts"));
  const allTables = extractDatabaseTables(databaseContent);
  const validationSuites = extractValidationSuites();
  const globalPlaceholders = scanPlaceholdersInDir(BACKEND_SRC);

  const indexContent = readText(path.join(BACKEND_SRC, "index.ts"));
  const globalRoutes = extractRegisterRoutes(indexContent);

  let totalTools = 0;
  const modules: EsisBackendModule[] = findModuleRoots().map(({ moduleId, rootPath, category }) => {
    const services = listSubdirFiles(rootPath, "services");
    const repositories = listSubdirFiles(rootPath, "repositories");
    const routesDir = path.join(rootPath, "routes");
    let routes: string[] = [];
    if (fsExists(routesDir)) {
      for (const routeFile of listFilesRecursive(routesDir, ".ts")) {
        routes.push(...extractRegisterRoutes(readText(routeFile)));
      }
    }
    routes = [...new Set(routes)].sort();

    const toolsDir = path.join(rootPath, "tools");
    let brainTools: string[] = [];
    if (fsExists(toolsDir)) {
      for (const toolFile of listFilesRecursive(toolsDir, ".ts")) {
        brainTools.push(...extractBrainToolNames(readText(toolFile)));
      }
    }
    brainTools = [...new Set(brainTools)].sort();
    totalTools += brainTools.length;

    const contractFile = path.join(rootPath, "contract");
    let dependencies: string[] = [];
    if (fsExists(contractFile)) {
      const contractContent = listFilesRecursive(contractFile, ".ts")
        .map((f) => readText(f))
        .join("\n");
      dependencies = [...contractContent.matchAll(/integratesWith[^[]*\[([^\]]+)\]/g)]
        .flatMap((m) => (m[1] ?? "").split(",").map((s) => s.trim().replace(/["']/g, "")))
        .filter(Boolean)
        .sort();
    }

    const modulePlaceholders = globalPlaceholders.filter((p) => p.includes(moduleId) || p.includes(path.relative(BACKEND_SRC, rootPath)));
    const moduleTables = allTables.filter((t) => {
      const repoContent = listFilesRecursive(rootPath, ".ts").map((f) => readText(f)).join("\n");
      return repoContent.includes(t);
    });

    const suiteMatches = validationSuites.filter((s) => {
      const slug = moduleId.replace(/-/g, "").slice(0, 8);
      const prefix = moduleId.split("-")[0] ?? moduleId;
      return s.toLowerCase().includes(slug) || s.toLowerCase().includes(prefix);
    });

    const missingIntegrations: string[] = [];
    if (moduleId === "reality-integration") missingIntegrations.push("Live API validation on connect");
    if (moduleId === "product-publishing-engine") missingIntegrations.push("External marketplace Admin API");
    if (moduleId === "product-discovery-opportunity-engine") missingIntegrations.push("Live product scout catalog");

    return {
      moduleId,
      category,
      purpose: MODULE_PURPOSES[moduleId] ?? `${moduleId} module`,
      dependencies,
      services,
      repositories,
      routes,
      brainTools,
      databaseTables: moduleTables.length > 0 ? moduleTables : [],
      validationSuites: suiteMatches.length > 0 ? suiteMatches : [],
      health: inferHealth(modulePlaceholders, routes.length > 0, brainTools.length > 0),
      missingIntegrations,
      placeholders: modulePlaceholders.slice(0, 5),
    };
  });

  return {
    summary: `${modules.length} backend modules scanned; ${globalRoutes.length} REST routes; ${totalTools} brain tools; ${allTables.length} database tables`,
    modules,
    routeCount: globalRoutes.length,
    toolCount: totalTools,
    tableCount: allTables.length,
  };
}

export function listAllRestRoutes(): string[] {
  const routes: string[] = [];
  routes.push(...extractRegisterRoutes(readText(path.join(BACKEND_SRC, "index.ts"))));
  for (const routeFile of listFilesRecursive(BACKEND_SRC, ".ts")) {
    if (routeFile.includes(`${path.sep}routes${path.sep}`) && routeFile.endsWith(".ts")) {
      routes.push(...extractRegisterRoutes(readText(routeFile)));
    }
  }
  return [...new Set(routes)].sort();
}

export function listAllBrainTools(): string[] {
  const brainIndex = readText(path.join(BACKEND_SRC, "brain", "index.ts"));
  const imports = [...brainIndex.matchAll(/(\w+Tools)/g)].map((m) => m[1]);
  const tools: string[] = [];
  for (const dir of listFilesRecursive(BACKEND_SRC, "tools")) {
    if (dir.endsWith("-tools.ts")) {
      tools.push(...extractBrainToolNames(readText(dir)));
    }
  }
  return [...new Set(tools)].sort();
}

export function listAllDatabaseTables(): string[] {
  return extractDatabaseTables(readText(path.join(BACKEND_SRC, "brain", "database.ts")));
}
