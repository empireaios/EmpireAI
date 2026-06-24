export type ConnectorCategory =
  | "suppliers"
  | "commerce"
  | "advertising"
  | "payments"
  | "shipping"
  | "analytics"
  | "trend_intelligence";

export type ConnectorStatus = "available" | "connected" | "degraded" | "disconnected";

export type ConnectorCapability =
  | "catalog_sync"
  | "order_fulfillment"
  | "inventory"
  | "checkout"
  | "campaign_sync"
  | "payment_capture"
  | "refund"
  | "shipment_tracking"
  | "metrics_import"
  | "trend_data";

export type ConnectorDefinition = {
  id: string;
  name: string;
  category: ConnectorCategory;
  capabilities: ConnectorCapability[];
  replaceableBy: string[];
  docsUrl?: string;
};

export type ConnectorHealth = {
  status: ConnectorStatus;
  message: string;
  checkedAt: string;
};

export type ConnectorContext = {
  workspaceId: string;
  companyId?: string;
  correlationId: string;
};

/** Common interface every external provider connector must implement. */
export interface EmpireConnector {
  readonly definition: ConnectorDefinition;
  connect(workspaceId: string, credentialsRef: string): Promise<void>;
  disconnect(workspaceId: string): Promise<void>;
  healthCheck(context: ConnectorContext): Promise<ConnectorHealth>;
  invoke<T = unknown>(
    capability: ConnectorCapability,
    context: ConnectorContext,
    payload: Record<string, unknown>,
  ): Promise<T>;
}

export type ConnectorConnectionRecord = {
  id: string;
  workspaceId: string;
  connectorId: string;
  category: ConnectorCategory;
  status: ConnectorStatus;
  credentialsRef: string | null;
  metadata: Record<string, unknown>;
  connectedAt: string | null;
  updatedAt: string;
};
