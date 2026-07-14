/** T3-05 — Assembles preview build artifacts. */

import type { PreviewSourceBundle } from "./preview-source-collector.js";
import type { PreviewEnvironment } from "./preview-environment-manager.js";
import type { PreviewScope } from "./types.js";
import { appendPreviewLog } from "./preview-logging.js";

export class PreviewAssemblyEngine {
  assemble(input: {
    bundle: PreviewSourceBundle;
    env: PreviewEnvironment;
    scope: PreviewScope;
    responsiveStates: string[];
    previewUrl: string;
  }): { previewFiles: string[]; manifest: string } {
    appendPreviewLog({
      event: "preview_build_creation",
      level: "info",
      details: `Assembling preview for ${input.scope}`,
    });

    const previewFiles = [
      `${input.env.basePath}/manifest.json`,
      `${input.env.basePath}/preview-bundle.json`,
      ...input.bundle.previewFiles.map((f) => `${input.env.basePath}/sources/${f.split("/").pop()}`),
    ];

    const manifest = JSON.stringify(
      {
        previewBuildId: input.env.environmentId,
        scope: input.scope,
        screenId: input.bundle.screenId,
        previewUrl: input.previewUrl,
        responsiveStates: input.responsiveStates,
        sources: {
          frontendBuildIds: input.bundle.frontendBuildIds,
          componentGenerationIds: input.bundle.componentGenerationIds,
          layoutRefactoringIds: input.bundle.layoutRefactoringIds,
          themeIds: input.bundle.themeIds,
        },
        isolated: true,
        productionSafe: true,
      },
      null,
      2,
    );

    return { previewFiles, manifest };
  }
}
