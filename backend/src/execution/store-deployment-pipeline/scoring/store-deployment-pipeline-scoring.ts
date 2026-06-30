import { randomUUID } from "node:crypto";

import type { DeploymentStep } from "../../deployment-blueprint/models/deployment-step.js";
import type { DomainRequirements } from "../../deployment-blueprint/models/domain-requirements.js";
import type { HostingTarget } from "../../deployment-blueprint/models/hosting-target.js";
import type {
  BuildMetadata,
  MaterializedProjectStructure,
} from "../../project-materialization/models/materialized-project.js";
import type { MaterializedFileCreateInput } from "../../project-materialization/models/materialized-project.js";
import type { DeploymentArtifact, DeploymentArtifactType } from "../models/deployment-artifact.js";
import type { DeploymentMetadata } from "../models/deployment-metadata.js";
import type { DeploymentPackage } from "../models/deployment-package.js";
import type { DeploymentStatus } from "../models/deployment-status.js";
import type {
  DeploymentPipelineSignal,
  DeploymentPipelineSignalType,
} from "../models/deployment-pipeline-signal.js";
import type { StoreDeploymentRecordCreateInput } from "../models/store-deployment-record.js";

export const DEPLOYMENT_PIPELINE_SIGNAL_WEIGHTS: Record<DeploymentPipelineSignalType, number> = {
  plan_project_alignment: 0.22,
  source_file_coverage: 0.2,
  config_completeness: 0.16,
  env_readiness: 0.14,
  hosting_target_fit: 0.12,
  manifest_coverage: 0.1,
  pipeline_composite: 0.06,
};

export type StoreDeploymentPlanInput = {
  deploymentPlanId?: string;
  projectId: string;
  generatedStorefrontId: string;
  storeId: string;
  brandId: string;
  framework: string;
  hostingTarget: HostingTarget;
  environmentVariables: Record<string, string>;
  domainRequirements: DomainRequirements;
  deploymentSteps: DeploymentStep[];
  confidence: number;
};

export type StoreDeploymentProjectInput = {
  projectId: string;
  generatedStorefrontId: string;
  storeId: string;
  brandId: string;
  projectStructure: MaterializedProjectStructure;
  materializedFiles: MaterializedFileCreateInput[];
  buildMetadata: BuildMetadata;
  confidence: number;
};

export type StoreDeploymentPipelineInput = {
  deploymentPlan: StoreDeploymentPlanInput;
  project: StoreDeploymentProjectInput;
};

export type StoreDeploymentPipelineBreakdown = StoreDeploymentRecordCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: DeploymentPipelineSignalType,
  score: number,
  detail: string,
): DeploymentPipelineSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: DEPLOYMENT_PIPELINE_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function validateAlignment(
  plan: StoreDeploymentPlanInput,
  project: StoreDeploymentProjectInput,
): { aligned: boolean; score: number; detail: string } {
  const checks = [
    plan.projectId === project.projectId,
    plan.generatedStorefrontId === project.generatedStorefrontId,
    plan.storeId === project.storeId,
    plan.brandId === project.brandId,
  ];
  const passed = checks.filter(Boolean).length;

  return {
    aligned: passed === checks.length,
    score: clampScore((passed / checks.length) * 100),
    detail: `${passed}/${checks.length} deployment plan and project identifiers aligned`,
  };
}

function buildEnvArtifact(environmentVariables: Record<string, string>): DeploymentArtifact {
  const content = Object.entries(environmentVariables)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  return {
    artifactId: randomUUID(),
    filePath: ".env.production",
    artifactType: "ENV",
    content,
    mimeType: "text/plain",
    sizeBytes: Buffer.byteLength(content, "utf8"),
  };
}

function buildManifestArtifact(
  plan: StoreDeploymentPlanInput,
  project: StoreDeploymentProjectInput,
  packageId: string,
): DeploymentArtifact {
  const content = JSON.stringify(
    {
      packageId,
      executionMode: "PACKAGE_ONLY",
      deploymentPlanId: plan.deploymentPlanId ?? null,
      projectId: project.projectId,
      generatedStorefrontId: project.generatedStorefrontId,
      hostingTarget: plan.hostingTarget,
      framework: plan.framework,
      primaryDomain: plan.domainRequirements.primaryDomain,
      deploymentSteps: plan.deploymentSteps,
      domainRequirements: plan.domainRequirements,
      buildMetadata: project.buildMetadata,
    },
    null,
    2,
  );

  return {
    artifactId: randomUUID(),
    filePath: "deployment.manifest.json",
    artifactType: "MANIFEST",
    content,
    mimeType: "application/json",
    sizeBytes: Buffer.byteLength(content, "utf8"),
  };
}

