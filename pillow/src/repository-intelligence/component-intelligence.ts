import type {
  ArchitectureBoundary,
  CodeModuleEntry,
  ComponentIntelligence,
  CriticalityLevel,
  DependencyLink,
} from "./types.js";

/** Build component intelligence from architecture boundaries and indexed modules. */
export function buildComponentIntelligence(input: {
  architecture: ArchitectureBoundary[];
  modules: CodeModuleEntry[];
  dependencies: DependencyLink[];
  criticalPaths: string[];
}): ComponentIntelligence[] {
  const { architecture, modules, dependencies, criticalPaths } = input;
  const components: ComponentIntelligence[] = [];

  for (const boundary of architecture) {
    const incoming = dependencies.filter((d) => d.to === boundary.id).map((d) => d.from);
    const outgoing = boundary.dependsOn.length > 0 ? boundary.dependsOn : dependencies
      .filter((d) => d.from === boundary.id)
      .map((d) => d.to);

    const moduleMatch = modules.find(
      (m) => m.rootPath === boundary.rootPath || m.id === boundary.id,
    );

    components.push({
      id: boundary.id,
      name: boundary.name,
      layer: boundary.layer,
      owner: boundary.owner,
      rootPath: boundary.rootPath,
      purpose: boundary.responsibilities[0] ?? boundary.name,
      responsibilities: boundary.responsibilities,
      publicInterfaces: derivePublicInterfaces(boundary),
      internalInterfaces: moduleMatch?.entryFiles.slice(0, 5) ?? [],
      dependencies: [...new Set(outgoing)],
      dependents: [...new Set(incoming)],
      executionEntryPoints: moduleMatch?.entryFiles.filter((f) =>
        /index\.(ts|tsx)$|engine\.ts$|routes?\.ts$|page\.tsx$/i.test(f),
      ) ?? [],
      businessEngineRelation: boundary.layer === "business_engine" ? boundary.name : null,
      pillowRelation: boundary.layer === "pillow" ? boundary.name : inferPillowRelation(boundary.id),
      criticality: deriveCriticality(boundary.id, criticalPaths),
    });
  }

  for (const mod of modules) {
    if (components.some((c) => c.rootPath === mod.rootPath)) continue;
    components.push({
      id: mod.id,
      name: mod.name,
      layer: mod.layer,
      owner: mod.owner,
      rootPath: mod.rootPath,
      purpose: `${mod.name} module at ${mod.rootPath}`,
      responsibilities: [`Maintain ${mod.name} under ${mod.rootPath}`],
      publicInterfaces: mod.entryFiles.filter((f) => f.endsWith("index.ts")).slice(0, 3),
      internalInterfaces: mod.entryFiles.slice(0, 5),
      dependencies: [],
      dependents: [],
      executionEntryPoints: mod.entryFiles.slice(0, 3),
      businessEngineRelation: mod.layer === "business_engine" ? mod.name : null,
      pillowRelation: mod.layer === "pillow" ? mod.name : null,
      criticality: "medium",
    });
  }

  return components;
}

function derivePublicInterfaces(boundary: ArchitectureBoundary): string[] {
  if (boundary.id === "bff") return ["/api/brain/*", "/api/pillow/*", "/api/auth/*"];
  if (boundary.id === "brain") return ["Fastify routes", "LLMRouter", "Brain dispatch"];
  if (boundary.id === "pillow-host") return ["PillowHost.routePrompt", "GET /api/pillow/*"];
  if (boundary.id === "cockpit") return ["CockpitShell", "GlobalAiAssistantPanel"];
  return [`${boundary.rootPath}/index.ts`];
}

function inferPillowRelation(componentId: string): string | null {
  if (componentId === "cockpit" || componentId === "bff") {
    return "Consumes Pillow via BFF proxy";
  }
  if (componentId === "brain") return "Hosts PillowHost in-process";
  return null;
}

function deriveCriticality(id: string, criticalPaths: string[]): CriticalityLevel {
  if (criticalPaths.includes(id)) return "critical";
  if (["pillow-package", "redis", "worker", "governance"].includes(id)) return "high";
  return "medium";
}
