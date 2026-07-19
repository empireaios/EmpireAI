/** R2-11 — Carrier Response Handler. */

import type { CarrierApiResponse } from "./carrier-api-client.js";
import type { CarrierFailureFinding } from "./types.js";

export class CarrierResponseHandler {
  handleFailure(input: {
    shipmentId: string;
    response: CarrierApiResponse<unknown>;
    context: string;
  }): CarrierFailureFinding | null {
    if (input.response.success) return null;

    const failureType = input.response.rateLimited
      ? ("rate_limit" as const)
      : input.context.includes("auth")
        ? ("authentication" as const)
        : input.context.includes("label")
          ? ("label_generation" as const)
          : input.context.includes("shipment")
            ? ("shipment_creation" as const)
            : ("api_failure" as const);

    return {
      shipmentId: input.shipmentId,
      failureType,
      details: input.response.error ?? `${input.context} failed`,
    };
  }
}
