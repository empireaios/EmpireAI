/** X1-07 — Storefront Generation Engine (structural signals only). */

import type { DeploymentReadiness, StorefrontStatus } from "./types.js";

export class StorefrontGenerationEngine {
  deriveStatus(input: {
    hasWebsite: boolean;
    hasNavigation: boolean;
    hasCatalogue: boolean;
    hasDeploymentPackage: boolean;
  }): StorefrontStatus {
    if (input.hasDeploymentPackage && input.hasCatalogue && input.hasWebsite) return "ready";
    if (input.hasDeploymentPackage) return "package_prepared";
    if (input.hasCatalogue) return "catalogue_ready";
    if (input.hasWebsite && input.hasNavigation) return "structured";
    return "draft";
  }

  deriveDeploymentReadiness(status: StorefrontStatus, validated: boolean): DeploymentReadiness {
    if (!validated) return "blocked";
    if (status === "ready" || status === "package_prepared") return "ready_for_validation";
    if (status === "catalogue_ready" || status === "structured") return "partial";
    return "not_ready";
  }

  companyReference(companyName: string, businessModelId?: string): string {
    if (businessModelId?.trim()) return businessModelId.trim();
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `structural://company/${slug || "store"}`;
  }
}
