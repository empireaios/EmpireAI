import type { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { ScreenCatalogEntry } from "./types.js";
import { SCREEN_CATALOG } from "./screen-catalog.js";

const COCKPIT_APP_ROOT = "empireai-web/app/(cockpit)/cockpit";

export async function indexCockpitScreens(reader: RepositoryReader): Promise<{
  catalog: ScreenCatalogEntry[];
  discoveredRoutes: number;
}> {
  const catalog = [...SCREEN_CATALOG];
  let discoveredRoutes = 0;

  if (!(await reader.exists(COCKPIT_APP_ROOT))) {
    return { catalog, discoveredRoutes };
  }

  const routes = await collectPageRoutes(reader, COCKPIT_APP_ROOT);
  discoveredRoutes = routes.length;

  for (const route of routes) {
    if (catalog.some((s) => s.route === route.route)) continue;
    catalog.push({
      id: `DISCOVERED-${route.route.replace(/\//g, "-").slice(1)}`,
      route: route.route,
      pagePath: route.pagePath,
      title: route.title,
      purpose: `Cockpit screen at ${route.route}`,
      businessFunction: "Department operational view",
      department: inferDepartment(route.route),
      componentHierarchy: [
        { name: route.pagePath.split("/").pop() ?? "page", path: route.pagePath, role: "route page" },
      ],
      layout: "CockpitShell with department layout",
      navigation: ["CockpitSidebar", "CockpitTopBar"],
      stateSources: ["useBrainModule"],
      dataSources: ["brain/dispatch"],
      frontendOwner: "empireai-web/app/(cockpit)",
      backendDependencies: ["brain"],
    });
  }

  return { catalog, discoveredRoutes };
}

async function collectPageRoutes(
  reader: RepositoryReader,
  relativeDir: string,
  routePrefix = "/cockpit",
): Promise<Array<{ route: string; pagePath: string; title: string }>> {
  const results: Array<{ route: string; pagePath: string; title: string }> = [];

  const files = await reader.listFiles(relativeDir);
  if (files.includes("page.tsx")) {
    results.push({
      route: routePrefix,
      pagePath: `${relativeDir}/page.tsx`.replace(/\\/g, "/"),
      title: routePrefix.split("/").pop() ?? "Cockpit",
    });
  }

  const subdirs = await reader.listSubdirs(relativeDir);
  for (const sub of subdirs) {
    if (sub.startsWith("[")) continue;
    const nested = await collectPageRoutes(
      reader,
      `${relativeDir}/${sub}`.replace(/\\/g, "/"),
      `${routePrefix}/${sub}`,
    );
    results.push(...nested);
  }

  return results;
}

function inferDepartment(route: string): string {
  if (route.includes("/commerce")) return "Commerce";
  if (route.includes("/intelligence")) return "Intelligence";
  if (route.includes("/finance")) return "Finance";
  if (route.includes("/operations")) return "Operations";
  if (route.includes("/development")) return "Development";
  if (route.includes("/governance")) return "Governance";
  if (route.includes("/infrastructure")) return "Infrastructure";
  if (route.includes("/workforce")) return "Workforce";
  return "Executive";
}
