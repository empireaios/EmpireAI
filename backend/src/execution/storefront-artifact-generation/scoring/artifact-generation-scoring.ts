import type { GeneratedStorefront } from "../../storefront-code-generation/models/generated-storefront.js";
import type { GeneratedPage } from "../../storefront-code-generation/models/generated-page.js";
import type { GeneratedArtifactCreateInput } from "../models/generated-artifact.js";
import type { ArtifactFile, ArtifactFileMetadata, ArtifactFileType } from "../models/artifact-file.js";
import type { ArtifactSignal, ArtifactSignalType } from "../models/artifact-signal.js";

export const ARTIFACT_SIGNAL_WEIGHTS: Record<ArtifactSignalType, number> = {
  code_generation_alignment: 0.2,
  page_artifact_coverage: 0.18,
  component_artifact_coverage: 0.16,
  config_artifact_readiness: 0.12,
  route_manifest_completeness: 0.12,
  metadata_artifact_quality: 0.1,
  file_content_quality: 0.08,
  artifact_composite: 0.04,
};

export type ArtifactCodeGenerationInput = Pick<
  GeneratedStorefront,
  | "generatedStorefrontId"
  | "storefrontId"
  | "storeId"
  | "brandId"
  | "generatedPages"
  | "generatedComponents"
  | "projectStructure"
  | "deploymentMetadata"
  | "confidence"
>;

export type StorefrontArtifactGenerationInput = {
  codeGeneration: ArtifactCodeGenerationInput;
};

