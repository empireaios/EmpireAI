import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import { financialLedger } from "../../../finance/ledger.js";
import { trackServerSideEvent } from "../../../execution/analytics-conversion-engine/services/analytics-conversion-service.js";
import { importSupplierProducts } from "../../../execution/product-import/scoring/product-import-scoring.js";
import { prepareMetaCampaign } from "../../../execution/meta-ads-connector/services/meta-ads-campaign-service.js";
import {
  prepareCatalogPublish,
  publishCatalogToStorefront,
} from "../../../execution/product-publishing-engine/services/product-publishing-service.js";
import {
  buildStubCatalogForPlatform,
  syncSupplierCatalog,
} from "../../../suppliers/supplier-product-synchronization/index.js";
import { treasuryEngine } from "../../../treasury/treasury-engine.js";
import {
  ingestVerifiedPayment,
  runSandboxFulfillmentCycle,
  startCheckoutPipeline,
} from "../../customer-order-pipeline/services/customer-order-pipeline-service.js";
import {
  completeMockCheckout,
  createLiveCheckout,
} from "../../live-payment-engine/services/live-payment-engine-service.js";
import {
  deployLiveStore,
  readDeployedStorefront,
} from "../../minimum-live-revenue-loop/services/storefront-deploy-service.js";
import type {
  FirstRevenueValidationRecord,
  ValidationStageName,
  ValidationStageResult,
} from "../models/first-revenue-validation-record.js";
import { assessProductionReadiness } from "./production-readiness-assessor.js";

export type ExecuteFirstRevenueValidationInput = {
  workspaceId: string;
  companyId: string;
  correlationId?: string;
  brandId?: string;
};

async function runStage(
  stage: ValidationStageName,
  mode: "MOCK" | "LIVE",
  fn: () => void | Promise<void>,
  buildEvidence: () => Record<string, string | number | boolean> = () => ({}),
): Promise<ValidationStageResult> {
  const started = Date.now();
  try {
    await fn();
    return {
      stage,
      status: "PASS",
      mode,
      message: `${stage} stage passed`,
      evidence: buildEvidence(),
      durationMs: Date.now() - started,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      stage,
      status: "FAIL",
      mode,
      message: `${stage} failed: ${message}`,
      evidence: buildEvidence(),
      durationMs: Date.now() - started,
    };
  }
}

function buildSupplierItems() {
  return syncSupplierCatalog({
    connectorId: "cj-dropshipping",
    platform: "CJ_DROPSHIPPING",
    catalogItems: buildStubCatalogForPlatform("CJ_DROPSHIPPING"),
  }).map((item) => ({
    supplierProduct: item.supplierProduct,
    supplierInventory: item.supplierInventory,
    supplierPricing: item.supplierPricing,
  }));
}

