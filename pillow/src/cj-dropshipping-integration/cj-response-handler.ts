/** R2-02 — CJdropshipping API response handler. */

import type { CjApiResponse } from "./types.js";

export class CjResponseHandler {
  normalize(input: {
    requestId: string;
    statusCode: number;
    bodySummary: string;
    errorCode: string | null;
    durationMs: number;
  }): CjApiResponse {
    return {
      requestId: input.requestId,
      statusCode: input.statusCode,
      normalized: true,
      bodySummary: input.bodySummary.slice(0, 256),
      errorCode: input.errorCode,
      durationMs: input.durationMs,
      timestamp: new Date().toISOString(),
    };
  }

  normalizeError(requestId: string, code: string, message: string): CjApiResponse {
    return {
      requestId,
      statusCode: 0,
      normalized: true,
      bodySummary: message.slice(0, 128),
      errorCode: code,
      durationMs: 0,
      timestamp: new Date().toISOString(),
    };
  }
}