function buildHostingConfigArtifact(
  hostingTarget: HostingTarget,
  project: StoreDeploymentProjectInput,
): DeploymentArtifact | null {
  switch (hostingTarget) {
    case "VERCEL": {
      const content = JSON.stringify(
        {
          version: 2,
          framework: project.projectStructure.framework,
          buildCommand: project.buildMetadata.buildCommand,
          outputDirectory: project.buildMetadata.outputDirectory,
        },
        null,
        2,
      );
      return {
        artifactId: randomUUID(),
        filePath: "vercel.json",
        artifactType: "CONFIG",
        content,
        mimeType: "application/json",
        sizeBytes: Buffer.byteLength(content, "utf8"),
      };
    }
    case "DOCKER": {
      const content = [
        "FROM node:20-alpine",
        "WORKDIR /app",
        "COPY package*.json ./",
        "RUN npm ci",
        "COPY . .",
        `RUN ${project.buildMetadata.buildCommand}`,
        "EXPOSE 3000",
        `CMD ${project.buildMetadata.startCommand}`,
      ].join("\n");
      return {
        artifactId: randomUUID(),
        filePath: "Dockerfile",
        artifactType: "CONFIG",
        content,
        mimeType: "text/plain",
        sizeBytes: Buffer.byteLength(content, "utf8"),
      };
    }
    case "VPS": {
      const content = [
        "#!/usr/bin/env bash",
        "set -euo pipefail",
        `cd ${project.projectStructure.rootDirectory}`,
        "npm ci",
        project.buildMetadata.buildCommand,
        project.buildMetadata.startCommand,
      ].join("\n");
      return {
        artifactId: randomUUID(),
        filePath: "deploy.sh",
        artifactType: "CONFIG",
        content,
        mimeType: "text/plain",
        sizeBytes: Buffer.byteLength(content, "utf8"),
      };
    }
    case "STATIC_EXPORT": {
      const content = JSON.stringify(
        {
          exportTrailingSlash: true,
          output: project.buildMetadata.outputDirectory,
          distDir: project.buildMetadata.outputDirectory,
        },
        null,
        2,
      );
      return {
        artifactId: randomUUID(),
        filePath: "static-export.config.json",
        artifactType: "CONFIG",
        content,
        mimeType: "application/json",
        sizeBytes: Buffer.byteLength(content, "utf8"),
      };
    }
    default:
      return null;
  }
}

function mapSourceArtifacts(files: MaterializedFileCreateInput[]): DeploymentArtifact[] {
  return files.map((file) => ({
    artifactId: randomUUID(),
    filePath: file.relativePath,
    artifactType: "SOURCE" as DeploymentArtifactType,
    content: file.content,
    mimeType: file.mimeType,
    sizeBytes: Buffer.byteLength(file.content, "utf8"),
  }));
}

function resolveDeploymentStatus(
  alignment: ReturnType<typeof validateAlignment>,
  sourceArtifacts: DeploymentArtifact[],
): DeploymentStatus {
  if (!alignment.aligned) return "PACKAGE_FAILED";
  if (sourceArtifacts.length === 0) return "PACKAGE_FAILED";
  return "PACKAGE_CREATED";
}

