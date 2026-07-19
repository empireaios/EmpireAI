/** R1-13 — Order attribute mapper. */

import type { OrderLineItem, PricingSummary } from "./types.js";

export class OrderAttributeMapper {
  mapLineItems(
    sourceData: Record<string, unknown>,
    marketplaceIdentifier: string,
  ): OrderLineItem[] {
    const items = this.extractRawItems(sourceData, marketplaceIdentifier);
    return items.map((item, idx) => ({
      itemId: String(item.id ?? item.line_item_id ?? item.orderItemId ?? `item-${idx + 1}`),
      sku: (item.sku as string) ?? (item.seller_sku as string) ?? null,
      title: String(item.title ?? item.name ?? item.product_name ?? "Order item"),
      quantity: Number(item.quantity ?? item.qty ?? 1),
      unitPrice: item.price != null ? Number(item.price) : item.unit_price != null ? Number(item.unit_price) : null,
      currency: (item.currency as string) ?? (sourceData.currency as string) ?? "USD",
    }));
  }

  mapPricingSummary(
    sourceData: Record<string, unknown>,
    items: OrderLineItem[],
  ): PricingSummary {
    const currency = String(sourceData.currency ?? sourceData.currency_code ?? "USD");
    const subtotal = sourceData.subtotal != null
      ? Number(sourceData.subtotal)
      : items.reduce((sum, i) => sum + (i.unitPrice ?? 0) * i.quantity, 0);
    const tax = sourceData.tax != null ? Number(sourceData.tax) : sourceData.total_tax != null ? Number(sourceData.total_tax) : null;
    const shipping = sourceData.shipping != null
      ? Number(sourceData.shipping)
      : sourceData.shipping_cost != null
        ? Number(sourceData.shipping_cost)
        : null;
    const total = sourceData.total != null
      ? Number(sourceData.total)
      : sourceData.order_total != null
        ? Number(sourceData.order_total)
        : sourceData.total_price != null
          ? Number(sourceData.total_price)
          : subtotal + (tax ?? 0) + (shipping ?? 0);

    return { subtotal, tax, shipping, total, currency };
  }

  extractCustomerReference(sourceData: Record<string, unknown>, marketplaceIdentifier: string): string | null {
    if (sourceData.customer_reference) return String(sourceData.customer_reference);
    if (sourceData.buyer_email) return String(sourceData.buyer_email);
    if (sourceData.customer_id) return String(sourceData.customer_id);
    if (marketplaceIdentifier === "amazon" && sourceData.buyerInfo) {
      return String((sourceData.buyerInfo as Record<string, unknown>).buyerEmail ?? "");
    }
    return null;
  }

  detectMissingFields(
    record: {
      marketplaceOrderId: string;
      orderStatus: string;
      customerReference: string | null;
      paymentStatus: string;
      fulfilmentStatus: string;
      orderItems: OrderLineItem[];
    },
    requiredFields: string[],
  ): string[] {
    const missing: string[] = [];
    for (const field of requiredFields) {
      if (field === "marketplaceOrderId" && !record.marketplaceOrderId?.trim()) missing.push(field);
      if (field === "orderStatus" && !record.orderStatus?.trim()) missing.push(field);
      if (field === "customerReference" && !record.customerReference?.trim()) missing.push(field);
      if (field === "paymentStatus" && !record.paymentStatus?.trim()) missing.push(field);
      if (field === "fulfilmentStatus" && !record.fulfilmentStatus?.trim()) missing.push(field);
      if (field === "orderItems" && record.orderItems.length === 0) missing.push(field);
    }
    return missing;
  }

  private extractRawItems(
    sourceData: Record<string, unknown>,
    marketplaceIdentifier: string,
  ): Array<Record<string, unknown>> {
    const candidates = [
      sourceData.line_items,
      sourceData.orderItems,
      sourceData.items,
      sourceData.order_lines,
    ];
    for (const c of candidates) {
      if (Array.isArray(c) && c.length > 0) return c as Array<Record<string, unknown>>;
    }
    if (marketplaceIdentifier === "amazon" && sourceData.OrderItems) {
      return sourceData.OrderItems as Array<Record<string, unknown>>;
    }
    return [{ title: sourceData.title ?? "Default item", quantity: 1, price: sourceData.total ?? 0 }];
  }
}
