import fs from "node:fs";
import path from "node:path";

import { loadProductionDeploymentEnv } from "../config/production-deployment-env.js";

export type VercelDeploymentFile = {
  file: string;
  data: string;
};

export type VercelDeploymentResult = {
  id: string;
  url: string;
  projectId: string | null;
  readyState: string;
  mock: boolean;
};

export type VercelDomainResult = {
  name: string;
  verified: boolean;
  sslEnabled: boolean;
  mock: boolean;
};

function buildVercelHeaders(token: string, teamId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  if (teamId) {
    headers["x-vercel-team-id"] = teamId;
  }
  return headers;
}

function teamQuery(teamId?: string): string {
  return teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
}

/** Collects deployable files from a source directory for Vercel upload. */
export function collectDeploymentFiles(sourcePath: string): VercelDeploymentFile[] {
  const files: VercelDeploymentFile[] = [];

  function walk(current: string, prefix = ""): void {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(fullPath, relativePath);
      } else {
        const content = fs.readFileSync(fullPath);
        files.push({
          file: relativePath.replace(/\\/g, "/"),
          data: content.toString("base64"),
        });
      }
    }
  }

  walk(sourcePath);
  return files;
}

/** Creates Vercel-ready static project with package.json, vercel.json, and build output. */
export function prepareVercelProject(input: {
  targetPath: string;
  projectName: string;
  buildCommand: string;
  outputDirectory: string;
  environmentVariables: Record<string, string>;
  sourceFiles?: Array<{ relativePath: string; content: string }>;
}): string {
  fs.mkdirSync(input.targetPath, { recursive: true });

  if (input.sourceFiles?.length) {
    for (const file of input.sourceFiles) {
      const filePath = path.join(input.targetPath, file.relativePath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, file.content, "utf8");
    }
  }

  const packageJson = {
    name: input.projectName,
    private: true,
    version: "1.0.0",
    scripts: {
      build: input.buildCommand === "npm run build" ? "echo static build complete" : input.buildCommand,
      start: "npx serve .",
    },
    devDependencies: {
      serve: "^14.2.4",
    },
  };

  const vercelJson = {
    version: 2,
    name: input.projectName,
    buildCommand: input.buildCommand,
    outputDirectory: input.outputDirectory === "." ? undefined : input.outputDirectory,
    env: input.environmentVariables,
  };

  fs.writeFileSync(
    path.join(input.targetPath, "package.json"),
    JSON.stringify(packageJson, null, 2),
    "utf8",
  );
  fs.writeFileSync(
    path.join(input.targetPath, "vercel.json"),
    JSON.stringify(vercelJson, null, 2),
    "utf8",
  );

  if (!fs.existsSync(path.join(input.targetPath, "index.html")) && !input.sourceFiles?.length) {
    fs.writeFileSync(
      path.join(input.targetPath, "index.html"),
      `<!DOCTYPE html><html><head><title>${input.projectName}</title></head><body><h1>${input.projectName}</h1></body></html>`,
      "utf8",
    );
  }

  return input.targetPath;
}

/** Deploys files to Vercel via REST API or mock mode. */
export async function createVercelDeployment(input: {
  projectName: string;
  sourcePath: string;
  environmentVariables: Record<string, string>;
  target?: "production" | "preview";
}): Promise<VercelDeploymentResult> {
  const config = loadProductionDeploymentEnv();

  if (config.PRODUCTION_DEPLOY_MOCK || !config.VERCEL_API_TOKEN) {
    const mockId = `dpl_mock_${Date.now()}`;
    return {
      id: mockId,
      url: `https://${input.projectName}-mock.vercel.app`,
      projectId: `prj_mock_${input.projectName}`,
      readyState: "READY",
      mock: true,
    };
  }

  const files = collectDeploymentFiles(input.sourcePath);
  const headers = buildVercelHeaders(config.VERCEL_API_TOKEN, config.VERCEL_TEAM_ID);

  const response = await fetch(
    `https://api.vercel.com/v13/deployments${teamQuery(config.VERCEL_TEAM_ID)}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: input.projectName,
        files: files.map((file) => ({ file: file.file, data: file.data })),
        projectSettings: {
          framework: null,
          buildCommand: null,
          outputDirectory: null,
        },
        env: input.environmentVariables,
        target: input.target ?? "production",
      }),
    },
  );

  const payload = (await response.json()) as {
    id?: string;
    url?: string;
    projectId?: string;
    readyState?: string;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Vercel deployment failed (${response.status})`);
  }

  return {
    id: payload.id ?? `dpl_${Date.now()}`,
    url: payload.url ? `https://${payload.url}` : `https://${input.projectName}.vercel.app`,
    projectId: payload.projectId ?? null,
    readyState: payload.readyState ?? "READY",
    mock: false,
  };
}

/** Adds custom domain to Vercel project — SSL provisioned automatically by Vercel. */
export async function addVercelCustomDomain(input: {
  projectId: string;
  domain: string;
}): Promise<VercelDomainResult> {
  const config = loadProductionDeploymentEnv();

  if (config.PRODUCTION_DEPLOY_MOCK || !config.VERCEL_API_TOKEN) {
    return {
      name: input.domain,
      verified: true,
      sslEnabled: true,
      mock: true,
    };
  }

  const headers = buildVercelHeaders(config.VERCEL_API_TOKEN, config.VERCEL_TEAM_ID);
  const response = await fetch(
    `https://api.vercel.com/v10/projects/${input.projectId}/domains${teamQuery(config.VERCEL_TEAM_ID)}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ name: input.domain }),
    },
  );

  const payload = (await response.json()) as {
    name?: string;
    verified?: boolean;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Vercel domain assignment failed (${response.status})`);
  }

  return {
    name: payload.name ?? input.domain,
    verified: payload.verified ?? false,
    sslEnabled: true,
    mock: false,
  };
}

/** Rolls back to a previous Vercel deployment by promoting it to production. */
export async function rollbackVercelDeployment(input: {
  projectId: string;
  deploymentId: string;
}): Promise<VercelDeploymentResult> {
  const config = loadProductionDeploymentEnv();

  if (config.PRODUCTION_DEPLOY_MOCK || !config.VERCEL_API_TOKEN) {
    return {
      id: input.deploymentId,
      url: `https://rollback-mock.vercel.app`,
      projectId: input.projectId,
      readyState: "READY",
      mock: true,
    };
  }

  const headers = buildVercelHeaders(config.VERCEL_API_TOKEN, config.VERCEL_TEAM_ID);
  const response = await fetch(
    `https://api.vercel.com/v13/deployments/${input.deploymentId}/promote${teamQuery(config.VERCEL_TEAM_ID)}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ target: "production" }),
    },
  );

  const payload = (await response.json()) as {
    id?: string;
    url?: string;
    projectId?: string;
    readyState?: string;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Vercel rollback failed (${response.status})`);
  }

  return {
    id: payload.id ?? input.deploymentId,
    url: payload.url ? `https://${payload.url}` : "",
    projectId: payload.projectId ?? input.projectId,
    readyState: payload.readyState ?? "READY",
    mock: false,
  };
}
