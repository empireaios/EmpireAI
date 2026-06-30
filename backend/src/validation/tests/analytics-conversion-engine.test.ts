import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { analyticsConversionTools } from "../../execution/analytics-conversion-engine/tools/analytics-conversion-tools.js";
import {
  buildConversionPixelScripts,
  computeRoasSnapshot,
  dispatchServerSideEvent,
  registerPixelConfig,
  trackPurchaseConversion,
  trackServerSideEvent,
} from "../../execution/analytics-conversion-engine/index.js";
import type { ToolContext } from "../../brain/types.js";

const WORKSPACE_ID = "ws-m106";
const COMPANY_ID = "co-grand-king";
const ORIGINAL_ENV = { ...process.env };

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "analytics-conversion",
    correlationId: "corr-m106",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = analyticsConversionTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

beforeEach(() => {
  process.env.ANALYTICS_CONVERSION_ENABLED = "true";
  process.env.ANALYTICS_SERVER_SIDE_MOCK = "true";
  delete process.env.GA4_MEASUREMENT_ID;
  delete process.env.GA4_API_SECRET;
  delete process.env.META_PIXEL_ID;
  delete process.env.META_CONVERSIONS_ACCESS_TOKEN;
  delete process.env.TIKTOK_PIXEL_ID;
  delete process.env.TIKTOK_ACCESS_TOKEN;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("Mission 106 Analytics & Conversion Engine", () => {
  it("registers ten analytics conversion Brain tools", () => {
    assert.equal(analyticsConversionTools.length, 10);
    assert.ok(analyticsConversionTools.some((tool) => tool.name === "analytics_conversion.track_purchase"));
  });

  it("registers pixel config for GA4, Meta, and TikTok", () => {
    const config = registerPixelConfig({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      ga4MeasurementId: "G-M106TEST",
      metaPixelId: "1234567890",
      tiktokPixelId: "TIKTOK-M106",
    });

    assert.equal(config.ga4MeasurementId, "G-M106TEST");
    assert.equal(config.metaPixelId, "1234567890");
    assert.equal(config.tiktokPixelId, "TIKTOK-M106");
    assert.equal(config.enabled, true);
  });

  it("builds client pixel scripts for GA4, Meta, and TikTok", () => {
    const scripts = buildConversionPixelScripts({
      ga4MeasurementId: "G-TEST123",
      metaPixelId: "9876543210",
      tiktokPixelId: "TT-PIXEL-001",
      productValue: 49.99,
      currency: "USD",
    });

    assert.match(scripts, /gtag/);
    assert.match(scripts, /fbq/);
    assert.match(scripts, /ttq/);
    assert.match(scripts, /empireTrackPurchase/);
    assert.match(scripts, /empireTrackCheckout/);
  });

  it("dispatches server-side events to all three platforms in mock mode", async () => {
    registerPixelConfig({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      ga4MeasurementId: "G-M106",
      metaPixelId: "META-M106",
      tiktokPixelId: "TIKTOK-M106",
    });

    const dispatch = await dispatchServerSideEvent(null, {
      eventName: "begin_checkout",
      correlationId: "evt-m106-checkout",
      valueCents: 4999,
      currency: "USD",
    });

    assert.equal(dispatch.mock, true);
    assert.equal(dispatch.results.GA4, "mock");
    assert.equal(dispatch.results.META, "mock");
    assert.equal(dispatch.results.TIKTOK, "mock");
  });

  it("tracks purchase conversion with deduplicated server event", async () => {
    const correlationId = `purchase-m106-${Date.now()}`;

    const first = await trackPurchaseConversion({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      correlationId,
      valueCents: 9900,
      currency: "USD",
      customerEmail: "buyer@grandkings.account",
      paymentId: "pay-m106",
    });

    assert.equal(first.conversion.eventName, "purchase");
    assert.equal(first.conversion.valueCents, 9900);
    assert.deepEqual(first.serverEvent.platforms, ["GA4", "META", "TIKTOK"]);
    assert.equal(first.serverEvent.mock, true);

    const second = await trackPurchaseConversion({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      correlationId,
      valueCents: 9900,
    });

    assert.equal(second.conversion.conversionId, first.conversion.conversionId);
  });

  it("computes ROAS from conversions and ad spend", async () => {
    await trackPurchaseConversion({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      correlationId: `roas-purchase-a-${Date.now()}`,
      valueCents: 10000,
    });
    await trackPurchaseConversion({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      correlationId: `roas-purchase-b-${Date.now()}`,
      valueCents: 5000,
    });

    await invokeTool("analytics_conversion.record_ad_spend", {
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      campaignId: "camp-meta-m106",
      amountCents: 5000,
      channel: "META",
    });

    const snapshot = computeRoasSnapshot({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
    });

    assert.ok(snapshot.revenueCents >= 15000);
    assert.equal(snapshot.adSpendCents, 5000);
    assert.ok(snapshot.roas >= 3);
    assert.ok(snapshot.conversionCount >= 2);
  });

  it("tracks begin_checkout server-side event via tool", async () => {
    const event = (await invokeTool("analytics_conversion.track_server_event", {
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      eventName: "begin_checkout",
      correlationId: `checkout-tool-${Date.now()}`,
      valueCents: 4500,
    })) as { eventName: string; mock: boolean };

    assert.equal(event.eventName, "begin_checkout");
    assert.equal(event.mock, true);
  });

  it("lists conversions via Brain tool", async () => {
    await trackServerSideEvent({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      eventName: "purchase",
      correlationId: `list-conv-${Date.now()}`,
      valueCents: 3000,
    });

    await trackPurchaseConversion({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      correlationId: `list-conv-purchase-${Date.now()}`,
      valueCents: 3000,
    });

    const listed = (await invokeTool("analytics_conversion.list_conversions", {
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
    })) as { conversions: Array<{ conversionId: string }> };

    assert.ok(listed.conversions.length >= 1);
  });
});
