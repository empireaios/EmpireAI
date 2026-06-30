import type { CustomerOrderPipelineRecord } from "../models/customer-order-pipeline-record.js";
import type { InventoryReservation } from "../models/inventory-reservation.js";

export interface CustomerOrderPipelineRepository {
  savePipeline(record: CustomerOrderPipelineRecord): CustomerOrderPipelineRecord;
  getPipelineById(pipelineId: string): CustomerOrderPipelineRecord | null;
  getPipelineByPaymentId(paymentId: string): CustomerOrderPipelineRecord | null;
  getPipelineByCorrelationId(correlationId: string): CustomerOrderPipelineRecord | null;
  listPipelines(workspaceId: string, companyId?: string): CustomerOrderPipelineRecord[];

  saveReservation(reservation: InventoryReservation): InventoryReservation;
  getReservationById(reservationId: string): InventoryReservation | null;
  getReservationByPipelineId(pipelineId: string): InventoryReservation | null;
}
