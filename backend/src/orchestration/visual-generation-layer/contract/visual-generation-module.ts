export const VISUAL_GENERATION_LAYER_ID = "visual-generation-layer" as const;

export const VISUAL_GENERATION_CAPABILITIES = [
  "create_visual_asset",
  "create_design",
  "search_designs",
  "duplicate_design",
  "upload_asset",
  "export_design",
  "generate_commerce_creative",
  "generate_marketing_creative",
  "generate_executive_presentation",
  "generate_branded_template",
] as const;

export type VisualGenerationCapability = (typeof VISUAL_GENERATION_CAPABILITIES)[number];

export type VisualGenerationModuleContract = {
  moduleId: typeof VISUAL_GENERATION_LAYER_ID;
  defaultProvider: "canva";
  providerNeutral: true;
  capabilities: VisualGenerationCapability[];
};

export function createVisualGenerationModuleContract(): VisualGenerationModuleContract {
  return {
    moduleId: VISUAL_GENERATION_LAYER_ID,
    defaultProvider: "canva",
    providerNeutral: true,
    capabilities: [...VISUAL_GENERATION_CAPABILITIES],
  };
}
