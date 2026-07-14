import type { RegisteredTool } from "../../../brain/types.js";
import {
  createDesign,
  createVisualAsset,
  duplicateDesign,
  exportVisualDesign,
  generateBrandedTemplate,
  generateCommerceCreative,
  generateExecutivePresentationAsset,
  generateMarketingCreative,
  getVisualGenerationHealth,
  searchDesigns,
  uploadVisualAsset,
} from "../services/visual-generation-service.js";

/** Provider-neutral visual production tools — all business engines must use these. */
export const visualGenerationTools: RegisteredTool[] = [
  {
    name: "visual_generation.create_visual_asset",
    description: "Create a visual asset through the EmpireAI Visual Generation Layer (default: Canva)",
    module: "visual-generation-layer",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        useCase: { type: "string" },
        title: { type: "string" },
        prompt: { type: "string" },
        format: { type: "string", enum: ["png", "jpg", "pdf", "mp4"] },
      },
      required: ["workspaceId", "companyId"],
    },
    handler: async (args) =>
      createVisualAsset({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        useCase: (args.useCase as "general") ?? "general",
        title: args.title ? String(args.title) : undefined,
        prompt: args.prompt ? String(args.prompt) : undefined,
        format: args.format as "png" | "jpg" | "pdf" | "mp4" | undefined,
      }),
  },
  {
    name: "visual_generation.create_design",
    description: "Create a Canva design via the Visual Generation Layer",
    module: "visual-generation-layer",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        title: { type: "string" },
        useCase: { type: "string" },
      },
      required: ["workspaceId", "companyId"],
    },
    handler: async (args) =>
      createDesign({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        title: args.title ? String(args.title) : undefined,
        useCase: (args.useCase as "general") ?? "general",
      }),
  },
  {
    name: "visual_generation.search_designs",
    description: "Search designs through the Visual Generation Layer",
    module: "visual-generation-layer",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        query: { type: "string" },
      },
      required: ["workspaceId", "companyId", "query"],
    },
    handler: async (args) =>
      searchDesigns({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        query: String(args.query),
        useCase: "general",
      }),
  },
  {
    name: "visual_generation.duplicate_design",
    description: "Duplicate an existing design through the Visual Generation Layer",
    module: "visual-generation-layer",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        designId: { type: "string" },
      },
      required: ["workspaceId", "companyId", "designId"],
    },
    handler: async (args) =>
      duplicateDesign({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        designId: String(args.designId),
        useCase: "general",
      }),
  },
  {
    name: "visual_generation.upload_asset",
    description: "Upload an image or video asset through the Visual Generation Layer",
    module: "visual-generation-layer",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        asset: { type: "object" },
      },
      required: ["workspaceId", "companyId", "asset"],
    },
    handler: async (args) =>
      uploadVisualAsset({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        useCase: "general",
        asset: args.asset as { name: string; mimeType: string; base64Data: string },
      }),
  },
  {
    name: "visual_generation.export",
    description: "Export a design as PNG, JPG, PDF, or video through the Visual Generation Layer",
    module: "visual-generation-layer",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        designId: { type: "string" },
        format: { type: "string", enum: ["png", "jpg", "pdf", "mp4"] },
      },
      required: ["workspaceId", "companyId", "designId"],
    },
    handler: async (args) =>
      exportVisualDesign({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        designId: String(args.designId),
        format: args.format as "png" | "jpg" | "pdf" | "mp4" | undefined,
        useCase: "general",
      }),
  },
  {
    name: "visual_generation.generate_commerce_creative",
    description: "Generate commerce product or listing visuals via Visual Generation Layer",
    module: "visual-generation-layer",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        title: { type: "string" },
        prompt: { type: "string" },
      },
      required: ["workspaceId", "companyId"],
    },
    handler: async (args) =>
      generateCommerceCreative({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        title: args.title ? String(args.title) : undefined,
        prompt: args.prompt ? String(args.prompt) : undefined,
      }),
  },
  {
    name: "visual_generation.generate_marketing_creative",
    description: "Generate marketing or advertising creatives via Visual Generation Layer",
    module: "visual-generation-layer",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        title: { type: "string" },
        prompt: { type: "string" },
      },
      required: ["workspaceId", "companyId"],
    },
    handler: async (args) =>
      generateMarketingCreative({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        title: args.title ? String(args.title) : undefined,
        prompt: args.prompt ? String(args.prompt) : undefined,
      }),
  },
  {
    name: "visual_generation.generate_executive_presentation",
    description: "Generate executive presentation assets via Visual Generation Layer",
    module: "visual-generation-layer",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        title: { type: "string" },
      },
      required: ["workspaceId", "companyId"],
    },
    handler: async (args) =>
      generateExecutivePresentationAsset({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        title: args.title ? String(args.title) : undefined,
      }),
  },
  {
    name: "visual_generation.generate_branded_template",
    description: "Generate reusable branded templates via Visual Generation Layer",
    module: "visual-generation-layer",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        title: { type: "string" },
      },
      required: ["workspaceId", "companyId"],
    },
    handler: async (args) =>
      generateBrandedTemplate({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        title: args.title ? String(args.title) : undefined,
      }),
  },
  {
    name: "visual_generation.get_health",
    description: "Get Visual Generation Layer health and provider status",
    module: "visual-generation-layer",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["workspaceId", "companyId"],
    },
    handler: async (args) =>
      getVisualGenerationHealth(String(args.workspaceId), String(args.companyId)),
  },
];
