import { nextApirtId } from "./api-store.js";
import type { ApiStore } from "./api-store.js";
import { APIRT_METADATA_VERSION } from "./paths.js";
import type { ApiConnection, ApirtInput } from "./types.js";

export class ConnectionManager {
  openConnection(store: ApiStore, input: ApirtInput): ApiConnection | null {
    const apiId = input.apiId;
    if (!apiId) return null;
    const provider = store.getProvider(apiId);
    if (!provider) return null;

    const connection: ApiConnection = {
      connectionId: nextApirtId("apirt-conn"),
      apiId,
      provider: provider.provider,
      status: "connected",
      openedAt: new Date().toISOString(),
      closedAt: null,
      credentialReference: provider.credentialReference,
      metadataVersion: APIRT_METADATA_VERSION,
      structuralSignalOnly: true,
      fabricated: false,
    };
    store.saveConnection(connection);
    store.updateProvider(apiId, { connectionStatus: "connected" });
    return store.getConnection(connection.connectionId)!;
  }

  closeConnection(store: ApiStore, input: ApirtInput): ApiConnection | null {
    const connectionId = input.connectionId;
    if (!connectionId) return null;
    const existing = store.getConnection(connectionId);
    if (!existing) return null;
    const closed = store.updateConnection(connectionId, {
      status: "closed",
      closedAt: new Date().toISOString(),
    });
    if (closed) {
      store.updateProvider(closed.apiId, { connectionStatus: "closed" });
    }
    return closed;
  }

  listConnections(store: ApiStore) {
    return store.listConnections();
  }

  listActiveConnections(store: ApiStore) {
    return store.listActiveConnections();
  }
}