export type StorefrontArtifactGenerationBreakdown = {
  generatedStorefrontId: string;
  artifacts: GeneratedArtifactCreateInput[];
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function buildSignal(
  signalType: ArtifactSignalType,
  score: number,
  detail: string,
): ArtifactSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: ARTIFACT_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function baseMetadata(
  input: ArtifactCodeGenerationInput,
  sourceId: string,
  mimeType: string,
  description: string,
): ArtifactFileMetadata {
  return {
    sourceId,
    mimeType,
    generatedStorefrontId: input.generatedStorefrontId,
    storefrontId: input.storefrontId,
    storeId: input.storeId,
    brandId: input.brandId,
    description,
  };
}

function buildPageArtifacts(input: ArtifactCodeGenerationInput): ArtifactFile[] {
  return input.generatedPages.map((page) => ({
    filePath: page.filePath,
    fileType: "PAGE" as const,
    generatedContent: page.sourceCode,
    metadata: baseMetadata(input, page.pageId, "text/tsx", `Generated page ${page.pageName}`),
  }));
}

function buildComponentArtifacts(input: ArtifactCodeGenerationInput): ArtifactFile[] {
  return input.generatedComponents.map((component) => ({
    filePath: component.filePath,
    fileType: "COMPONENT" as const,
    generatedContent: component.sourceCode,
    metadata: baseMetadata(
      input,
      component.componentId,
      "text/tsx",
      `Generated component ${component.componentName}`,
    ),
  }));
}

function buildPackageJson(input: ArtifactCodeGenerationInput): string {
  return JSON.stringify(
    {
      name: input.projectStructure.packageName,
      private: true,
      scripts: {
        dev: "next dev",
        build: input.deploymentMetadata.buildCommand.replace("npm run ", ""),
        start: input.deploymentMetadata.startCommand.replace("npm run ", ""),
      },
      dependencies: {
        next: "14.0.0",
        react: "18.2.0",
        "react-dom": "18.2.0",
      },
    },
    null,
    2,
  );
}

function buildConfigArtifacts(input: ArtifactCodeGenerationInput): ArtifactFile[] {
  const configs: Array<{ filePath: string; content: string; mimeType: string; description: string }> =
    [
      {
        filePath: "package.json",
        content: buildPackageJson(input),
        mimeType: "application/json",
        description: "Project package manifest",
      },
      {
        filePath: "tsconfig.json",
        content: JSON.stringify(
          {
            compilerOptions: {
              target: "ES2022",
              module: "ESNext",
              jsx: "preserve",
              strict: true,
            },
            include: ["src"],
          },
          null,
          2,
        ),
        mimeType: "application/json",
        description: "TypeScript configuration",
      },
      {
        filePath: "next.config.js",
        content: [
          "/** @type {import('next').NextConfig} */",
          "const nextConfig = { reactStrictMode: true };",
          "module.exports = nextConfig;",
          "",
        ].join("\n"),
        mimeType: "application/javascript",
        description: "Next.js configuration",
      },
    ];

  return configs.map((config) => ({
    filePath: config.filePath,
    fileType: "CONFIG" as const,
    generatedContent: config.content,
    metadata: baseMetadata(
      input,
      `config-${config.filePath}`,
      config.mimeType,
      config.description,
    ),
  }));
}

function buildRouteArtifact(input: ArtifactCodeGenerationInput): ArtifactFile {
  const routes = input.generatedPages.map((page: GeneratedPage) => ({
    route: page.route,
    pageId: page.pageId,
    pageType: page.pageType,
    filePath: page.filePath,
  }));

  return {
    filePath: "src/routes.json",
    fileType: "ROUTE",
    generatedContent: JSON.stringify({ routes }, null, 2),
    metadata: baseMetadata(
      input,
      "route-manifest",
      "application/json",
      "Storefront route manifest",
    ),
  };
}

function buildMetadataArtifacts(input: ArtifactCodeGenerationInput): ArtifactFile[] {
  return [
    {
      filePath: "deployment.json",
      fileType: "METADATA" as const,
      generatedContent: JSON.stringify(input.deploymentMetadata, null, 2),
      metadata: baseMetadata(
        input,
        "deployment-metadata",
        "application/json",
        "Deployment metadata artifact",
      ),
    },
    {
      filePath: "README.md",
      fileType: "METADATA" as const,
      generatedContent: [
        `# ${input.projectStructure.packageName}`,
        "",
        input.deploymentMetadata.deployNotes,
        "",
        "## Build",
        "",
        `\`${input.deploymentMetadata.buildCommand}\``,
        "",
      ].join("\n"),
      metadata: baseMetadata(input, "readme", "text/markdown", "Project README artifact"),
    },
  ];
}

function computeArtifactConfidence(
  input: ArtifactCodeGenerationInput,
  file: ArtifactFile,
): number {
  const contentScore = file.generatedContent.length >= 40 ? 88 : 58;
  const typeBonus: Record<ArtifactFileType, number> = {
    PAGE: 86,
    COMPONENT: 84,
    CONFIG: 80,
    METADATA: 78,
    ROUTE: 82,
  };

  return clampScore(input.confidence * 0.55 + contentScore * 0.25 + typeBonus[file.fileType] * 0.2);
}

function buildArtifactSignals(
  input: ArtifactCodeGenerationInput,
  files: ArtifactFile[],
  confidence: number,
): ArtifactSignal[] {
  const pageCount = files.filter((file) => file.fileType === "PAGE").length;
  const componentCount = files.filter((file) => file.fileType === "COMPONENT").length;
  const configCount = files.filter((file) => file.fileType === "CONFIG").length;
  const metadataCount = files.filter((file) => file.fileType === "METADATA").length;
  const hasRoute = files.some((file) => file.fileType === "ROUTE");

  return [
    buildSignal("code_generation_alignment", input.confidence, "Storefront code generation alignment"),
    buildSignal(
      "page_artifact_coverage",
      pageCount === input.generatedPages.length ? 88 : 60,
      `${pageCount} page artifacts generated`,
    ),
    buildSignal(
      "component_artifact_coverage",
      componentCount === input.generatedComponents.length ? 86 : 58,
      `${componentCount} component artifacts generated`,
    ),
    buildSignal(
      "config_artifact_readiness",
      configCount >= 3 ? 85 : 62,
      `${configCount} config artifacts generated`,
    ),
    buildSignal(
      "route_manifest_completeness",
      hasRoute ? 88 : 50,
      hasRoute ? "Route manifest artifact generated" : "Route manifest missing",
    ),
    buildSignal(
      "metadata_artifact_quality",
      metadataCount >= 2 ? 84 : 60,
      `${metadataCount} metadata artifacts generated`,
    ),
    buildSignal(
      "file_content_quality",
      average(files.map((file) => (file.generatedContent.length >= 20 ? 85 : 55))),
      "Generated file content quality",
    ),
    buildSignal("artifact_composite", confidence, `Artifact confidence ${confidence}`),
  ];
}

function toGeneratedArtifact(
  input: ArtifactCodeGenerationInput,
  file: ArtifactFile,
): GeneratedArtifactCreateInput {
  const confidence = computeArtifactConfidence(input, file);
  const signals = buildArtifactSignals(input, [file], confidence);

  return {
    generatedStorefrontId: input.generatedStorefrontId,
    filePath: file.filePath,
    fileType: file.fileType,
    generatedContent: file.generatedContent,
    metadata: file.metadata,
    confidence,
    signals,
  };
}

/** Generates concrete file artifacts from storefront code generation outputs. */
export function scoreStorefrontArtifactGeneration(
  input: StorefrontArtifactGenerationInput,
): StorefrontArtifactGenerationBreakdown {
  const { codeGeneration } = input;

  const files: ArtifactFile[] = [
    ...buildPageArtifacts(codeGeneration),
    ...buildComponentArtifacts(codeGeneration),
    ...buildConfigArtifacts(codeGeneration),
    buildRouteArtifact(codeGeneration),
    ...buildMetadataArtifacts(codeGeneration),
  ];

  const artifacts = files.map((file) => toGeneratedArtifact(codeGeneration, file));

  return {
    generatedStorefrontId: codeGeneration.generatedStorefrontId,
    artifacts,
  };
}

export const artifactGenerationScoring = {
  scoreStorefrontArtifactGeneration,
  weights: ARTIFACT_SIGNAL_WEIGHTS,
};