function computeConfidence(
  plan: StoreDeploymentPlanInput,
  project: StoreDeploymentProjectInput,
  alignmentScore: number,
  artifacts: DeploymentArtifact[],
  signals: DeploymentPipelineSignal[],
): number {
  const readyFiles = project.materializedFiles.filter((file) => file.status === "READY").length;
  const sourceCoverage =
    project.materializedFiles.length === 0
      ? 0
      : (readyFiles / project.materializedFiles.length) * 100;

  return clampScore(
    plan.confidence * 0.25 +
      project.confidence * 0.25 +
      alignmentScore * 0.2 +
      sourceCoverage * 0.15 +
      (artifacts.some((artifact) => artifact.artifactType === "CONFIG") ? 82 : 55) * 0.1 +
      average(signals.map((signal) => signal.score)) * 0.05,
  );
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function buildSignals(
  plan: StoreDeploymentPlanInput,
  project: StoreDeploymentProjectInput,
  alignment: ReturnType<typeof validateAlignment>,
  artifacts: DeploymentArtifact[],
  confidence: number,
): DeploymentPipelineSignal[] {
  const configArtifacts = artifacts.filter((artifact) => artifact.artifactType === "CONFIG");
  const envArtifacts = artifacts.filter((artifact) => artifact.artifactType === "ENV");
  const manifestArtifacts = artifacts.filter((artifact) => artifact.artifactType === "MANIFEST");
  const sourceArtifacts = artifacts.filter((artifact) => artifact.artifactType === "SOURCE");

  return [
    buildSignal("plan_project_alignment", alignment.score, alignment.detail),
    buildSignal(
      "source_file_coverage",
      project.materializedFiles.length === 0
        ? 0
        : clampScore((sourceArtifacts.length / project.materializedFiles.length) * 100),
      `${sourceArtifacts.length} source artifacts packaged`,
    ),
    buildSignal(
      "config_completeness",
      configArtifacts.length >= 1 ? 88 : 42,
      `${configArtifacts.length} hosting config artifacts generated`,
    ),
    buildSignal(
      "env_readiness",
      envArtifacts.length >= 1 && Object.keys(plan.environmentVariables).length >= 3 ? 86 : 58,
      `${Object.keys(plan.environmentVariables).length} environment variables packaged`,
    ),
    buildSignal(
      "hosting_target_fit",
      plan.hostingTarget === "VERCEL" && plan.framework.includes("next") ? 92 : 78,
      `Hosting target ${plan.hostingTarget} for ${plan.framework}`,
    ),
    buildSignal(
      "manifest_coverage",
      manifestArtifacts.length >= 1 ? 90 : 40,
      `${manifestArtifacts.length} deployment manifest artifacts generated`,
    ),
    buildSignal("pipeline_composite", confidence, `Pipeline confidence ${confidence}`),
  ];
}

/** Assembles a deployment package from a deployment plan and materialized storefront project. */
export function scoreStoreDeploymentPipeline(
  input: StoreDeploymentPipelineInput,
): StoreDeploymentPipelineBreakdown {
  const { deploymentPlan: plan, project } = input;
  const packageId = randomUUID();
  const alignment = validateAlignment(plan, project);
  const sourceArtifacts = mapSourceArtifacts(project.materializedFiles);
  const envArtifact = buildEnvArtifact(plan.environmentVariables);
  const manifestArtifact = buildManifestArtifact(plan, project, packageId);
  const hostingConfig = buildHostingConfigArtifact(plan.hostingTarget, project);

  const deploymentArtifacts = [
    manifestArtifact,
    envArtifact,
    ...(hostingConfig ? [hostingConfig] : []),
    ...sourceArtifacts,
  ];

  const deploymentStatus = resolveDeploymentStatus(alignment, sourceArtifacts);
  const packageRoot = `${project.projectStructure.rootDirectory}/deployment-packages/${packageId}`;

  const deploymentPackage: DeploymentPackage = {
    packageId,
    packageRoot,
    hostingTarget: plan.hostingTarget,
    framework: plan.framework,
    primaryDomain: plan.domainRequirements.primaryDomain,
    artifactCount: deploymentArtifacts.length,
    packageVersion: "1.0.0",
  };

  const deploymentMetadata: DeploymentMetadata = {
    deploymentPlanId: plan.deploymentPlanId ?? null,
    projectId: project.projectId,
    generatedStorefrontId: project.generatedStorefrontId,
    storeId: project.storeId,
    brandId: project.brandId,
    hostingTarget: plan.hostingTarget,
    buildCommand: project.buildMetadata.buildCommand,
    startCommand: project.buildMetadata.startCommand,
    outputDirectory: project.buildMetadata.outputDirectory,
    environmentVariableCount: Object.keys(plan.environmentVariables).length,
    stepCount: plan.deploymentSteps.length,
    sourceFileCount: sourceArtifacts.length,
    planConfidence: plan.confidence,
    projectConfidence: project.confidence,
    executionMode: "PACKAGE_ONLY",
    notes: "Deployment package created locally. No production deployment executed.",
  };

  const provisionalSignals = buildSignals(plan, project, alignment, deploymentArtifacts, 0);
  const confidence = computeConfidence(
    plan,
    project,
    alignment.score,
    deploymentArtifacts,
    provisionalSignals,
  );
  const signals = buildSignals(plan, project, alignment, deploymentArtifacts, confidence);

  return {
    deploymentPackage,
    deploymentArtifacts,
    deploymentStatus,
    deploymentMetadata,
    confidence,
    signals,
  };
}

export const storeDeploymentPipelineScoring = {
  scoreStoreDeploymentPipeline,
  weights: DEPLOYMENT_PIPELINE_SIGNAL_WEIGHTS,
};
