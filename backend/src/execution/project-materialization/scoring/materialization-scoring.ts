import type { GeneratedArtifact } from "../../storefront-artifact-generation/models/generated-artifact.js";
import type { MaterializedProjectCreateInput } from "../models/materialized-project.js";
import type { MaterializedFileCreateInput } from "../models/materialized-project.js";
import type {
  BuildMetadata,
  MaterializedProjectStructure,
} from "../models/materialized-project.js";
import type { MaterializationSignal, MaterializationSignalType } from "../models/materialization-signal.js";

export const MATERIALIZATION_SIGNAL_WEIGHTS: Record<MaterializationSignalType, number> = {
  artifact_alignment: 0.2,
  structure_completeness: 0.18,
  file_materialization: 0.16,
  dependency_resolution: 0.14,
  build_metadata_readiness: 0.12,
  config_coverage: 0.08,
  route_coverage: 0.08,
  materialization_composite: 0.04,
};

export type MaterializationArtifactInput = Pick<
  GeneratedArtifact,
  | "artifactId"
  | "generatedStorefrontId"
  | "filePath"
  | "fileType"
  | "generatedContent"
  | "metadata"
  | "confidence"
>;

export type ProjectMaterializationInput = {
  artifacts: MaterializationArtifactInput[];
};

export type ProjectMaterializationBreakdown = MaterializedProjectCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildSignal(
  signalType: MaterializationSignalType,
  score: number,
  detail: string,
): MaterializationSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: MATERIALIZATION_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function joinPath(root: string, relative: string): string {
  return `${root.replace(/\/$/, "")}/${relative.replace(/^\//, "")}`;
}

function uniqueDirectories(filePaths: string[]): string[] {
  const directories = new Set<string>();
  for (const filePath of filePaths) {
    const parts = filePath.split("/");
    for (let index = 1; index < parts.length; index += 1) {
      directories.add(parts.slice(0, index).join("/"));
    }
  }
  return [...directories].sort();
}

function parsePackageName(artifacts: MaterializationArtifactInput[]): string {
  const packageArtifact = artifacts.find((artifact) => artifact.filePath === "package.json");
  if (!packageArtifact) {
    return "@storefront/materialized-project";
  }
  try {
    const parsed = JSON.parse(packageArtifact.generatedContent) as { name?: string };
    return parsed.name ?? "@storefront/materialized-project";
  } catch {
    return "@storefront/materialized-project";
  }
}

function buildProjectStructure(
  artifacts: MaterializationArtifactInput[],
  rootDirectory: string,
): MaterializedProjectStructure {
  const files = artifacts.map((artifact) => artifact.filePath).sort();
  const directories = uniqueDirectories(files);

  return {
    rootDirectory,
    packageName: parsePackageName(artifacts),
    framework: "next",
    directories,
    files,
  };
}

function materializeFiles(
  artifacts: MaterializationArtifactInput[],
  rootDirectory: string,
): MaterializedFileCreateInput[] {
  return artifacts.map((artifact) => ({
    artifactId: artifact.artifactId,
    relativePath: artifact.filePath,
    absolutePath: joinPath(rootDirectory, artifact.filePath),
    content: artifact.generatedContent,
    fileType: artifact.fileType,
    mimeType: artifact.metadata.mimeType,
    status: "READY" as const,
  }));
}

function resolveImportPath(fromFile: string, importPath: string): string | null {
  if (!importPath.startsWith("../") && !importPath.startsWith("./")) {
    return null;
  }

  const fromParts = fromFile.split("/");
  fromParts.pop();
  const importParts = importPath.split("/");

  for (const part of importParts) {
    if (part === ".") {
      continue;
    }
    if (part === "..") {
      fromParts.pop();
    } else {
      fromParts.push(part);
    }
  }

  const resolved = fromParts.join("/");
  if (resolved.endsWith(".tsx") || resolved.endsWith(".ts") || resolved.endsWith(".json")) {
    return resolved;
  }
  return `${resolved}.tsx`;
}

function buildDependencyMap(
  artifacts: MaterializationArtifactInput[],
): Record<string, string[]> {
  const filePaths = new Set(artifacts.map((artifact) => artifact.filePath));
  const dependencyMap: Record<string, string[]> = {};

  for (const artifact of artifacts) {
    const dependencies = new Set<string>();
    const importMatches = artifact.generatedContent.matchAll(
      /from\s+["']([^"']+)["']/g,
    );

    for (const match of importMatches) {
      const resolved = resolveImportPath(artifact.filePath, match[1]!);
      if (resolved && filePaths.has(resolved)) {
        dependencies.add(resolved);
      }
    }

    if (artifact.filePath === "package.json") {
      try {
        const parsed = JSON.parse(artifact.generatedContent) as {
          dependencies?: Record<string, string>;
        };
        for (const dependency of Object.keys(parsed.dependencies ?? {})) {
          dependencies.add(`npm:${dependency}`);
        }
      } catch {
        // ignore invalid package.json during dependency extraction
      }
    }

    dependencyMap[artifact.filePath] = [...dependencies].sort();
  }

  return dependencyMap;
}

