import type { ApiProviderRegistration, ApirtInput } from "./types.js";

export type RouteResult = {
  apiId: string;
  provider: string;
  endpoint: string;
  method: string;
  path: string;
  requestRef: string;
  routed: true;
  structuralSignalOnly: true;
};

export class ApiRouter {
  /** Deterministic route by apiId → provider endpoint. */
  route(provider: ApiProviderRegistration, input: ApirtInput): RouteResult {
    const method = (input.method ?? "GET").toUpperCase();
    const path = input.path ?? "/";
    const requestRef =
      input.requestRef ?? `request://structural/${provider.apiId}/${method}${path}`;

    return {
      apiId: provider.apiId,
      provider: provider.provider,
      endpoint: provider.endpoint,
      method,
      path,
      requestRef,
      routed: true,
      structuralSignalOnly: true,
    };
  }
}
