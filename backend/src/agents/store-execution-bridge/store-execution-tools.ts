import type { RegisteredTool } from "../../brain/types.js";
import { runManufacturingPipeline } from "./pipeline.js";
import { storeExecutionSessionStore } from "./session-store.js";
import type { StoreExecutionSession } from "./types.js";
import {
  toArtifactListView,
  toBrandView,
  toGeneratedCodeView,
  toLandingPageView,
  toManufacturingPipelineView,
  toMaterializedProjectView,
  toOfferView,
  toPortfolioView,
  toStoreBlueprintView,
  toStorefrontView,
  toStorePagesView,
} from "./ui-shapes.js";
import { DEFAULT_M058_IDS, type DeterministicIdSet } from "./mock-inputs.js";

function resolveSession(
  workspaceId: string,
  companyId?: string,
): StoreExecutionSession {
  const session = storeExecutionSessionStore.get(workspaceId, companyId);
  if (!session) {
    throw new Error(
      "No manufacturing pipeline session found. Run store.run_manufacturing_pipeline first.",
    );
  }
  return session;
}

const sessionParams = {
  type: "object",
  properties: {
    workspaceId: { type: "string" },
    companyId: { type: "string" },
  },
  required: ["workspaceId"],
} as const;

export const storeExecutionTools: RegisteredTool[] = [
  {
    name: "store.run_manufacturing_pipeline",
    description:
      "Run the M046–M056 store manufacturing pipeline and persist results in memory for this workspace",
    module: "store",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        useDeterministicMocks: { type: "boolean" },
      },
      required: ["workspaceId"],
    },
    handler: async (args, context) => {
      const workspaceId = String(args.workspaceId ?? context.workspaceId);
      const companyId =
        args.companyId !== undefined ? String(args.companyId) : context.companyId;

      const deterministicIds: DeterministicIdSet | undefined =
        args.useDeterministicMocks === true ? DEFAULT_M058_IDS : undefined;

      const session = await runManufacturingPipeline(workspaceId, {
        companyId,
        deterministicIds,
      });
      storeExecutionSessionStore.save(session);
      return toManufacturingPipelineView(session);
    },
  },
  {
    name: "store.get_brand",
    description: "Get UI-shaped brand data from the latest manufacturing pipeline run",
    module: "store",
    authorityLevel: "L0",
    parameters: sessionParams,
    handler: async (args, context) => {
      const session = resolveSession(
        String(args.workspaceId ?? context.workspaceId),
        args.companyId !== undefined ? String(args.companyId) : context.companyId,
      );
      return toBrandView(session);
    },
  },
  {
    name: "store.get_product_portfolio",
    description: "Get UI-shaped product portfolio from the latest manufacturing pipeline run",
    module: "store",
    authorityLevel: "L0",
    parameters: sessionParams,
    handler: async (args, context) => {
      const session = resolveSession(
        String(args.workspaceId ?? context.workspaceId),
        args.companyId !== undefined ? String(args.companyId) : context.companyId,
      );
      return toPortfolioView(session);
    },
  },
  {
    name: "store.get_offer",
    description: "Get UI-shaped product offer from the latest manufacturing pipeline run",
    module: "store",
    authorityLevel: "L0",
    parameters: sessionParams,
    handler: async (args, context) => {
      const session = resolveSession(
        String(args.workspaceId ?? context.workspaceId),
        args.companyId !== undefined ? String(args.companyId) : context.companyId,
      );
      return toOfferView(session);
    },
  },
  {
    name: "store.get_landing_page",
    description: "Get UI-shaped landing page blueprint and content from the pipeline run",
    module: "store",
    authorityLevel: "L0",
    parameters: sessionParams,
    handler: async (args, context) => {
      const session = resolveSession(
        String(args.workspaceId ?? context.workspaceId),
        args.companyId !== undefined ? String(args.companyId) : context.companyId,
      );
      return toLandingPageView(session);
    },
  },
  {
    name: "store.get_store_blueprint",
    description: "Get UI-shaped store blueprint from the latest manufacturing pipeline run",
    module: "store",
    authorityLevel: "L0",
    parameters: sessionParams,
    handler: async (args, context) => {
      const session = resolveSession(
        String(args.workspaceId ?? context.workspaceId),
        args.companyId !== undefined ? String(args.companyId) : context.companyId,
      );
      return toStoreBlueprintView(session);
    },
  },
  {
    name: "store.get_store_pages",
    description: "Get UI-shaped renderable store pages from the latest manufacturing pipeline run",
    module: "store",
    authorityLevel: "L0",
    parameters: sessionParams,
    handler: async (args, context) => {
      const session = resolveSession(
        String(args.workspaceId ?? context.workspaceId),
        args.companyId !== undefined ? String(args.companyId) : context.companyId,
      );
      return toStorePagesView(session);
    },
  },
  {
    name: "store.get_storefront",
    description: "Get UI-shaped assembled storefront from the latest manufacturing pipeline run",
    module: "store",
    authorityLevel: "L0",
    parameters: sessionParams,
    handler: async (args, context) => {
      const session = resolveSession(
        String(args.workspaceId ?? context.workspaceId),
        args.companyId !== undefined ? String(args.companyId) : context.companyId,
      );
      return toStorefrontView(session);
    },
  },
  {
    name: "store.get_generated_code",
    description: "Get UI-shaped generated storefront code from the latest manufacturing pipeline run",
    module: "store",
    authorityLevel: "L0",
    parameters: sessionParams,
    handler: async (args, context) => {
      const session = resolveSession(
        String(args.workspaceId ?? context.workspaceId),
        args.companyId !== undefined ? String(args.companyId) : context.companyId,
      );
      return toGeneratedCodeView(session);
    },
  },
  {
    name: "store.list_artifacts",
    description: "List generated storefront artifacts from the latest manufacturing pipeline run",
    module: "store",
    authorityLevel: "L0",
    parameters: sessionParams,
    handler: async (args, context) => {
      const session = resolveSession(
        String(args.workspaceId ?? context.workspaceId),
        args.companyId !== undefined ? String(args.companyId) : context.companyId,
      );
      return toArtifactListView(session);
    },
  },
  {
    name: "store.get_materialized_project",
    description: "Get UI-shaped materialized project from the latest manufacturing pipeline run",
    module: "store",
    authorityLevel: "L0",
    parameters: sessionParams,
    handler: async (args, context) => {
      const session = resolveSession(
        String(args.workspaceId ?? context.workspaceId),
        args.companyId !== undefined ? String(args.companyId) : context.companyId,
      );
      return toMaterializedProjectView(session);
    },
  },
];
