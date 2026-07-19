/** R1-12 — Marketplace product mapper. */

import type { MarketplaceProductNormalizationConfiguration } from "./configuration.js";
import type { NormalizedProductRecord, RawMarketplaceProductPayload } from "./types.js";
import { ProductAttributeMapper } from "./product-attribute-mapper.js";
import { UnifiedProductSchemaEngine } from "./unified-product-schema-engine.js";

export class MarketplaceProductMapper {
  private readonly attributeMapper = new ProductAttributeMapper();
  private readonly schemaEngine = new UnifiedProductSchemaEngine();

  map(
    payload: RawMarketplaceProductPayload,
    config: MarketplaceProductNormalizationConfiguration,
  ): NormalizedProductRecord | null {
    if (!this.schemaEngine.isSupportedMarketplace(payload.marketplaceIdentifier)) {
      return null;
    }

    const source = payload.sourceData;
    const attributes = this.attributeMapper.mapAttributes(source, payload.marketplaceIdentifier);
    const variants = this.attributeMapper.mapVariants(source, payload.marketplaceIdentifier);
    const images = this.attributeMapper.extractImages(source);

    let draft: Omit<
      NormalizedProductRecord,
      "schemaVersion" | "metadataVersion" | "normalizedAt"
    >;

    switch (payload.marketplaceIdentifier) {
      case "amazon":
        draft = this.mapAmazon(payload, source, attributes, images);
        break;
      case "walmart":
        draft = this.mapWalmart(payload, source, attributes, images);
        break;
      case "etsy":
        draft = this.mapEtsy(payload, source, attributes, images);
        break;
      case "ebay":
        draft = this.mapEbay(payload, source, attributes, images);
        break;
      case "tiktok-shop":
        draft = this.mapTikTokShop(payload, source, attributes, images, variants);
        break;
      case "shopify":
        draft = this.mapShopify(payload, source, attributes, images, variants);
        break;
      case "woocommerce":
        draft = this.mapWooCommerce(payload, source, attributes, images, variants);
        break;
      default:
        return null;
    }

    if (!config.marketplaceMappingRulesEnabled) {
      draft.normalizationStatus = "normalized";
    }

    return this.schemaEngine.applySchema(draft, config);
  }

  mapBatch(
    payloads: RawMarketplaceProductPayload[],
    config: MarketplaceProductNormalizationConfiguration,
  ): NormalizedProductRecord[] {
    return payloads
      .map((p) => this.map(p, config))
      .filter((p): p is NormalizedProductRecord => p !== null);
  }

  private mapAmazon(
    payload: RawMarketplaceProductPayload,
    source: Record<string, unknown>,
    attributes: Record<string, string> | null,
    images: string[] | null,
  ) {
    return {
      productId: this.schemaEngine.buildProductId(payload.marketplaceIdentifier, payload.marketplaceProductId),
      marketplaceIdentifier: payload.marketplaceIdentifier,
      marketplaceProductId: payload.marketplaceProductId,
      sku: (source.sku as string) ?? null,
      productTitle: String(source.title ?? ""),
      productDescription: (source.description as string) ?? null,
      productCategory: (source.category as string) ?? null,
      productBrand: this.attributeMapper.extractBrand(source, "amazon", attributes),
      productImages: images,
      productAttributes: attributes,
      productVariants: null,
      price: source.price != null ? Number(source.price) : null,
      currency: (source.currency as string) ?? "USD",
      inventoryReference: (source.fulfillmentChannel as string) ?? null,
      marketplaceMetadata: { asin: payload.marketplaceProductId, ...source },
      normalizationStatus: "normalized" as const,
    };
  }

  private mapWalmart(
    payload: RawMarketplaceProductPayload,
    source: Record<string, unknown>,
    attributes: Record<string, string> | null,
    images: string[] | null,
  ) {
    return {
      productId: this.schemaEngine.buildProductId(payload.marketplaceIdentifier, payload.marketplaceProductId),
      marketplaceIdentifier: payload.marketplaceIdentifier,
      marketplaceProductId: payload.marketplaceProductId,
      sku: (source.sku as string) ?? null,
      productTitle: String(source.productName ?? source.title ?? ""),
      productDescription: (source.shortDescription as string) ?? null,
      productCategory: (source.category as string) ?? null,
      productBrand: this.attributeMapper.extractBrand(source, "walmart", attributes),
      productImages: images,
      productAttributes: attributes,
      productVariants: null,
      price: source.price != null ? Number(source.price) : null,
      currency: (source.currency as string) ?? "USD",
      inventoryReference: (source.wpid as string) ?? null,
      marketplaceMetadata: { wpid: payload.marketplaceProductId, ...source },
      normalizationStatus: "normalized" as const,
    };
  }

