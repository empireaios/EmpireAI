/** PILLOW-IG-001 — Invoice Generator exports (R3-09). */

export {
  InvoiceGeneratorEngine,
  createInvoiceGeneratorEngine,
  resetInvoiceGeneratorForTesting,
} from "./engine.js";

export {
  buildInvoiceGeneratorConfiguration,
  DEFAULT_INVOICE_GENERATOR_CONFIGURATION,
  type InvoiceGeneratorConfiguration,
} from "./configuration.js";

export {
  INVOICE_GENERATOR_SYSTEM_PATH,
  IG_METADATA_VERSION,
  INVOICE_GENERATOR_ID,
  IG_CAPABILITIES,
  INVOICE_STATUSES,
} from "./paths.js";

export type {
  InvoiceGeneratorVersion,
  InvoiceGeneratorRecord,
  InvoiceRecord,
  InvoiceLineItem,
  InvoiceGeneratorRunReport,
  InvoiceGeneratorState,
  InvoiceCockpitSnapshot,
  InvoiceHealthReport,
  InvoicePerformanceStats,
  ConnectInvoiceGeneratorInput,
  CreateCustomerInvoiceInput,
  CreateSupplierInvoiceInput,
  UpdateInvoiceStatusInput,
  InvoiceStatus,
  EngineStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
