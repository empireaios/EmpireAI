/** R2-09 — Procurement fixtures (structural — no live HTTP). */

export type FixtureProcurementRequest = {
  productReference: string;
  supplierProductId: string;
  requestedQuantity: number;
};

export function getFixtureProcurementRequest(): FixtureProcurementRequest {
  return {
    productReference: "cj-prod-1001",
    supplierProductId: "cj-prod-1001",
    requestedQuantity: 10,
  };
}

export function getFixtureProcurementRequests(): FixtureProcurementRequest[] {
  return [
    { productReference: "cj-prod-1001", supplierProductId: "cj-prod-1001", requestedQuantity: 10 },
    { productReference: "aex-prod-2002", supplierProductId: "aex-prod-2002", requestedQuantity: 25 },
    { productReference: "oss-prod-3003", supplierProductId: "oss-prod-3003", requestedQuantity: 100 },
  ];
}

export function getInvalidFixtureRequest(): FixtureProcurementRequest {
  return {
    productReference: "",
    supplierProductId: "",
    requestedQuantity: -1,
  };
}
