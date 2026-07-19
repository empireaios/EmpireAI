/** R1-13 — Marketplace order fixtures (structural — no live HTTP). */

import type { RawMarketplaceOrderPayload } from "./types.js";

export function getFixtureCatalog(): RawMarketplaceOrderPayload[] {
  return [
    {
      marketplaceIdentifier: "amazon",
      marketplaceOrderId: "AMZ-ORD-10001",
      sourceData: {
        order_status: "Shipped",
        payment_status: "Paid",
        fulfillment_status: "Fulfilled",
        shipping_status: "InTransit",
        refund_status: "None",
        customer_reference: "buyer-amz-001@example.com",
        currency: "USD",
        subtotal: 49.99,
        tax: 4.0,
        shipping: 5.99,
        total: 59.98,
        line_items: [{ id: "li-1", sku: "AMZ-SKU-001", title: "Echo Dot", quantity: 1, price: 49.99 }],
      },
    },
    {
      marketplaceIdentifier: "walmart",
      marketplaceOrderId: "WM-ORD-20002",
      sourceData: {
        status: "Delivered",
        paymentStatus: "Captured",
        fulfilment_status: "Delivered",
        shippingStatus: "Delivered",
        customer_id: "wm-cust-442",
        currency: "USD",
        order_total: 47.99,
        items: [{ orderItemId: "wli-1", sku: "WM-SKU-22", name: "Kitchen Scale", quantity: 1, unit_price: 47.99 }],
      },
    },
    {
      marketplaceIdentifier: "etsy",
      marketplaceOrderId: "etsy-ord-30003",
      sourceData: {
        order_status: "completed",
        payment_status: "paid",
        fulfillment_status: "shipped",
        buyer_email: "etsy-buyer@example.com",
        currency_code: "USD",
        total: 24.0,
        line_items: [{ line_item_id: "eli-1", sku: "MUG-001", title: "Ceramic Mug", quantity: 1, price: 24.0 }],
      },
    },
    {
      marketplaceIdentifier: "ebay",
      marketplaceOrderId: "ebay-ord-40004",
      sourceData: {
        orderStatus: "Completed",
        paymentStatus: "Paid",
        fulfillmentStatus: "Fulfilled",
        shippingStatus: "Delivered",
        customer_reference: "ebay-buyer@example.com",
        currency: "USD",
        total: 120.0,
        orderItems: [{ id: "ebi-1", sku: "LENS-42", title: "Camera Lens", quantity: 1, price: 120.0 }],
      },
    },
    {
      marketplaceIdentifier: "tiktok-shop",
      marketplaceOrderId: "tts-ord-50005",
      sourceData: {
        order_status: "AWAITING_SHIPMENT",
        payment_status: "PAID",
        fulfillment_status: "UNFULFILLED",
        customer_reference: "tts-buyer@example.com",
        currency: "USD",
        total: 79.99,
        items: [{ id: "tti-1", seller_sku: "EAR-PRO-01", product_name: "Wireless Earbuds", quantity: 1, price: 79.99 }],
      },
    },
    {
      marketplaceIdentifier: "shopify",
      marketplaceOrderId: "gid://shopify/Order/70006",
      sourceData: {
        status: "open",
        payment_status: "paid",
        fulfillment_status: "partial",
        shipping_status: "in_transit",
        customer_reference: "shopify-buyer@example.com",
        currency: "USD",
        subtotal: 59.98,
        total_tax: 4.8,
        shipping_cost: 6.0,
        total_price: 70.78,
        line_items: [
          { id: "sli-1", sku: "TSHIRT-ORG-M", title: "Organic T-Shirt", quantity: 2, price: 29.99 },
        ],
      },
    },
    {
      marketplaceIdentifier: "woocommerce",
      marketplaceOrderId: "woo-ord-80007",
      sourceData: {
        status: "processing",
        payment_status: "paid",
        fulfilment_status: "processing",
        shipping_status: "pending",
        refund_status: "none",
        customer_reference: "woo-buyer@example.com",
        currency: "USD",
        total: 99.0,
        line_items: [
          { id: "wli-1", sku: "WP-THEME-BNDL", name: "Theme Bundle", quantity: 1, price: 99.0 },
        ],
      },
    },
  ];
}

export function getFixtureForMarketplace(
  marketplaceIdentifier: string,
): RawMarketplaceOrderPayload[] {
  return getFixtureCatalog().filter((o) => o.marketplaceIdentifier === marketplaceIdentifier);
}

export function getInvalidFixture(): RawMarketplaceOrderPayload {
  return {
    marketplaceIdentifier: "amazon",
    marketplaceOrderId: "",
    sourceData: {},
  };
}

export function getDuplicateOrderFixtures(): RawMarketplaceOrderPayload[] {
  return [
    {
      marketplaceIdentifier: "amazon",
      marketplaceOrderId: "AMZ-ORD-DUP-001",
      sourceData: {
        order_status: "Pending",
        payment_status: "Paid",
        fulfillment_status: "Unfulfilled",
        customer_reference: "shared-buyer@example.com",
        currency: "USD",
        total: 25.0,
        line_items: [{ id: "dli-1", title: "Dup Item A", quantity: 1, price: 25.0 }],
      },
    },
    {
      marketplaceIdentifier: "ebay",
      marketplaceOrderId: "ebay-ord-dup-001",
      sourceData: {
        orderStatus: "Active",
        paymentStatus: "Paid",
        fulfillmentStatus: "NotStarted",
        customer_reference: "shared-buyer@example.com",
        currency: "USD",
        total: 25.0,
        orderItems: [{ id: "dli-2", title: "Dup Item B", quantity: 1, price: 25.0 }],
      },
    },
  ];
}
