import type { RegisteredTool } from "../../../brain/types.js";
import { buildConversionPixelScripts } from "../services/pixel-script-builder.js";
import {
  AnalyticsConversionBlockedError,
  computeRoasSnapshot,
  getLatestRoasSnapshot,
  getPixelConfig,
  listConversions,
  listServerEvents,
  recordAdSpend,
  registerPixelConfig,
  trackPurchaseConversion,
  trackPurchaseFromPayment,
  trackServerSideEvent,
} from "../services/analytics-conversion-service.js";

export const analyticsConversionTools: RegisteredTool[] = [
  {
    name: "analytics_conversion.register_pixels",
    description: "Register GA4, Meta Pixel, and TikTok Pixel credentials for server-side events",
    module: "analytics-conversion",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        storeId: { type: "string" },
        ga4MeasurementId: { type: "string" },
        ga4ApiSecret: { type: "string" },
        metaPixelId: { type: "string" },
        metaAccessToken: { type: "string" },
        tiktokPixelId: { type: "string" },
        tiktokAccessToken: { type: "string" },
      },
      required: ["workspaceId", "companyId"],
    },
    handler: async (args) =>
      registerPixelConfig({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        storeId: args.storeId ? String(args.storeId) : undefined,
        ga4MeasurementId: args.ga4MeasurementId ? String(args.ga4MeasurementId) : undefined,
        ga4ApiSecret: args.ga4ApiSecret ? String(args.ga4ApiSecret) : undefined,
        metaPixelId: args.metaPixelId ? String(args.metaPixelId) : undefined,
        metaAccessToken: args.metaAccessToken ? String(args.metaAccessToken) : undefined,
        tiktokPixelId: args.tiktokPixelId ? String(args.tiktokPixelId) : undefined,
        tiktokAccessToken: args.tiktokAccessToken ? String(args.tiktokAccessToken) : undefined,
      }),
  },
  {
    name: "analytics_conversion.track_server_event",
    description: "Dispatch server-side event to GA4, Meta, and TikTok",
    module: "analytics-conversion",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        eventName: { type: "string" },
        correlationId: { type: "string" },
        valueCents: { type: "number" },
        currency: { type: "string" },
        customerEmail: { type: "string" },
      },
      required: ["workspaceId", "companyId", "eventName", "correlationId", "valueCents"],
    },
    handler: async (args) => {
      try {
        return await trackServerSideEvent({
          workspaceId: String(args.workspaceId),
          companyId: String(args.companyId),
          eventName: String(args.eventName) as "purchase",
          correlationId: String(args.correlationId),
          valueCents: Number(args.valueCents),
          currency: args.currency ? String(args.currency) : undefined,
          customerEmail: args.customerEmail ? String(args.customerEmail) : undefined,
        });
      } catch (error) {
        if (error instanceof AnalyticsConversionBlockedError) {
          return { blocked: true, error: error.message };
        }
        throw error;
      }
    },
  },
  {
    name: "analytics_conversion.track_purchase",
    description: "Track real purchase conversion with server-side GA4/Meta/TikTok events",
    module: "analytics-conversion",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        paymentId: { type: "string" },
        correlationId: { type: "string" },
        valueCents: { type: "number" },
        currency: { type: "string" },
        customerEmail: { type: "string" },
        storeId: { type: "string" },
      },
      required: ["workspaceId", "companyId", "correlationId", "valueCents"],
    },
    handler: async (args) =>
      trackPurchaseConversion({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        paymentId: args.paymentId ? String(args.paymentId) : undefined,
        storeId: args.storeId ? String(args.storeId) : undefined,
        correlationId: String(args.correlationId),
        valueCents: Number(args.valueCents),
        currency: args.currency ? String(args.currency) : undefined,
        customerEmail: args.customerEmail ? String(args.customerEmail) : undefined,
      }),
  },
  {
    name: "analytics_conversion.track_payment",
    description: "Track purchase conversion from M103 payment context",
    module: "analytics-conversion",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        paymentId: { type: "string" },
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        amountCents: { type: "number" },
        currency: { type: "string" },
        correlationId: { type: "string" },
        customerEmail: { type: "string" },
        storeId: { type: "string" },
      },
      required: ["paymentId", "workspaceId", "companyId", "amountCents", "correlationId"],
    },
    handler: async (args) =>
      trackPurchaseFromPayment({
        paymentId: String(args.paymentId),
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        amountCents: Number(args.amountCents),
        currency: args.currency ? String(args.currency) : "USD",
        correlationId: String(args.correlationId),
        customerEmail: args.customerEmail ? String(args.customerEmail) : undefined,
        storeId: args.storeId ? String(args.storeId) : undefined,
      }),
  },
  {
    name: "analytics_conversion.record_ad_spend",
    description: "Record ad spend for ROAS calculation",
    module: "analytics-conversion",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        campaignId: { type: "string" },
        amountCents: { type: "number" },
        channel: { type: "string" },
        currency: { type: "string" },
      },
      required: ["workspaceId", "companyId", "campaignId", "amountCents", "channel"],
    },
    handler: async (args) => {
      recordAdSpend({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        campaignId: String(args.campaignId),
        amountCents: Number(args.amountCents),
        channel: String(args.channel) as "META",
        currency: args.currency ? String(args.currency) : undefined,
      });
      return { recorded: true };
    },
  },
  {
    name: "analytics_conversion.compute_roas",
    description: "Compute ROAS from tracked conversions and ad spend",
    module: "analytics-conversion",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        period: { type: "string" },
      },
      required: ["workspaceId", "companyId"],
    },
    handler: async (args) =>
      computeRoasSnapshot({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        period: args.period ? String(args.period) : undefined,
      }),
  },
  {
    name: "analytics_conversion.list_conversions",
    description: "List tracked conversion records",
    module: "analytics-conversion",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) => ({
      conversions: listConversions(
        String(args.workspaceId),
        args.companyId ? String(args.companyId) : undefined,
      ),
    }),
  },
  {
    name: "analytics_conversion.build_pixel_scripts",
    description: "Build client-side GA4, Meta Pixel, and TikTok Pixel scripts",
    module: "analytics-conversion",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        productValue: { type: "number" },
        currency: { type: "string" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) => {
      const config = getPixelConfig(
        String(args.workspaceId),
        args.companyId ? String(args.companyId) : undefined,
      );
      return {
        scripts: buildConversionPixelScripts({
          ga4MeasurementId: config?.ga4MeasurementId,
          metaPixelId: config?.metaPixelId,
          tiktokPixelId: config?.tiktokPixelId,
          productValue: args.productValue ? Number(args.productValue) : undefined,
          currency: args.currency ? String(args.currency) : undefined,
        }),
      };
    },
  },
  {
    name: "analytics_conversion.get_roas",
    description: "Get latest ROAS snapshot",
    module: "analytics-conversion",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["workspaceId", "companyId"],
    },
    handler: async (args) => ({
      snapshot: getLatestRoasSnapshot(String(args.workspaceId), String(args.companyId)),
    }),
  },
  {
    name: "analytics_conversion.list_server_events",
    description: "List dispatched server-side analytics events",
    module: "analytics-conversion",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        limit: { type: "number" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) => ({
      events: listServerEvents(String(args.workspaceId), args.limit ? Number(args.limit) : undefined),
    }),
  },
];
