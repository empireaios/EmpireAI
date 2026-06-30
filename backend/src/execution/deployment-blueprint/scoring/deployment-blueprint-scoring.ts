import { randomUUID } from "node:crypto";

import type {
  BuildMetadata,
  MaterializedProjectStructure,
} from "../../project-materialization/models/materialized-project.js";
import type { DeploymentPlanCreateInput } from "../models/deployment-plan.js";
import type { DeploymentSignal, DeploymentSignalType } from "../models/deployment-signal.js";
import type { DeploymentStep } from "../models/deployment-step.js";
import type { DomainRequirements } from "../models/domain-requirements.js";
import type { HostingTarget } from "../models/hosting-target.js";

export const DEPLOYMENT_SIGNAL_WEIGHTS: Record<DeploymentSignalType, number> = {
  framework_fit: 0.2,
  hosting_alignment: 0.18,
  env_readiness: 0.16,
  domain_readiness: 0.14,
  step_coverage: 0.12,
  build_metadata_alignment: 0.12,
  deployment_composite: 0.08,
};

export type DeploymentBlueprintProjectInput = {
  projectId: string;
  generatedStorefrontId: string;
  storeId: string;
  brandId: string;
  projectStructure: MaterializedProjectStructure;
  buildMetadata: BuildMetadata;
  confidence: number;
  materializedFileCount?: number;
};

export type DeploymentBlueprintInput = {
  project: DeploymentBlueprintProjectInput;
  preferredHostingTarget?: HostingTarget;
};

export type DeploymentBlueprintBreakdown = DeploymentPlanCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildSignal(
  signalType: DeploymentSignalType,
  score: number,
  detail: string,
): DeploymentSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: DEPLOYMENT_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function resolveHostingTarget(
  framework: string,
  buildMetadata: BuildMetadata,
  preferred?: HostingTarget,
): HostingTarget {
  if (preferred) return preferred;

  const normalizedFramework = framework.toLowerCase();
  if (normalizedFramework.includes("next")) {
    return "VERCEL";
  }
  if (
    buildMetadata.outputDirectory === "out" ||
    normalizedFramework.includes("static") ||
    buildMetadata.startCommand === "npx serve out"
  ) {
    return "STATIC_EXPORT";
  }
  if (buildMetadata.platform === "docker") {
    return "DOCKER";
  }
  return "VPS";
}

function buildEnvironmentVariables(
  project: DeploymentBlueprintProjectInput,
  hostingTarget: HostingTarget,
): Record<string, string> {
  const base = { ...project.buildMetadata.envVars };

  return {
    ...base,
    NODE_ENV: "production",
    DEPLOYMENT_TARGET: hostingTarget,
    STORE_ID: project.storeId,
    BRAND_ID: project.brandId,
    PROJECT_ID: project.projectId,
    ...(hostingTarget === "VERCEL"
      ? {
          VERCEL_ENV: "production",
          NEXT_TELEMETRY_DISABLED: "1",
        }
      : {}),
    ...(hostingTarget === "DOCKER"
      ? {
          PORT: "3000",
          HOSTNAME: "0.0.0.0",
        }
      : {}),
  };
}

function buildDomainRequirements(
  project: DeploymentBlueprintProjectInput,
  hostingTarget: HostingTarget,
): DomainRequirements {
  const slug = slugify(project.brandId).slice(0, 24) || "storefront";
  const primaryDomain = `${slug}.empireai.store`;

  const dnsRecords =
    hostingTarget === "VERCEL"
      ? [
          {
            type: "CNAME",
            name: slug,
            value: "cname.vercel-dns.com",
            purpose: "Route storefront traffic to Vercel deployment",
          },
        ]
      : hostingTarget === "STATIC_EXPORT"
        ? [
            {
              type: "CNAME",
              name: slug,
              value: "cdn.empireai.store",
              purpose: "Serve static export via EmpireAI CDN edge",
            },
          ]
        : [
            {
              type: "A",
              name: slug,
              value: "203.0.113.10",
              purpose: "Point domain to VPS or Docker host",
            },
          ];

  return {
    primaryDomain,
    subdomainAllowed: true,
    sslRequired: true,
    dnsRecords,
    notes: `Configure DNS for ${hostingTarget} deployment of ${project.projectStructure.packageName}.`,
  };
}

