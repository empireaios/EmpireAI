import type { GlobalProductSignalCreateInput } from "../../global-product-signals/models/product-signal.js";
import {
  parseSignalSource,
  type SignalSource,
} from "../../global-product-signals/models/signal-source.js";
import { normalizeProductSignalInput } from "../../global-product-signals/utilities/signal-normalization.js";
import type { EyeConnector } from "../../connector-registry/models/eye-connector.js";
import type { ConnectorIngestionEvent } from "../models/connector-ingestion-event.js";

const CONNECTOR_SIGNAL_SOURCE_MAP: Record<string, SignalSource> = {
  amazon: "AMAZON",
  "google-trends": "GOOGLE_TRENDS",
  tiktok: "TIKTOK",
  pinterest: "PINTEREST",
  reddit: "REDDIT",
  "cj-dropshipping": "SUPPLIER",
};

/** Resolves a connector id to a canonical global product signal source. */
export function resolveSignalSourceForConnector(connectorId: string): SignalSource {
  const mapped = CONNECTOR_SIGNAL_SOURCE_MAP[connectorId];
  if (mapped) {
    return mapped;
  }

  const parsed = parseSignalSource(connectorId);
  if (parsed) {
    return parsed;
  }

  return "MANUAL";
}

/** Maps a connector observation event into a global product signal create payload. */
export function mapConnectorSignalToProductSignal(
  connector: EyeConnector,
  event: ConnectorIngestionEvent,
): GlobalProductSignalCreateInput {
  const source = resolveSignalSourceForConnector(connector.connectorId);

  return normalizeProductSignalInput({
    productId: event.productId,
    source,
    timestamp: event.observedAt,
    strength: event.strength,
    evidence: event.evidence,
    metadata: {
      ...event.metadata,
      connectorId: connector.connectorId,
      connectorName: connector.connectorName,
      connectorType: connector.connectorType,
      ingestionEventId: event.eventId,
    },
  });
}

export const connectorSignalMapper = {
  resolveSignalSourceForConnector,
  mapConnectorSignalToProductSignal,
} as const;
