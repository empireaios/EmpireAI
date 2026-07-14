export {
  VISUAL_GENERATION_PROVIDERS,
  VISUAL_GENERATION_USE_CASES,
  VISUAL_EXPORT_FORMATS,
  visualGenerationRequestSchema,
} from "./models/visual-generation-types.js";
export type {
  VisualGenerationProviderId,
  VisualGenerationUseCase,
  VisualExportFormat,
  VisualGenerationRequest,
  VisualGenerationResult,
  VisualGenerationHealth,
} from "./models/visual-generation-types.js";

export {
  DEFAULT_VISUAL_PROVIDER,
  getVisualProvider,
  listVisualProviders,
  CanvaVisualProvider,
} from "./providers/canva-visual-provider.js";
export type { VisualProviderAdapter } from "./providers/canva-visual-provider.js";

export {
  VisualGenerationError,
  createVisualAsset,
  createDesign,
  searchDesigns,
  duplicateDesign,
  uploadVisualAsset,
  exportVisualDesign,
  generateCommerceCreative,
  generateMarketingCreative,
  generateExecutivePresentationAsset,
  generateBrandedTemplate,
  getVisualGenerationHealth,
  createVisualGenerationJobId,
} from "./services/visual-generation-service.js";

export { registerVisualGenerationRoutes } from "./routes/visual-generation-routes.js";
export { visualGenerationTools } from "./tools/visual-generation-tools.js";

export {
  VISUAL_GENERATION_LAYER_ID,
  VISUAL_GENERATION_CAPABILITIES,
  createVisualGenerationModuleContract,
} from "./contract/visual-generation-module.js";
export type {
  VisualGenerationCapability,
  VisualGenerationModuleContract,
} from "./contract/visual-generation-module.js";
