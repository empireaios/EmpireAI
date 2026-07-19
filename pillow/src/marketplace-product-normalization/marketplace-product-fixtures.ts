/** R1-12 — Marketplace product fixtures (structural — no live HTTP). */

import type { RawMarketplaceProductPayload } from "./types.js";

export function getFixtureCatalog(): RawMarketplaceProductPayload[] {
  return [
    {
      marketplaceIdentifier: "amazon",
      marketplaceProductId: "B08N5WRWNW",
      sourceData: {
        title: "Echo Dot (4th Gen)",
        sku: "AMZ-SKU-001",
        description: "Smart speaker with Alexa",
        category: "Electronics",
        price: 49.99,
        currency: "USD",
        brand: "Amazon",
        images: ["https://images.amazon.example/echo-dot.jpg"],
        attributes: { brand: "Amazon", color: "Charcoal" },
        fulfillmentChannel: "AMAZON_NA",
      },
    },
    {
      marketplaceIdentifier: "walmart",
      marketplaceProductId: "WM-12345",
      sourceData: {
        productName: "Echo Dot (4th Gen)",
        sku: "AMZ-SKU-001",
        shortDescription: "Smart speaker with Alexa",
        category: "Electronics",
        price: 47.99,
        currency: "USD",
        brand: "Amazon",
        wpid: "WM-12345",
        images: ["https://images.walmart.example/echo-dot.jpg"],
        attributes: { brand: "Amazon" },
      },
    },
    {
      marketplaceIdentifier: "etsy",
      marketplaceProductId: "etsy-listing-98765",
      sourceData: {
        title: "Handmade Ceramic Mug",
        sku: "MUG-001",
        description: "Artisan ceramic mug",
        taxonomy_path: "Home & Living > Drinkware",
        price: 24.0,
        currency_code: "USD",
        listing_id: "etsy-listing-98765",
        images: ["https://images.etsy.example/mug.jpg"],
        attributes: { material: "Ceramic" },
      },
    },
    {
      marketplaceIdentifier: "ebay",
      marketplaceProductId: "ebay-item-55555",
      sourceData: {
        title: "Vintage Camera Lens",
        sku: "LENS-42",
        description: "Classic 50mm lens",
        categoryId: "Cameras & Photo",
        price: 120.0,
        currency: "USD",
        itemId: "ebay-item-55555",
        images: ["https://images.ebay.example/lens.jpg"],
        attributes: { condition: "Used" },
      },
    },
    {
      marketplaceIdentifier: "tiktok-shop",
      marketplaceProductId: "tts-prod-7788",
      sourceData: {
        product_name: "Wireless Earbuds Pro",
        seller_sku: "EAR-PRO-01",
        description: "Noise cancelling earbuds",
        category: "Electronics",
        price: 79.99,
        currency: "USD",
        product_id: "tts-prod-7788",
        images: ["https://images.tiktok.example/earbuds.jpg"],
        attributes: { color: "Black" },
      },
    },
    {
      marketplaceIdentifier: "shopify",
      marketplaceProductId: "gid://shopify/Product/1001",
      sourceData: {
        title: "Organic Cotton T-Shirt",
        sku: "TSHIRT-ORG-M",
        body_html: "<p>Soft organic cotton tee</p>",
        product_type: "Apparel",
        vendor: "Empire Basics",
        price: 29.99,
        currency: "USD",
        inventory_item_id: "inv-1001",
        images: [{ src: "https://cdn.shopify.example/tshirt.jpg" }],
        tags: "organic,cotton",
        variants: [
          { id: "var-1", sku: "TSHIRT-ORG-S", title: "Small", price: 29.99, currency: "USD" },
          { id: "var-2", sku: "TSHIRT-ORG-M", title: "Medium", price: 29.99, currency: "USD" },
        ],
      },
    },
    {
      marketplaceIdentifier: "woocommerce",
      marketplaceProductId: "woo-501",
      sourceData: {
        name: "WordPress Theme Bundle",
        sku: "WP-THEME-BNDL",
        description: "Premium WordPress themes",
        categories: [{ name: "Digital Products" }],
        price: 99.0,
        currency: "USD",
        stock_quantity: 999,
        images: ["https://store.wordpress.example/theme-bundle.jpg"],
        attributes: [{ name: "License", options: ["Single Site", "Unlimited"] }],
        variations: [
          { id: "var-w1", sku: "WP-THEME-SINGLE", description: "Single Site", price: 59.0, currency: "USD" },
          { id: "var-w2", sku: "WP-THEME-UNLIM", description: "Unlimited", price: 99.0, currency: "USD" },
        ],
      },
    },
  ];
}

export function getFixtureForMarketplace(
  marketplaceIdentifier: string,
): RawMarketplaceProductPayload[] {
  return getFixtureCatalog().filter((p) => p.marketplaceIdentifier === marketplaceIdentifier);
}

export function getInvalidFixture(): RawMarketplaceProductPayload {
  return {
    marketplaceIdentifier: "amazon",
    marketplaceProductId: "",
    sourceData: {},
  };
}

export function getDuplicateSkuFixtures(): RawMarketplaceProductPayload[] {
  return [
    {
      marketplaceIdentifier: "amazon",
      marketplaceProductId: "B09DUP001",
      sourceData: {
        title: "Duplicate SKU Product A",
        sku: "SHARED-SKU-001",
        price: 10,
        currency: "USD",
      },
    },
    {
      marketplaceIdentifier: "ebay",
      marketplaceProductId: "ebay-dup-001",
      sourceData: {
        title: "Duplicate SKU Product B",
        sku: "SHARED-SKU-001",
        price: 12,
        currency: "USD",
      },
    },
  ];
}
