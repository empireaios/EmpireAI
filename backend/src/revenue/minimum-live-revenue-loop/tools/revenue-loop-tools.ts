import type { RegisteredTool } from "../../../brain/types.js";
import { loadRevenueLoopEnv } from "../config/revenue-loop-env.js";
import { getRevenueLoopRepository } from "../repositories/sqlite-revenue-loop-repository.js";
import {
  applyFulfillmentApproval,
  LiveFulfillmentBlockedError,
  submitLiveFulfillment,
} from "../services/revenue-loop-service.js";
import { createCheckoutSession } from "../services/stripe-client.js";
import { deployLiveStore } from "../services/storefront-deploy-service.js";

export const revenueLoopTools: RegisteredTool[] = [
  {
    name: "revenue_loop.deploy_store",
    description: "Deploy a minimum live storefront with analytics and checkout — founder gate",
    module: "revenue-loop",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        brandId: { type: "string" },
        slug: { type: "string" },
        productName: { type: "string" },
        productDescription: { type: "string" },
        priceCents: { type: "number" },
        cjSupplierSku: { type: "string" },
        cjSupplierProductId: { type: "string" },
        unitCostCents: { type: "number" },
      },
      required: [
        "workspaceId",
        "companyId",
        "brandId",
        "slug",
        "productName",
        "productDescription",
        "priceCents",
        "cjSupplierSku",
        "cjSupplierProductId",
        "unitCostCents",
      ],
    },
    handler: async (args) => {
      return deployLiveStore({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        brandId: String(args.brandId),
        slug: String(args.slug),
        productName: String(args.productName),
        productDescription: String(args.productDescription),
        priceCents: Number(args.priceCents),
        cjSupplierSku: String(args.cjSupplierSku),
        cjSupplierProductId: String(args.cjSupplierProductId),
        unitCostCents: Number(args.unitCostCents),
      });
    },
  },
  {
    name: "revenue_loop.create_checkout",
    description: "Create Stripe checkout session for a deployed live store",
    module: "revenue-loop",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        storeSlug: { type: "string" },
        customerEmail: { type: "string" },
      },
      required: ["storeSlug"],
    },
    handler: async (args) => {
      const store = getRevenueLoopRepository().getStoreBySlug(String(args.storeSlug));
      if (!store) throw new Error("Store not found");
      const config = loadRevenueLoopEnv();
      return createCheckoutSession({
        storeSlug: store.slug,
        storeId: store.storeId,
        workspaceId: store.workspaceId,
        companyId: store.companyId,
        productName: store.productName,
        priceCents: store.priceCents,
        currency: store.currency,
        successUrl: `${config.REVENUE_LOOP_STORE_BASE_URL}/store/${store.slug}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${config.REVENUE_LOOP_STORE_BASE_URL}/store/${store.slug}`,
        customerEmail: args.customerEmail ? String(args.customerEmail) : undefined,
      });
    },
  },
  {
    name: "revenue_loop.list_orders",
    description: "List revenue loop customer orders for workspace",
    module: "revenue-loop",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        storeId: { type: "string" },
      },
      required: ["workspaceId"],
    },
    handler: async (args, context) => {
      const workspaceId = String(args.workspaceId ?? context.workspaceId);
      return {
        orders: getRevenueLoopRepository().listOrders(
          workspaceId,
          args.storeId ? String(args.storeId) : undefined,
        ),
      };
    },
  },
  {
    name: "revenue_loop.apply_fulfillment_approval",
    description: "Apply founder approval gate before LIVE CJ fulfillment — Protect The Empire",
    module: "revenue-loop",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        recordId: { type: "string" },
        approvalToken: { type: "string" },
        approvedBy: { type: "string" },
        approvedAt: { type: "string" },
      },
      required: ["recordId", "approvalToken", "approvedBy", "approvedAt"],
    },
    handler: async (args) => {
      return applyFulfillmentApproval({
        recordId: String(args.recordId),
        approvalToken: String(args.approvalToken),
        approvedBy: String(args.approvedBy),
        approvedAt: String(args.approvedAt),
      });
    },
  },
  {
    name: "revenue_loop.submit_live_fulfillment",
    description: "Submit approved customer order to CJ LIVE — requires REVENUE_LOOP_LIVE_FULFILLMENT_ENABLED",
    module: "revenue-loop",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        recordId: { type: "string" },
      },
      required: ["recordId"],
    },
    handler: async (args) => {
      try {
        return await submitLiveFulfillment(String(args.recordId));
      } catch (error) {
        if (error instanceof LiveFulfillmentBlockedError) {
          return {
            blocked: true,
            protectTheEmpire: true,
            message: error.message,
            liveFulfillmentEnabled: loadRevenueLoopEnv().REVENUE_LOOP_LIVE_FULFILLMENT_ENABLED,
          };
        }
        throw error;
      }
    },
  },
];
