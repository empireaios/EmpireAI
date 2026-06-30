export {
  PIPELINE_STATUSES,
  customerOrderPipelineRecordSchema,
  validateCustomerOrderPipelineRecord,
} from "./models/customer-order-pipeline-record.js";
export type {
  PipelineStatus,
  CustomerOrderPipelineRecord,
} from "./models/customer-order-pipeline-record.js";

export {
  RESERVATION_STATUSES,
  inventoryReservationSchema,
  validateInventoryReservation,
} from "./models/inventory-reservation.js";
export type { ReservationStatus, InventoryReservation } from "./models/inventory-reservation.js";

export { loadCustomerOrderPipelineEnv } from "./config/customer-order-pipeline-env.js";
export type { CustomerOrderPipelineEnv } from "./config/customer-order-pipeline-env.js";

export type { CustomerOrderPipelineRepository } from "./repositories/customer-order-pipeline-repository.js";
export {
  SqliteCustomerOrderPipelineRepository,
  getCustomerOrderPipelineRepository,
  createPipelineRecord,
  createReservationRecord,
} from "./repositories/sqlite-customer-order-pipeline-repository.js";

export {
  reserveInventoryForPipeline,
  fulfillInventoryReservation,
  releaseInventoryReservation,
  InventoryReservationError,
} from "./services/inventory-reservation-service.js";

export { recordDeliveryLedgerEvents } from "./services/ledger-closure-service.js";

export {
  startCheckoutPipeline,
  verifyPipelinePayment,
  createPipelineOrder,
  reservePipelineInventory,
  applyPipelineApproval,
  submitPipelineFulfillment,
  syncPipelineTracking,
  completePipelineDelivery,
  ingestVerifiedPayment,
  runSandboxFulfillmentCycle,
  getPipelineById,
  listPipelines,
  getPipelineStageIndex,
  CustomerOrderPipelineBlockedError,
} from "./services/customer-order-pipeline-service.js";
export type {
  StartCheckoutPipelineInput,
  ApplyPipelineApprovalInput,
} from "./services/customer-order-pipeline-service.js";

export { registerCustomerOrderPipelineRoutes } from "./routes/customer-order-pipeline-routes.js";
export { customerOrderPipelineTools } from "./tools/customer-order-pipeline-tools.js";

export {
  CUSTOMER_ORDER_PIPELINE_MODULE_ID,
  CUSTOMER_ORDER_PIPELINE_VERSION,
  CUSTOMER_ORDER_PIPELINE_CAPABILITIES,
  CustomerOrderPipelineModule,
  createCustomerOrderPipelineModule,
  customerOrderPipelineModule,
} from "./contract/customer-order-pipeline-module.js";
export type {
  CustomerOrderPipelineModuleId,
  CustomerOrderPipelineCapability,
} from "./contract/customer-order-pipeline-module.js";

export const MINIMUM_CUSTOMER_ORDER_PIPELINE_MODULE_ID = "customer-order-pipeline" as const;
