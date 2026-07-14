/** T3-05 — Manages isolated preview routes. */

import type { PreviewGeneratorConfiguration } from "./configuration.js";
import type { PreviewEnvironment } from "./preview-environment-manager.js";
import { appendPreviewLog } from "./preview-logging.js";

export class PreviewRouteManager {
  buildRoute(
    env: PreviewEnvironment,
    screenId: string,
    config: PreviewGeneratorConfiguration,
  ): { previewUrl: string; localReference: string } {
    appendPreviewLog({
      event: "preview_route_creation",
      level: "info",
      details: `Creating preview route for ${screenId}`,
    });

    const slug = screenId.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
    const route = `${config.previewRoutePrefix}/${env.environmentId}/${slug}`;
    const previewUrl = `${route}`;
    const localReference = `${env.basePath}/index.html`;

    return { previewUrl, localReference };
  }
}