function buildStep(
  order: number,
  title: string,
  description: string,
  command: string | null = null,
): DeploymentStep {
  return {
    stepId: randomUUID(),
    order,
    title,
    description,
    command,
    status: "pending",
  };
}

function buildDeploymentSteps(
  project: DeploymentBlueprintProjectInput,
  hostingTarget: HostingTarget,
): DeploymentStep[] {
  const root = project.projectStructure.rootDirectory;
  const buildCommand = project.buildMetadata.buildCommand;
  const startCommand = project.buildMetadata.startCommand;

  switch (hostingTarget) {
    case "VERCEL":
      return [
        buildStep(0, "Install Vercel CLI", "Install the Vercel CLI in the deployment environment.", "npm i -g vercel"),
        buildStep(1, "Link project", `Link ${root} to a Vercel project.`, `cd ${root} && vercel link`),
        buildStep(
          2,
          "Configure environment variables",
          "Apply production environment variables in Vercel project settings.",
          null,
        ),
        buildStep(3, "Deploy production build", "Deploy the materialized storefront to Vercel.", `cd ${root} && vercel deploy --prod`),
      ];
    case "DOCKER":
      return [
        buildStep(
          0,
          "Build container image",
          "Build a production Docker image from the materialized project.",
          `docker build -t ${project.projectStructure.packageName}:latest ${root}`,
        ),
        buildStep(
          1,
          "Run container",
          "Start the storefront container with required environment variables.",
          `docker run -d -p 3000:3000 --env-file .env.production ${project.projectStructure.packageName}:latest`,
        ),
        buildStep(2, "Verify health", "Confirm the container serves the generated storefront routes.", "curl -f http://localhost:3000/"),
      ];
    case "VPS":
      return [
        buildStep(0, "Provision VPS host", "Prepare a Linux VPS with Node.js 20+ and process manager support.", null),
        buildStep(1, "Upload project", `Copy materialized project files to the VPS at ${root}.`, `rsync -av ${root}/ user@vps:/var/www/storefront/`),
        buildStep(2, "Install dependencies", "Install production dependencies on the VPS.", "cd /var/www/storefront && npm ci"),
        buildStep(3, "Build project", "Run the production build command.", `cd /var/www/storefront && ${buildCommand}`),
        buildStep(
          4,
          "Start service",
          "Launch the storefront with a process manager.",
          `cd /var/www/storefront && ${startCommand}`,
        ),
      ];
    case "STATIC_EXPORT":
      return [
        buildStep(
          0,
          "Build static export",
          "Generate static HTML/CSS/JS output from the materialized project.",
          `cd ${root} && ${buildCommand}`,
        ),
        buildStep(
          1,
          "Upload static assets",
          `Publish ${project.buildMetadata.outputDirectory} to static hosting.`,
          `aws s3 sync ${root}/${project.buildMetadata.outputDirectory} s3://empireai-storefronts/${project.storeId}`,
        ),
        buildStep(2, "Configure CDN domain", "Map the primary domain to the static asset bucket or CDN.", null),
      ];
    default:
      return [
        buildStep(0, "Review deployment plan", "Validate hosting target and deployment prerequisites.", null),
      ];
  }
}

