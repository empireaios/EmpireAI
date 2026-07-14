/** R1-01 — Response normalization engine. */

import type { NormalizedApiResponse } from "./types.js";

export class ResponseNormalizationEngine {
  normalize(input: {
    requestId: string;
    marketplaceId: string;
    statusCode: number;
    headers: Record<string, string>;
    bodySummary: string;
    errorCode: string | null;
    durationMs: number;
  }): NormalizedApiResponse {
    const safeHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(input.headers)) {
      if (/authorization|token|secret|api[_-]?key/i.test(key)) {
        safeHeaders[key] = "[redacted]";
      } else {
        safeHeaders[key] = value;
      }
    }

    return {
      requestId: input.requestId,
      marketplaceId: input.marketplaceId,
      statusCode: input.statusCode,
      normalized: true,
      headers: safeHeaders,
      bodySummary: input.bodySummary.slice(0, 256),
      errorCode: input.errorCode,
      durationMs: input.durationMs,
      timestamp: new Date().toISOString(),
    };
  }

  normalizeError(marketplaceId: string, requestId: string, code: string, message: string): NormalizedApiResponse {
    return this.normalize({
      requestId,
      marketplaceId,
      statusCode: 0,
      headers: {},
      bodySummary: message.slice(0, 128),
      errorCode: code,
      durationMs: 0,
    });
  }
}
