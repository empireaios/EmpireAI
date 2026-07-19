/** R2-10 — Fulfilment fixtures (structural — no live HTTP). */

export type FixtureFulfilmentRequest = {
  orderReference: string;
  procurementReference: string;
  productReference: string;
  quantity: number;
};

export function getFixtureFulfilmentRequest(): FixtureFulfilmentRequest {
  return {
    orderReference: "ord-10001",
    procurementReference: "pce-fixture-ref",
    productReference: "cj-prod-1001",
    quantity: 1,
  };
}

export function getInvalidFixtureRequest(): FixtureFulfilmentRequest {
  return {
    orderReference: "",
    procurementReference: "",
    productReference: "",
    quantity: 0,
  };
}
