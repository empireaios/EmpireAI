/** R1-15 — Marketplace connector validator (R1-06 through R1-11). */

import type { MarketplaceCertificationConfiguration } from "./configuration.js";
import type { MarketplaceCertificationContext } from "./marketplace-certification-context.js";
import type { MissionValidationResult } from "./types.js";
import { validateEngineMission } from "./mission-validator-utils.js";

type ConnectorMission = {
  missionId: string;
  label: string;
  marketplaceId: string;
  engine: MarketplaceCertificationContext[keyof MarketplaceCertificationContext];
  connect: () => unknown;
};

export class MarketplaceConnectorValidator {
  async validateAll(
    ctx: MarketplaceCertificationContext,
    config: MarketplaceCertificationConfiguration,
  ): Promise<MissionValidationResult[]> {
    const missions: ConnectorMission[] = [
      {
        missionId: "R1-06",
        label: "Walmart Marketplace Integration",
        marketplaceId: "walmart",
        engine: ctx.walmartIntegration,
        connect: () => ctx.walmartIntegration?.connectWalmart(),
      },
      {
        missionId: "R1-07",
        label: "Etsy Marketplace Integration",
        marketplaceId: "etsy",
        engine: ctx.etsyIntegration,
        connect: () => ctx.etsyIntegration?.connectEtsy(),
      },
      {
        missionId: "R1-08",
        label: "eBay Marketplace Integration",
        marketplaceId: "ebay",
        engine: ctx.ebayIntegration,
        connect: () => ctx.ebayIntegration?.connectEbay(),
      },
      {
        missionId: "R1-09",
        label: "TikTok Shop Integration",
        marketplaceId: "tiktok-shop",
        engine: ctx.tiktokShopIntegration,
        connect: () => ctx.tiktokShopIntegration?.connectTikTokShop(),
      },
      {
        missionId: "R1-10",
        label: "Shopify Store Integration",
        marketplaceId: "shopify",
        engine: ctx.shopifyStoreIntegration,
        connect: () =>
          ctx.shopifyStoreIntegration?.connectShopifyStore({
            storeId: "cert-store",
            storeDomain: "cert.myshopify.com",
          }),
      },
      {
        missionId: "R1-11",
        label: "WooCommerce Integration",
        marketplaceId: "woocommerce",
        engine: ctx.woocommerceIntegration,
        connect: () =>
          ctx.woocommerceIntegration?.connectWooCommerce({
            storeId: "cert-store",
            storeUrl: "https://cert.wordpress.example",
          }),
      },
    ];

    const results: MissionValidationResult[] = [];

    for (const mission of missions) {
      results.push(
        await validateEngineMission({
          missionId: mission.missionId,
          missionLabel: mission.label,
          engine: mission.engine as {
            getState: () => { missionId: string; engineVersion: string; status: string };
          } | null,
          expectedMissionId: mission.missionId,
          smokeTest: config.includeSmokeTests
            ? async () => {
                mission.connect();
              }
            : undefined,
        }),
      );
    }

    return results;
  }
}
