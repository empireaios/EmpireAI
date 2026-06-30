import type { SupplierConnectorRecord } from "../models/supplier-connector-record.js";
import type { SupplierConnectorFrameworkRepository } from "../repositories/supplier-connector-framework-repository.js";
import { enrichCjConnectorRecord } from "../live/cj-connector-health.js";
import {
  prepareSupplierConnector,
  type PrepareSupplierConnectorInput,
} from "../scoring/supplier-connector-scoring.js";

/** Prepares supplier connector profiles for future live integrations. */
export class SupplierConnectorFrameworkEngine {
  constructor(private readonly repository: SupplierConnectorFrameworkRepository) {}

  prepareConnector(input: PrepareSupplierConnectorInput) {
    return prepareSupplierConnector(input);
  }

  async prepareAndSave(
    workspaceId: string,
    input: PrepareSupplierConnectorInput,
  ): Promise<SupplierConnectorRecord> {
    let breakdown = prepareSupplierConnector(input);

    if (input.platform === "CJ_DROPSHIPPING") {
      breakdown = await enrichCjConnectorRecord(breakdown, input.credentialsConfigured ?? false);
    }

    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultSupplierConnectorFrameworkEngine = {
  prepareConnector: prepareSupplierConnector,
};

export type { PrepareSupplierConnectorInput };
