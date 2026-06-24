import type {
  EyeConnectorContext,
  EyeConnectorDefinition,
  EyeConnectorHealth,
  EyeObserveRequest,
  EyeRawObservation,
  EyeSignalDomain,
} from "../types.js";

/** Vendor-agnostic observation connector contract. */
export interface EyeConnector {
  readonly definition: EyeConnectorDefinition;

  connect(context: EyeConnectorContext, credentialsRef: string): Promise<void>;
  disconnect(context: EyeConnectorContext): Promise<void>;
  healthCheck(context: EyeConnectorContext): Promise<EyeConnectorHealth>;

  observe(
    context: EyeConnectorContext,
    request: EyeObserveRequest,
  ): Promise<EyeRawObservation[]>;

  discover?(
    context: EyeConnectorContext,
    domain: EyeSignalDomain,
    seed: Record<string, unknown>,
  ): Promise<EyeRawObservation[]>;

  ingestWebhook?(
    context: EyeConnectorContext,
    headers: Record<string, string>,
    body: unknown,
  ): Promise<EyeRawObservation[]>;
}
