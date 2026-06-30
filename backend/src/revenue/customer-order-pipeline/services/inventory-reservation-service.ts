import { loadCustomerOrderPipelineEnv } from "../config/customer-order-pipeline-env.js";
import type { InventoryReservation } from "../models/inventory-reservation.js";
import {
  createReservationRecord,
  getCustomerOrderPipelineRepository,
} from "../repositories/sqlite-customer-order-pipeline-repository.js";

export class InventoryReservationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InventoryReservationError";
  }
}

/** Reserves inventory for a pipeline order line — operational reservation table. */
export function reserveInventoryForPipeline(input: {
  pipelineId: string;
  workspaceId: string;
  supplierSku: string;
  supplierProductId: string;
  quantity: number;
}): InventoryReservation {
  const config = loadCustomerOrderPipelineEnv();
  const repository = getCustomerOrderPipelineRepository();

  const existing = repository.getReservationByPipelineId(input.pipelineId);
  if (existing) return existing;

  const availableUnits = config.CUSTOMER_ORDER_PIPELINE_DEFAULT_INVENTORY_UNITS;
  if (input.quantity > availableUnits) {
    throw new InventoryReservationError(
      `Insufficient inventory for ${input.supplierSku}: requested ${input.quantity}, available ${availableUnits}`,
    );
  }

  return repository.saveReservation(
    createReservationRecord({
      pipelineId: input.pipelineId,
      workspaceId: input.workspaceId,
      supplierSku: input.supplierSku,
      supplierProductId: input.supplierProductId,
      quantity: input.quantity,
      status: "RESERVED",
    }),
  );
}

/** Marks inventory reservation as fulfilled after CJ submission. */
export function fulfillInventoryReservation(pipelineId: string): InventoryReservation | null {
  const repository = getCustomerOrderPipelineRepository();
  const reservation = repository.getReservationByPipelineId(pipelineId);
  if (!reservation) return null;

  return repository.saveReservation({ ...reservation, status: "FULFILLED" });
}

/** Releases a reservation on cancellation. */
export function releaseInventoryReservation(pipelineId: string): InventoryReservation | null {
  const repository = getCustomerOrderPipelineRepository();
  const reservation = repository.getReservationByPipelineId(pipelineId);
  if (!reservation) return null;

  return repository.saveReservation({ ...reservation, status: "RELEASED" });
}
