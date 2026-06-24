import type { EyeConnector } from "../contract/eye-connector.js";
import type { EyeProviderId } from "../types.js";

export type RegisteredConnector = {
  connector: EyeConnector;
  registeredAt: string;
};

/** In-memory registry for EyeConnector instances — workspace scope applied at poll time. */
export class EyeConnectorRegistry {
  private readonly connectors = new Map<EyeProviderId, RegisteredConnector>();

  register(connector: EyeConnector): void {
    const { providerId } = connector.definition;
    if (this.connectors.has(providerId)) {
      throw new Error(`Eye connector already registered: ${providerId}`);
    }
    this.connectors.set(providerId, {
      connector,
      registeredAt: new Date().toISOString(),
    });
  }

  unregister(providerId: EyeProviderId): boolean {
    return this.connectors.delete(providerId);
  }

  get(providerId: EyeProviderId): EyeConnector | undefined {
    return this.connectors.get(providerId)?.connector;
  }

  require(providerId: EyeProviderId): EyeConnector {
    const connector = this.get(providerId);
    if (!connector) {
      throw new Error(`Unknown Eye connector: ${providerId}`);
    }
    return connector;
  }

  list(): EyeConnector[] {
    return [...this.connectors.values()].map((entry) => entry.connector);
  }

  listProviderIds(): EyeProviderId[] {
    return [...this.connectors.keys()];
  }

  has(providerId: EyeProviderId): boolean {
    return this.connectors.has(providerId);
  }

  clear(): void {
    this.connectors.clear();
  }
}

export const defaultEyeConnectorRegistry = new EyeConnectorRegistry();