/** Executes the full Product → Profit validation cycle in sandbox mode. */
export async function executeFirstRevenueValidation(
  input: ExecuteFirstRevenueValidationInput,
): Promise<Omit<FirstRevenueValidationRecord, "validationId" | "createdAt">> {
  const correlationId = input.correlationId ?? `frv-${randomUUID()}`;
  const brandId = input.brandId ?? "brand-grand-king";
  const mode: "MOCK" | "LIVE" = "MOCK";
  const slug = `gk-first-revenue-${randomUUID().slice(0, 8)}`;
  const priceCents = 7200;

  let storeId: string | null = null;
  let storeSlug = slug;
  let pipelineId: string | null = null;
  let paymentId: string | null = null;
  let campaignId: string | null = null;
  let publishId: string | null = null;
  let checkoutSessionId = "";
  let importedProductCount = 0;
  let revenueCents = 0;
  let profitCents = 0;
  let ledgerVerified = false;
  let pipelineStatus = "";

  const stages: ValidationStageResult[] = [];

  stages.push(
    await runStage("PRODUCT", mode, () => {
      const imported = importSupplierProducts({
        store: { storeId: randomUUID(), brandId, defaultCollectionHandle: "featured" },
        supplierItems: buildSupplierItems(),
      });
      importedProductCount = imported.importedProducts.filter((p) => p.status === "IMPORTED").length;
      if (importedProductCount === 0) throw new Error("No products imported");
    }, () => ({ importedProductCount })),
  );

  stages.push(
    await runStage("STORE", mode, () => {
      const deployed = deployLiveStore({
        workspaceId: input.workspaceId,
        companyId: input.companyId,
        brandId,
        slug,
        productName: "Grand King First Revenue Product",
        productDescription: "Mission 110 validation product",
        priceCents,
        cjSupplierSku: "CJ-BLENDER-001-BLK",
        cjSupplierProductId: "cj-sandbox-blender-001",
        unitCostCents: 2499,
      });
      storeId = deployed.store.storeId;
      storeSlug = deployed.store.slug;
    }, () => ({ storeId: storeId ?? "", slug: storeSlug })),
  );

  stages.push(
    await runStage("DEPLOY", mode, () => {
      const html = readDeployedStorefront(storeSlug);
      if (!html) throw new Error("Storefront index.html not deployed");

      const imported = importSupplierProducts({
        store: { storeId: storeId!, brandId, defaultCollectionHandle: "featured" },
        supplierItems: buildSupplierItems(),
      });
      const publish = prepareCatalogPublish({
        workspaceId: input.workspaceId,
        companyId: input.companyId,
        storeId: storeId!,
        importedProducts: imported.importedProducts,
        mappedProducts: imported.mappedProducts,
      });
      publishId = publish.publishId;
      const published = publishCatalogToStorefront(publish.publishId);
      if (published.status === "FAILED") throw new Error("Catalog publish failed");
    }, () => ({ publishId: publishId ?? "", storeSlug })),
  );

  stages.push(
    await runStage("ADS", mode, () => {
      const campaign = prepareMetaCampaign({
        workspaceId: input.workspaceId,
        companyId: input.companyId,
        name: "First Revenue Validation Campaign",
        budgetCents: 5000,
        audience: { countries: ["US"], ageMin: 25, ageMax: 54, interests: ["Ecommerce"] },
        creative: {
          headline: "Grand King Launch",
          primaryText: "Shop the first revenue validation offer.",
          imageUrl: "https://cdn.example.com/ad.jpg",
          callToAction: "SHOP_NOW",
          linkUrl: "https://store.example.com",
        },
      });
      campaignId = campaign.campaignId;
    }, () => ({ campaignId: campaignId ?? "" })),
  );

  stages.push(
    await runStage("VISITOR", mode, async () => {
      await trackServerSideEvent({
        workspaceId: input.workspaceId,
        companyId: input.companyId,
        eventName: "page_view",
        correlationId: `${correlationId}:visitor`,
        valueCents: 0,
      });
    }, () => ({ correlationId })),
  );

  stages.push(
    await runStage("CHECKOUT", mode, async () => {
      if (!storeId) throw new Error("Store not created");
      const checkout = await createLiveCheckout({
        workspaceId: input.workspaceId,
        companyId: input.companyId,
        storeId,
        productName: "Grand King First Revenue Product",
        amountCents: priceCents,
      });
      checkoutSessionId = checkout.sessionId;

      const pipeline = startCheckoutPipeline({
        workspaceId: input.workspaceId,
        companyId: input.companyId,
        storeId,
        brandId,
        customerEmail: "validation@grandkings.account",
        customerName: "Validation Customer",
        revenueCents: priceCents,
        correlationId: checkout.sessionId,
      });
      pipelineId = pipeline.pipelineId;
    }, () => ({ sessionId: checkoutSessionId, pipelineId: pipelineId ?? "" })),
  );

  stages.push(
    await runStage("PAYMENT", mode, async () => {
      if (!checkoutSessionId || !storeId) throw new Error("Checkout not started");
      const payment = await completeMockCheckout({
        sessionId: checkoutSessionId,
        workspaceId: input.workspaceId,
        companyId: input.companyId,
        amountCents: priceCents,
        storeId,
      });
      paymentId = payment.paymentId;
      revenueCents = payment.amountCents;
    }, () => ({ paymentId: paymentId ?? "", amountCents: revenueCents })),
  );

  stages.push(
    await runStage("ORDER", mode, async () => {
      if (!paymentId) throw new Error("Payment missing");
      const pipeline = await ingestVerifiedPayment(paymentId);
      pipelineId = pipeline.pipelineId;
      pipelineStatus = pipeline.status;
      if (
        pipeline.status !== "INVENTORY_RESERVED" &&
        pipeline.status !== "PAYMENT_VERIFIED" &&
        pipeline.status !== "AWAITING_FULFILLMENT_APPROVAL"
      ) {
        throw new Error(`Unexpected pipeline status: ${pipeline.status}`);
      }
    }, () => ({ pipelineId: pipelineId ?? "", status: pipelineStatus })),
  );

  stages.push(
    await runStage("FULFILLMENT", mode, async () => {
      if (!pipelineId) throw new Error("Pipeline missing");
      const pipeline = await runSandboxFulfillmentCycle({
        pipelineId,
        approvalToken: "founder-approve-m110",
        approvedBy: "founder@empireai.com",
      });
      pipelineStatus = pipeline.status;
      if (pipeline.status !== "DELIVERED" && pipeline.status !== "IN_TRANSIT") {
        throw new Error(`Fulfillment incomplete: ${pipeline.status}`);
      }
    }, () => ({ pipelineId: pipelineId ?? "", status: pipelineStatus })),
  );

  stages.push(
    await runStage("TRACKING", mode, () => {
      if (!pipelineId) throw new Error("Pipeline missing");
      const db = getDatabase();
      const row = db
        .prepare(`SELECT tracking_number FROM customer_order_pipelines WHERE pipeline_id = @id`)
        .get({ id: pipelineId }) as { tracking_number: string | null } | undefined;
      if (!row?.tracking_number) throw new Error("Tracking number not synced");
    }, () => ({ pipelineId: pipelineId ?? "" })),
  );

  stages.push(
    await runStage("LEDGER", mode, () => {
      if (!paymentId) throw new Error("Payment missing");
      const db = getDatabase();
      const payment = db
        .prepare(`SELECT stripe_session_id FROM live_payments WHERE payment_id = @id`)
        .get({ id: paymentId }) as { stripe_session_id: string | null } | undefined;
      const cid = payment?.stripe_session_id ?? paymentId;
      const sale = db
        .prepare(
          `SELECT 1 FROM financial_ledger_events
           WHERE correlation_id = @cid AND event_type = 'sale' LIMIT 1`,
        )
        .get({ cid });
      if (!sale) throw new Error("Ledger sale event not recorded");
      ledgerVerified = true;
    }, () => ({ ledgerVerified })),
  );

  stages.push(
    await runStage("PROFIT", mode, () => {
      const report = financialLedger.generateReport(input.workspaceId);
      profitCents = report.netProfitCents;
      if (revenueCents <= 0) throw new Error("No revenue recorded");
      treasuryEngine.compute(input.workspaceId);
    }, () => ({ revenueCents, profitCents })),
  );

  const readiness = assessProductionReadiness();
  const allStagesPassed = stages.every((stage) => stage.status === "PASS");

  return {
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    correlationId,
    mode,
    stages,
    allStagesPassed,
    productionReady: readiness.productionReady,
    productionBlockers: readiness.blockers,
    revenueCents,
    profitCents,
    ledgerVerified,
    storeId,
    pipelineId,
    paymentId,
    campaignId,
    mock: true,
  };
}