function computeConfidence(
  project: DeploymentBlueprintProjectInput,
  hostingTarget: HostingTarget,
  environmentVariables: Record<string, string>,
  domainRequirements: DomainRequirements,
  deploymentSteps: DeploymentStep[],
): number {
  const framework = project.projectStructure.framework.toLowerCase();
  const frameworkFit =
    hostingTarget === "VERCEL" && framework.includes("next")
      ? 92
      : hostingTarget === "STATIC_EXPORT" && project.buildMetadata.outputDirectory === "out"
        ? 88
        : hostingTarget === "DOCKER"
          ? 84
          : 78;

  const envScore = Object.keys(environmentVariables).length >= 3 ? 86 : 62;
  const domainScore = domainRequirements.dnsRecords.length >= 1 ? 85 : 55;
  const stepScore = deploymentSteps.length >= 3 ? 88 : 65;
  const metadataScore =
    project.buildMetadata.buildCommand.length > 0 &&
    project.buildMetadata.startCommand.length > 0
      ? 84
      : 58;

  return clampScore(
    project.confidence * 0.35 +
      frameworkFit * 0.25 +
      envScore * 0.15 +
      domainScore * 0.1 +
      stepScore * 0.1 +
      metadataScore * 0.05,
  );
}

function buildSignals(
  project: DeploymentBlueprintProjectInput,
  hostingTarget: HostingTarget,
  environmentVariables: Record<string, string>,
  domainRequirements: DomainRequirements,
  deploymentSteps: DeploymentStep[],
  confidence: number,
): DeploymentSignal[] {
  const framework = project.projectStructure.framework.toLowerCase();

  return [
    buildSignal(
      "framework_fit",
      framework.includes("next") ? 90 : 72,
      `Framework ${project.projectStructure.framework}`,
    ),
    buildSignal(
      "hosting_alignment",
      hostingTarget === "VERCEL" && framework.includes("next") ? 92 : 78,
      `Hosting target ${hostingTarget}`,
    ),
    buildSignal(
      "env_readiness",
      Object.keys(environmentVariables).length >= 3 ? 86 : 60,
      `${Object.keys(environmentVariables).length} environment variables prepared`,
    ),
    buildSignal(
      "domain_readiness",
      domainRequirements.dnsRecords.length >= 1 ? 85 : 55,
      `Primary domain ${domainRequirements.primaryDomain}`,
    ),
    buildSignal(
      "step_coverage",
      deploymentSteps.length >= 3 ? 88 : 62,
      `${deploymentSteps.length} deployment steps generated`,
    ),
    buildSignal(
      "build_metadata_alignment",
      project.buildMetadata.buildCommand ? 84 : 58,
      `Build command ${project.buildMetadata.buildCommand}`,
    ),
    buildSignal("deployment_composite", confidence, `Deployment confidence ${confidence}`),
  ];
}

/** Generates a deployment plan from a materialized storefront project. */
export function scoreDeploymentBlueprint(
  input: DeploymentBlueprintInput,
): DeploymentBlueprintBreakdown {
  const { project, preferredHostingTarget } = input;
  const framework = project.projectStructure.framework;
  const hostingTarget = resolveHostingTarget(
    framework,
    project.buildMetadata,
    preferredHostingTarget,
  );
  const environmentVariables = buildEnvironmentVariables(project, hostingTarget);
  const domainRequirements = buildDomainRequirements(project, hostingTarget);
  const deploymentSteps = buildDeploymentSteps(project, hostingTarget);
  const confidence = computeConfidence(
    project,
    hostingTarget,
    environmentVariables,
    domainRequirements,
    deploymentSteps,
  );
  const signals = buildSignals(
    project,
    hostingTarget,
    environmentVariables,
    domainRequirements,
    deploymentSteps,
    confidence,
  );

  return {
    projectId: project.projectId,
    generatedStorefrontId: project.generatedStorefrontId,
    storeId: project.storeId,
    brandId: project.brandId,
    framework,
    hostingTarget,
    environmentVariables,
    domainRequirements,
    deploymentSteps,
    confidence,
    signals,
  };
}

export const deploymentBlueprintScoring = {
  scoreDeploymentBlueprint,
  weights: DEPLOYMENT_SIGNAL_WEIGHTS,
};
