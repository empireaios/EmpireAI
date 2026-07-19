/** R1-12 — Product attribute mapper. */

import type { ProductVariant, RawMarketplaceProductPayload } from "./types.js";

export class ProductAttributeMapper {
  mapAttributes(
    sourceData: Record<string, unknown>,
    marketplaceIdentifier: string,
  ): Record<string, string> | null {
    const attributes: Record<string, string> = {};

    if (marketplaceIdentifier === "amazon") {
      const attrs = sourceData.attributes as Record<string, string> | undefined;
      if (attrs) Object.assign(attributes, attrs);
    } else if (marketplaceIdentifier === "shopify") {
      const tags = sourceData.tags as string | undefined;
      if (tags) attributes.tags = tags;
      const vendor = sourceData.vendor as string | undefined;
      if (vendor) attributes.vendor = vendor;
    } else if (marketplaceIdentifier === "woocommerce") {
      const attrs = sourceData.attributes as Array<{ name: string; options: string[] }> | undefined;
      if (attrs) {
        for (const attr of attrs) {
          attributes[attr.name] = attr.options.join(", ");
        }
      }
    } else {
      const generic = sourceData.attributes as Record<string, string> | undefined;
      if (generic) Object.assign(attributes, generic);
    }

    return Object.keys(attributes).length > 0 ? attributes : null;
  }

  mapVariants(
    sourceData: Record<string, unknown>,
    marketplaceIdentifier: string,
  ): ProductVariant[] | null {
    if (marketplaceIdentifier === "shopify") {
      const variants = sourceData.variants as Array<Record<string, unknown>> | undefined;
      if (!variants?.length) return null;
      return variants.map((v) => ({
        variantId: String(v.id ?? ""),
        sku: (v.sku as string) ?? null,
        title: (v.title as string) ?? null,
        price: v.price != null ? Number(v.price) : null,
        currency: (v.currency as string) ?? null,
        attributes: null,
      }));
    }

    if (marketplaceIdentifier === "woocommerce") {
      const variations = sourceData.variations as Array<Record<string, unknown>> | undefined;
      if (!variations?.length) return null;
      return variations.map((v) => ({
        variantId: String(v.id ?? ""),
        sku: (v.sku as string) ?? null,
        title: (v.description as string) ?? null,
        price: v.price != null ? Number(v.price) : null,
        currency: (v.currency as string) ?? null,
        attributes: (v.attributes as Record<string, string>) ?? null,
      }));
    }

    return null;
  }

  extractBrand(
    sourceData: Record<string, unknown>,
    marketplaceIdentifier: string,
    attributes: Record<string, string> | null,
  ): string | null {
    if (attributes?.brand) return attributes.brand;
    if (marketplaceIdentifier === "shopify" && sourceData.vendor) {
      return String(sourceData.vendor);
    }
    if (sourceData.brand) return String(sourceData.brand);
    return null;
  }

  extractImages(sourceData: Record<string, unknown>): string[] | null {
    const images = sourceData.images;
    if (!images) return null;
    if (Array.isArray(images)) {
      const urls = images.map((img) => {
        if (typeof img === "string") return img;
        if (img && typeof img === "object" && "src" in img) return String((img as { src: string }).src);
        return null;
      }).filter((u): u is string => Boolean(u));
      return urls.length > 0 ? urls : null;
    }
    return null;
  }

  detectMissingFields(
    record: {
      productTitle: string;
      marketplaceProductId: string;
      sku: string | null;
      productCategory: string | null;
      productBrand: string | null;
    },
    requiredFields: string[],
  ): string[] {
    const missing: string[] = [];
    for (const field of requiredFields) {
      if (field === "productTitle" && !record.productTitle?.trim()) missing.push(field);
      if (field === "marketplaceProductId" && !record.marketplaceProductId?.trim()) {
        missing.push(field);
      }
      if (field === "sku" && !record.sku?.trim()) missing.push(field);
      if (field === "productCategory" && !record.productCategory?.trim()) missing.push(field);
      if (field === "productBrand" && !record.productBrand?.trim()) missing.push(field);
    }
    return missing;
  }

  toRawPayload(input: RawMarketplaceProductPayload): RawMarketplaceProductPayload {
    return {
      marketplaceIdentifier: input.marketplaceIdentifier,
      marketplaceProductId: input.marketplaceProductId,
      sourceData: { ...input.sourceData },
    };
  }
}
