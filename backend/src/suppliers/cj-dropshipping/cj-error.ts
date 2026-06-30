export type CjErrorCode =
  | "AUTH_FAILED"
  | "AUTH_MISSING"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "API_ERROR"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "SANDBOX_ONLY";

export class CjApiError extends Error {
  readonly code: CjErrorCode;
  readonly statusCode?: number;
  readonly retryable: boolean;
  readonly details?: unknown;

  constructor(
    code: CjErrorCode,
    message: string,
    options: {
      statusCode?: number;
      retryable?: boolean;
      details?: unknown;
      cause?: unknown;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "CjApiError";
    this.code = code;
    this.statusCode = options.statusCode;
    this.retryable = options.retryable ?? false;
    this.details = options.details;
  }
}

/** Classifies HTTP and transport failures for CJ API calls. */
export function classifyCjTransportError(error: unknown): CjApiError {
  if (error instanceof CjApiError) {
    return error;
  }

  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return new CjApiError("TIMEOUT", "CJ API request timed out", {
        retryable: true,
        cause: error,
      });
    }

    const message = error.message.toLowerCase();
    if (message.includes("fetch failed") || message.includes("network")) {
      return new CjApiError("NETWORK_ERROR", error.message, {
        retryable: true,
        cause: error,
      });
    }
  }

  return new CjApiError("API_ERROR", "Unexpected CJ API failure", {
    retryable: false,
    cause: error,
  });
}

/** Classifies CJ JSON envelope responses. */
export function classifyCjApiResponse(
  response: { code?: number; result?: boolean; message?: string },
  statusCode: number,
): CjApiError | null {
  if (statusCode === 429) {
    return new CjApiError("RATE_LIMITED", "CJ API rate limit exceeded", {
      statusCode,
      retryable: true,
    });
  }

  if (statusCode === 401 || statusCode === 403) {
    return new CjApiError("AUTH_FAILED", response.message ?? "CJ authentication failed", {
      statusCode,
      retryable: false,
      details: response,
    });
  }

  if (statusCode === 404) {
    return new CjApiError("NOT_FOUND", response.message ?? "CJ resource not found", {
      statusCode,
      retryable: false,
      details: response,
    });
  }

  if (statusCode >= 500) {
    return new CjApiError("API_ERROR", response.message ?? "CJ server error", {
      statusCode,
      retryable: true,
      details: response,
    });
  }

  if (response.result === false || (response.code !== undefined && response.code !== 200)) {
    return new CjApiError("API_ERROR", response.message ?? "CJ API returned an error", {
      statusCode,
      retryable: false,
      details: response,
    });
  }

  return null;
}