  private mapEtsy(
    payload: RawMarketplaceProductPayload,
    source: Record<string, unknown>,
    attributes: Record<string, string> | null,
    images: string[] | null,
  ) {
    return {
      productId: this.schemaEngine.buildProductId(payload.marketplaceIdentifier, payload.marketplaceProductId),
      marketplaceIdentifier: payload.marketplaceIdentifier,
      marketplaceProductId: payload.marketplaceProductId,
      sku: (source.sku as string) ?? null,
      productTitle: String(source.title ?? ""),
      productDescription: (source.description as string) ?? null,
      productCategory: (source.taxonomy_path as string) ?? null,
      productBrand: this.attributeMapper.extractBrand(source, "etsy", attributes),
      productImages: images,
      productAttributes: attributes,
      productVariants: null,
      price: source.price != null ? Number(source.price) : null,
      currency: (source.currency_code as string) ?? "USD",
      inventoryReference: (source.listing_id as string) ?? null,
      marketplaceMetadata: { listing_id: payload.marketplaceProductId, ...source },
      normalizationStatus: "normalized" as const,
    };
  }

  private mapEbay(
    payload: RawMarketplaceProductPayload,
    source: Record<string, unknown>,
    attributes: Record<string, string> | null,
    images: string[] | null,
  ) {
    return {
      productId: this.schemaEngine.buildProductId(payload.marketplaceIdentifier, payload.marketplaceProductId),
      marketplaceIdentifier: payload.marketplaceIdentifier,
      marketplaceProductId: payload.marketplaceProductId,
      sku: (source.sku as string) ?? null,
      productTitle: String(source.title ?? ""),
      productDescription: (source.description as string) ?? null,
      productCategory: (source.categoryId as string) ?? null,
      productBrand: this.attributeMapper.extractBrand(source, "ebay", attributes),
      productImages: images,
      productAttributes: attributes,
      productVariants: null,
      price: source.price != null ? Number(source.price) : null,
      currency: (source.currency as string) ?? "USD",
      inventoryReference: (source.itemId as string) ?? null,
      marketplaceMetadata: { itemId: payload.marketplaceProductId, ...source },
      normalizationStatus: "normalized" as const,
    };
  }

  private mapTikTokShop(
    payload: RawMarketplaceProductPayload,
    source: Record<string, unknown>,
    attributes: Record<string, string> | null,
    images: string[] | null,
    variants: NormalizedProductRecord["productVariants"],
  ) {
    return {
      productId: this.schemaEngine.buildProductId(payload.marketplaceIdentifier, payload.marketplaceProductId),
      marketplaceIdentifier: payload.marketplaceIdentifier,
      marketplaceProductId: payload.marketplaceProductId,
      sku: (source.seller_sku as string) ?? null,
      productTitle: String(source.product_name ?? source.title ?? ""),
      productDescription: (source.description as string) ?? null,
      productCategory: (source.category as string) ?? null,
      productBrand: this.attributeMapper.extractBrand(source, "tiktok-shop", attributes),
      productImages: images,
      productAttributes: attributes,
      productVariants: variants,
      price: source.price != null ? Number(source.price) : null,
      currency: (source.currency as string) ?? "USD",
      inventoryReference: (source.product_id as string) ?? null,
      marketplaceMetadata: { product_id: payload.marketplaceProductId, ...source },
      normalizationStatus: "normalized" as const,
    };
  }

  private mapShopify(
    payload: RawMarketplaceProductPayload,
    source: Record<string, unknown>,
    attributes: Record<string, string> | null,
    images: string[] | null,
    variants: NormalizedProductRecord["productVariants"],
  ) {
    return {
      productId: this.schemaEngine.buildProductId(payload.marketplaceIdentifier, payload.marketplaceProductId),
      marketplaceIdentifier: payload.marketplaceIdentifier,
      marketplaceProductId: payload.marketplaceProductId,
      sku: (source.sku as string) ?? null,
      productTitle: String(source.title ?? ""),
      productDescription: (source.body_html as string) ?? null,
      productCategory: (source.product_type as string) ?? null,
      productBrand: this.attributeMapper.extractBrand(source, "shopify", attributes),
      productImages: images,
      productAttributes: attributes,
      productVariants: variants,
      price: source.price != null ? Number(source.price) : null,
      currency: (source.currency as string) ?? "USD",
      inventoryReference: (source.inventory_item_id as string) ?? null,
      marketplaceMetadata: { shopify_product_id: payload.marketplaceProductId, ...source },
      normalizationStatus: "normalized" as const,
    };
  }

  private mapWooCommerce(
    payload: RawMarketplaceProductPayload,
    source: Record<string, unknown>,
    attributes: Record<string, string> | null,
    images: string[] | null,
    variants: NormalizedProductRecord["productVariants"],
  ) {
    return {
      productId: this.schemaEngine.buildProductId(payload.marketplaceIdentifier, payload.marketplaceProductId),
      marketplaceIdentifier: payload.marketplaceIdentifier,
      marketplaceProductId: payload.marketplaceProductId,
      sku: (source.sku as string) ?? null,
      productTitle: String(source.name ?? source.title ?? ""),
      productDescription: (source.description as string) ?? null,
      productCategory: (source.categories as Array<{ name: string }> | undefined)?.[0]?.name ?? null,
      productBrand: this.attributeMapper.extractBrand(source, "woocommerce", attributes),
      productImages: images,
      productAttributes: attributes,
      productVariants: variants,
      price: source.price != null ? Number(source.price) : null,
      currency: (source.currency as string) ?? "USD",
      inventoryReference: (source.stock_quantity as number | undefined)?.toString() ?? null,
      marketplaceMetadata: { woocommerce_id: payload.marketplaceProductId, ...source },
      normalizationStatus: "normalized" as const,
    };
  }
}
