/** PILLOW-SCI-001 — Shipping Carrier Integration exports (R2-11). */

export {
  ShippingCarrierIntegrationEngine,
  createShippingCarrierIntegrationEngine,
  resetShippingCarrierIntegrationForTesting,
} from "./engine.js";

export {
  buildShippingCarrierIntegrationConfiguration,
  DEFAULT_SHIPPING_CARRIER_INTEGRATION_CONFIGURATION,
  type ShippingCarrierIntegrationConfiguration,
} from "./configuration.js";

export {
  SHIPPING_CARRIER_INTEGRATION_SYSTEM_PATH,
  SCI_METADATA_VERSION,
  SUPPORTED_CARRIER_IDENTIFIERS,
  SHIPMENT_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type {
  ShippingCarrierIntegrationVersion,
  ShipmentRecord,
  ShipmentReport,
  ShippingCarrierIntegrationState,
  CarrierCockpitSnapshot,
  CarrierHealthReport,
  CarrierPerformanceStats,
  CarrierRegistration,
  RegisterCarrierInput,
  CreateShipmentRequestInput,
  RequestShippingLabelInput,
  RequestShippingRatesInput,
  ShippingRateQuote,
  ShipmentStatus,
  SupportedCarrierIdentifier,
  EngineStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
