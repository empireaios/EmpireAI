import { loadLiveCjFulfillmentEnv, isLiveCjFulfillmentAllowed } from "../../../execution/live-cj-fulfillment/config/live-cj-fulfillment-env.js";
import { loadMetaAdsEnv, isMetaAdsLaunchAllowed, isMetaAdsLiveConfigured } from "../../../execution/meta-ads-connector/config/meta-ads-env.js";
import {
  isLiveSupplierSyncAllowed,
  loadProductPublishingEnv,
} from "../../../execution/product-publishing-engine/config/product-publishing-env.js";
import {
  isVercelLiveConfigured,
  loadProductionDeploymentEnv,
} from "../../../execution/production-store-deployment/config/production-deployment-env.js";
import { hasCjCredentials, loadCjConfig } from "../../../suppliers/cj-dropshipping/cj-config.js";
import { loadCustomerOrderPipelineEnv } from "../../customer-order-pipeline/config/customer-order-pipeline-env.js";
import {
  isStripeLiveConfigured,
  loadLivePaymentEnv,
} from "../../live-payment-engine/config/live-payment-env.js";
import { loadRevenueLoopEnv } from "../../minimum-live-revenue-loop/config/revenue-loop-env.js";

export type ProductionReadinessAssessment = {
  productionReady: boolean;
  blockers: string[];
  warnings: string[];
  gates: Record<string, boolean>;
};

/** Assesses whether Grand King's Account is ready for live production revenue. */
export function assessProductionReadiness(
  env: NodeJS.ProcessEnv = process.env,
): ProductionReadinessAssessment {
  const livePayment = loadLivePaymentEnv(env);
  const revenueLoop = loadRevenueLoopEnv(env);
  const productionDeploy = loadProductionDeploymentEnv(env);
  const metaAds = loadMetaAdsEnv(env);
  const cjConfig = loadCjConfig(env);
  const orderPipeline = loadCustomerOrderPipelineEnv(env);
  const cjFulfillment = loadLiveCjFulfillmentEnv(env);
  const productPublishing = loadProductPublishingEnv(env);

  const gates = {
    stripeConfigured: isStripeLiveConfigured(livePayment),
    livePaymentsEnabled: livePayment.LIVE_PAYMENT_ENABLED,
    stripeWebhookConfigured: Boolean(livePayment.STRIPE_WEBHOOK_SECRET),
    productionDomainConfigured: Boolean(revenueLoop.REVENUE_LOOP_STORE_BASE_URL &&
      !revenueLoop.REVENUE_LOOP_STORE_BASE_URL.includes("localhost")),
    vercelDeployEnabled: isVercelLiveConfigured(productionDeploy),
    metaAdsConfigured: isMetaAdsLiveConfigured(metaAds),
    metaAdsLaunchEnabled: isMetaAdsLaunchAllowed(metaAds),
    cjCredentialsConfigured: hasCjCredentials(cjConfig),
    liveCjFulfillmentEnabled: isLiveCjFulfillmentAllowed(cjFulfillment),
    liveOrderFulfillmentEnabled: orderPipeline.CUSTOMER_ORDER_PIPELINE_LIVE_FULFILLMENT_ENABLED,
    liveSupplierSyncEnabled: isLiveSupplierSyncAllowed(productPublishing),
  };

  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!gates.stripeConfigured) {
    blockers.push("STRIPE_SECRET_KEY not configured — real payments blocked");
  }
  if (!gates.livePaymentsEnabled) {
    blockers.push("LIVE_PAYMENT_ENABLED=false — Stripe charges are gated (Protect The Empire)");
  }
  if (!gates.stripeWebhookConfigured) {
    blockers.push("STRIPE_WEBHOOK_SECRET missing — production checkout webhooks will fail");
  }
  if (!gates.productionDomainConfigured) {
    blockers.push("REVENUE_LOOP_STORE_BASE_URL still localhost — no production storefront domain");
  }
  if (!gates.vercelDeployEnabled) {
    blockers.push("Production Vercel deployment not enabled — storefront not on production hosting");
  }
  if (!gates.metaAdsConfigured) {
    blockers.push("Meta Ads credentials not configured — paid traffic cannot launch live");
  }
  if (!gates.metaAdsLaunchEnabled) {
    blockers.push("META_ADS_LAUNCH_ENABLED=false — ad campaigns cannot go live (Protect The Empire)");
  }
  if (!gates.cjCredentialsConfigured) {
    blockers.push("CJ_API_KEY missing — supplier fulfillment unavailable");
  }
  if (!gates.liveCjFulfillmentEnabled) {
    blockers.push("LIVE_CJ_FULFILLMENT_ENABLED=false — CJ orders will not submit live");
  }
  if (!gates.liveOrderFulfillmentEnabled) {
    blockers.push("CUSTOMER_ORDER_PIPELINE_LIVE_FULFILLMENT_ENABLED=false — order fulfillment gated");
  }
  if (!gates.liveSupplierSyncEnabled) {
    warnings.push("PRODUCT_PUBLISHING_LIVE_SUPPLIER_SYNC=false — inventory/price sync uses sandbox");
  }
  if (metaAds.META_ADS_MOCK) {
    warnings.push("META_ADS_MOCK active — advertising API calls are simulated");
  }
  if (livePayment.LIVE_PAYMENT_MOCK) {
    warnings.push("LIVE_PAYMENT_MOCK active — payment flow uses mock Stripe");
  }

  return {
    productionReady: blockers.length === 0,
    blockers,
    warnings,
    gates,
  };
}
