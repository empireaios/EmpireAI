import { z } from "zod";

export const RESERVATION_STATUSES = ["RESERVED", "RELEASED", "FULFILLED"] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export type InventoryReservation = {
  reservationId: string;
  pipelineId: string;
  workspaceId: string;
  supplierSku: string;
  supplierProductId: string;
  quantity: number;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
};

export const inventoryReservationSchema = z.object({
  reservationId: z.string().min(1),
  pipelineId: z.string().min(1),
  workspaceId: z.string().min(1),
  supplierSku: z.string().min(1),
  supplierProductId: z.string().min(1),
  quantity: z.number().int().min(1),
  status: z.enum(RESERVATION_STATUSES),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export function validateInventoryReservation(value: unknown): InventoryReservation {
  return inventoryReservationSchema.parse(value);
}
