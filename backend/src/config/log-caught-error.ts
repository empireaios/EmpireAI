import util from "node:util";
import type { Logger } from "./logger.js";

export type CaughtErrorDetails = {
  isErrorInstance: boolean;
  errorType: string;
  errorName: string | null;
  errorMessage: string | null;
  errorStack: string | null;
  errorJson: string;
  errorInspect: string;
  constructorName: string | null;
  rawValue: unknown;
};

/** Serialize a caught value without losing non-enumerable Error fields (pino often logs `{}`). */
export function describeCaughtError(error: unknown): CaughtErrorDetails {
  const isErrorInstance = error instanceof Error;
  const errorType = typeof error;
  const constructorName =
    error !== null && typeof error === "object" && error.constructor?.name
      ? error.constructor.name
      : null;

  let errorJson = "";
  try {
    errorJson = JSON.stringify(error, Object.getOwnPropertyNames(error as object), 2);
  } catch (serializationError) {
    errorJson = `<<json serialization failed: ${String(serializationError)}>>`;
  }

  let errorInspect = "";
  try {
    errorInspect = util.inspect(error, { depth: null, colors: false });
  } catch (inspectError) {
    errorInspect = `<<inspect failed: ${String(inspectError)}>>`;
  }

  return {
    isErrorInstance,
    errorType,
    errorName: isErrorInstance ? error.name : null,
    errorMessage: isErrorInstance ? error.message : null,
    errorStack: isErrorInstance ? error.stack ?? null : null,
    errorJson,
    errorInspect,
    constructorName,
    rawValue: error,
  };
}

export function logCaughtError(
  logger: Logger,
  error: unknown,
  message: string,
  context: Record<string, unknown> = {},
): void {
  const details = describeCaughtError(error);
  logger.error(
    {
      ...context,
      ...details,
    },
    message,
  );
}
