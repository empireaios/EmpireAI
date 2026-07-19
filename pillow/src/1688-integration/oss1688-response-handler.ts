/** R2-04 — 1688 API response handler. */

import type { Oss1688ApiResponse } from "./types.js";

export class Oss1688ResponseHandler {
  normalize(input: {
    requestId: string;
    statusCode: number;
    bodySummary: string;
    errorCode: string | null;
    durationMs: number;
  }): Oss1688ApiResponse {
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

  normalizeError(requestId: string, code: string, message: string): Oss1688ApiResponse {
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
