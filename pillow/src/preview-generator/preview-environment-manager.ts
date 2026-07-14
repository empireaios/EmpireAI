/** T3-05 — Manages isolated preview environments. */

import type { PreviewGeneratorConfiguration } from "./configuration.js";
import type { EnvironmentStatus } from "./types.js";
import { appendPreviewLog } from "./preview-logging.js";
import { PreviewMetadataGenerator } from "./preview-metadata-generator.js";

export type PreviewEnvironment = {
  environmentId: string;
  status: EnvironmentStatus;
  basePath: string;
  createdAt: string;
  expiresAt: string;
};

const globalEnvironments = new Map<string, PreviewEnvironment>();

export class PreviewEnvironmentManager {
  private readonly metadata = new PreviewMetadataGenerator();

  create(config: PreviewGeneratorConfiguration): PreviewEnvironment {
    appendPreviewLog({
      event: "preview_environment_creation",
      level: "info",
      details: "Creating isolated preview environment",
    });

    const envId = this.metadata.buildEnvironmentId();
    const now = Date.now();
    const env: PreviewEnvironment = {
      environmentId: envId,
      status: "ready",
      basePath: `${config.previewBasePath}/${envId}`,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + config.previewRetentionMs).toISOString(),
    };

    globalEnvironments.set(envId, env);
    return env;
  }

  getActiveCount(): number {
    const now = Date.now();
    let count = 0;
    for (const env of globalEnvironments.values()) {
      if (env.status === "ready" || env.status === "active") {
        if (new Date(env.expiresAt).getTime() > now) count += 1;
      }
    }
    return count;
  }

  cleanup(config: PreviewGeneratorConfiguration): number {
    if (!config.previewCleanupEnabled) return 0;

    appendPreviewLog({
      event: "preview_cleanup",
      level: "info",
      details: "Cleaning expired preview environments",
    });

    const now = Date.now();
    let cleaned = 0;
    for (const [id, env] of globalEnvironments) {
      if (new Date(env.expiresAt).getTime() <= now) {
        env.status = "cleaned";
        globalEnvironments.delete(id);
        cleaned += 1;
      }
    }
    return cleaned;
  }

  resetForTesting(): void {
    globalEnvironments.clear();
  }
}

export function resetPreviewEnvironmentsForTesting(): void {
  globalEnvironments.clear();
}