function buildBuildMetadata(
  artifacts: MaterializationArtifactInput[],
  projectStructure: MaterializedProjectStructure,
): BuildMetadata {
  const deploymentArtifact = artifacts.find((artifact) => artifact.filePath === "deployment.json");
  const firstArtifact = artifacts[0]!;

  if (deploymentArtifact) {
    try {
      const parsed = JSON.parse(deploymentArtifact.generatedContent) as {
        platform?: string;
        buildCommand?: string;
        startCommand?: string;
        outputDirectory?: string;
        envVars?: Record<string, string>;
        deployNotes?: string;
      };

      return {
        platform: parsed.platform ?? "node",
        buildCommand: parsed.buildCommand ?? "npm run build",
        startCommand: parsed.startCommand ?? "npm run start",
        outputDirectory: parsed.outputDirectory ?? ".next",
        envVars: parsed.envVars ?? {},
        materializationNotes: `Materialized ${projectStructure.packageName} at ${projectStructure.rootDirectory}. ${parsed.deployNotes ?? ""}`.trim(),
      };
    } catch {
      // fall through to defaults
    }
  }

  return {
    platform: "node",
    buildCommand: "npm run build",
    startCommand: "npm run start",
    outputDirectory: ".next",
    envVars: {
      NEXT_PUBLIC_STORE_ID: firstArtifact.metadata.storeId,
      NEXT_PUBLIC_BRAND_ID: firstArtifact.metadata.brandId,
    },
    materializationNotes: `Materialized project at ${projectStructure.rootDirectory}.`,
  };
}

function computeConfidence(
  artifacts: MaterializationArtifactInput[],
  materializedFiles: MaterializedFileCreateInput[],
  projectStructure: MaterializedProjectStructure,
  dependencyMap: Record<string, string[]>,
): number {
  const artifactConfidence = average(artifacts.map((artifact) => artifact.confidence));
  const fileScore =
    materializedFiles.length === artifacts.length && materializedFiles.every((file) => file.status === "READY")
      ? 88
      : 62;
  const structureScore = projectStructure.directories.length >= 3 ? 86 : 60;
  const dependencyScore =
    Object.keys(dependencyMap).length === artifacts.length ? 84 : 58;

  return clampScore(
    artifactConfidence * 0.4 + fileScore * 0.25 + structureScore * 0.2 + dependencyScore * 0.15,
  );
}

function buildSignals(
  artifacts: MaterializationArtifactInput[],
  materializedFiles: MaterializedFileCreateInput[],
  projectStructure: MaterializedProjectStructure,
  dependencyMap: Record<string, string[]>,
  buildMetadata: BuildMetadata,
  confidence: number,
): MaterializationSignal[] {
  const configCount = artifacts.filter((artifact) => artifact.fileType === "CONFIG").length;
  const routeCount = artifacts.filter((artifact) => artifact.fileType === "ROUTE").length;
  const pageWithDeps = Object.entries(dependencyMap).filter(
    ([path, deps]) => path.startsWith("src/pages/") && deps.length > 0,
  ).length;

  return [
    buildSignal(
      "artifact_alignment",
      average(artifacts.map((artifact) => artifact.confidence)),
      `${artifacts.length} artifacts aligned`,
    ),
    buildSignal(
      "structure_completeness",
      projectStructure.files.length === artifacts.length ? 88 : 60,
      `${projectStructure.directories.length} directories materialized`,
    ),
    buildSignal(
      "file_materialization",
      materializedFiles.every((file) => file.content.length > 0) ? 86 : 58,
      `${materializedFiles.length} files materialized`,
    ),
    buildSignal(
      "dependency_resolution",
      pageWithDeps > 0 ? 85 : 62,
      `${Object.keys(dependencyMap).length} dependency entries mapped`,
    ),
    buildSignal(
      "build_metadata_readiness",
      buildMetadata.buildCommand.length > 0 ? 84 : 55,
      "Build metadata generated",
    ),
    buildSignal(
      "config_coverage",
      configCount >= 3 ? 85 : 60,
      `${configCount} config artifacts included`,
    ),
    buildSignal(
      "route_coverage",
      routeCount >= 1 ? 88 : 50,
      `${routeCount} route artifacts included`,
    ),
    buildSignal("materialization_composite", confidence, `Materialization confidence ${confidence}`),
  ];
}

/** Materializes generated storefront artifacts into a deployable project structure. */
export function scoreProjectMaterialization(
  input: ProjectMaterializationInput,
): ProjectMaterializationBreakdown {
  const { artifacts } = input;

  if (artifacts.length === 0) {
    throw new Error("Project materialization requires at least one artifact");
  }

  const firstArtifact = artifacts[0]!;
  const rootDirectory = `storefronts/${firstArtifact.metadata.storeId}/${slugify(firstArtifact.metadata.brandId)}`;
  const projectStructure = buildProjectStructure(artifacts, rootDirectory);
  const materializedFiles = materializeFiles(artifacts, rootDirectory);
  const dependencyMap = buildDependencyMap(artifacts);
  const buildMetadata = buildBuildMetadata(artifacts, projectStructure);
  const confidence = computeConfidence(
    artifacts,
    materializedFiles,
    projectStructure,
    dependencyMap,
  );
  const signals = buildSignals(
    artifacts,
    materializedFiles,
    projectStructure,
    dependencyMap,
    buildMetadata,
    confidence,
  );

  return {
    generatedStorefrontId: firstArtifact.generatedStorefrontId,
    storeId: firstArtifact.metadata.storeId,
    brandId: firstArtifact.metadata.brandId,
    projectStructure,
    materializedFiles,
    dependencyMap,
    buildMetadata,
    confidence,
    signals,
  };
}

export const materializationScoring = {
  scoreProjectMaterialization,
  weights: MATERIALIZATION_SIGNAL_WEIGHTS,
};
