export const BUSINESS_PREVIEW_STUDIO_MODULE_ID = "business-preview-studio" as const;

export type BusinessPreviewStudioCapability =
  | "business-preview-studio.read"
  | "business-preview-studio.generate"
  | "business-preview-studio.approve";

export const BUSINESS_PREVIEW_STUDIO_CAPABILITIES: BusinessPreviewStudioCapability[] = [
  "business-preview-studio.read",
  "business-preview-studio.generate",
  "business-preview-studio.approve",
];

export function createBusinessPreviewStudioModuleContract() {
  return {
    moduleId: BUSINESS_PREVIEW_STUDIO_MODULE_ID,
    capabilities: BUSINESS_PREVIEW_STUDIO_CAPABILITIES,
    missionId: "LIVE-007" as const,
    integratesWith: [
      "business-opportunity-workspace",
      "brand-genesis",
    ],
    protection: {
      noPublishing: true,
      noSupplierExecution: true,
      noOrderExecution: true,
      noAdvertisements: true,
      noMarketplaceModifications: true,
      previewOnly: true,
    },
  };
}
