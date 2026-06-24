import type {
  ConnectorCapability,
  ConnectorContext,
  ConnectorDefinition,
  ConnectorHealth,
  EmpireConnector,
} from "./types.js";
import { getConnectorMetadata } from "./metadata.js";

/** Mock provider — implements EmpireConnector with deterministic sample responses. */
export function createMockConnector(definition: ConnectorDefinition): EmpireConnector {
  const metadata = getConnectorMetadata(definition.id);

  return {
    definition,
    async connect(_workspaceId: string, _credentialsRef: string): Promise<void> {
      // Mock connect — no real API call
    },
    async disconnect(_workspaceId: string): Promise<void> {
      return;
    },
    async healthCheck(context: ConnectorContext): Promise<ConnectorHealth> {
      return {
        status: "available",
        message: `${definition.name} mock provider ready for workspace ${context.workspaceId}`,
        checkedAt: new Date().toISOString(),
      };
    },
    async invoke<T = unknown>(
      capability: ConnectorCapability,
      context: ConnectorContext,
      payload: Record<string, unknown>,
    ): Promise<T> {
      return {
        mock: true,
        providerId: definition.id,
        providerName: metadata?.providerName ?? definition.name,
        capability,
        workspaceId: context.workspaceId,
        correlationId: context.correlationId,
        payload,
        sampleData: buildMockPayload(definition.id, capability),
        message: "Mock provider response — real integration deferred",
      } as T;
    },
  };
}

function buildMockPayload(
  providerId: string,
  capability: ConnectorCapability,
): Record<string, unknown> {
  switch (capability) {
    case "catalog_sync":
      return {
        products: [
          { sku: `${providerId}-sku-001`, name: "Sample Product A", priceCents: 2999 },
          { sku: `${providerId}-sku-002`, name: "Sample Product B", priceCents: 4999 },
        ],
      };
    case "order_fulfillment":
      return { orderId: `mock-order-${Date.now()}`, status: "processing", etaDays: 7 };
    case "inventory":
      return { sku: `${providerId}-sku-001`, quantity: 250, warehouse: "mock-wh-1" };
    case "checkout":
      return { sessionId: `mock-checkout-${Date.now()}`, status: "open" };
    case "campaign_sync":
      return { campaigns: [{ id: "camp-001", name: "Mock Campaign", spendCents: 50000, roas: 2.4 }] };
    case "payment_capture":
      return { paymentId: `mock-pay-${Date.now()}`, status: "captured", amountCents: 4999 };
    case "refund":
      return { refundId: `mock-ref-${Date.now()}`, status: "pending", amountCents: 4999 };
    case "shipment_tracking":
      return { trackingNumber: "MOCK123456789", status: "in_transit", etaDays: 5 };
    case "metrics_import":
      return { sessions: 12400, conversionRate: 0.032, revenueCents: 890000 };
    case "trend_data":
      return { keyword: "portable blender", interestIndex: 78, trend: "rising" };
    default:
      return { status: "mock_ready" };
  }
}
