/**
 * Supplier Connector Framework module — prepares EmpireAI for live supplier integrations.
 */

import {
  SupplierConnectorFrameworkEngine,
  defaultSupplierConnectorFrameworkEngine,
  type PrepareSupplierConnectorInput,
} from "../engines/supplier-connector-framework-engine.js";
import type { SupplierConnectorRecord } from "../models/supplier-connector-record.js";
import {
  prepareAllSupplierConnectors,
  prepareSupplierConnector,
  supplierConnectorScoring,
} from "../scoring/supplier-connector-scoring.js";
import type {
  SupplierConnectorFrameworkRepository,
  SupplierConnectorFrameworkRepositoryQuery,
} from "../repositories/supplier-connector-framework-repository.js";
import { createInMemorySupplierConnectorFrameworkRepository } from "../repositories/in-memory-supplier-connector-framework-repository.js";

export const SUPPLIER_CONNECTOR_FRAMEWORK_MODULE_ID = "supplier-connector-framework" as const;
export type SupplierConnectorFrameworkModuleId =
  typeof SUPPLIER_CONNECTOR_FRAMEWORK_MODULE_ID;

export const SUPPLIER_CONNECTOR_FRAMEWORK_MODULE_VERSION = "0.1.0" as const;

export type SupplierConnectorFrameworkCapability =
  | "supplier-connector-framework.prepare"
  | "supplier-connector-framework.score"
  | "supplier-connector-framework.persist"
  | "supplier-connector-framework.list";

export const SUPPLIER_CONNECTOR_FRAMEWORK_CAPABILITIES: readonly SupplierConnectorFrameworkCapability[] =
  [
    "supplier-connector-framework.prepare",
    "supplier-connector-framework.score",
    "supplier-connector-framework.persist",
    "supplier-connector-framework.list",
  ] as const;

export type SupplierConnectorFrameworkModuleContract = {
  moduleId: SupplierConnectorFrameworkModuleId;
  version: string;
  capabilities: readonly SupplierConnectorFrameworkCapability[];
};

export const SUPPLIER_CONNECTOR_FRAMEWORK_MODULE_CONTRACT: SupplierConnectorFrameworkModuleContract =
  {
    moduleId: SUPPLIER_CONNECTOR_FRAMEWORK_MODULE_ID,
    version: SUPPLIER_CONNECTOR_FRAMEWORK_MODULE_VERSION,
    capabilities: SUPPLIER_CONNECTOR_FRAMEWORK_CAPABILITIES,
  };

/** Orchestrates supplier connector preparation and persistence. */
export class SupplierConnectorFrameworkModule {
  readonly contract = SUPPLIER_CONNECTOR_FRAMEWORK_MODULE_CONTRACT;
  private readonly engine: SupplierConnectorFrameworkEngine;

  constructor(
    private readonly repository: SupplierConnectorFrameworkRepository,
    engine?: SupplierConnectorFrameworkEngine,
  ) {
    this.engine = engine ?? new SupplierConnectorFrameworkEngine(repository);
  }

  prepareSupplierConnector = prepareSupplierConnector;
  prepareAllSupplierConnectors = prepareAllSupplierConnectors;
  scoring = supplierConnectorScoring;

  prepareConnector(input: PrepareSupplierConnectorInput) {
    return this.engine.prepareConnector(input);
  }

  async persistConnector(
    workspaceId: string,
    input: PrepareSupplierConnectorInput,
  ): Promise<SupplierConnectorRecord> {
    return this.engine.prepareAndSave(workspaceId, input);
  }

  async getConnectorRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<SupplierConnectorRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getConnectorByPlatform(
    workspaceId: string,
    platform: PrepareSupplierConnectorInput["platform"],
  ): Promise<SupplierConnectorRecord | null> {
    return this.repository.getByPlatform(workspaceId, platform);
  }

  async listConnectorRecords(
    workspaceId: string,
    filters: Omit<SupplierConnectorFrameworkRepositoryQuery, "workspaceId"> = {},
  ): Promise<SupplierConnectorRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a supplier connector framework module with optional custom dependencies. */
export function createSupplierConnectorFrameworkModule(
  repository: SupplierConnectorFrameworkRepository = createInMemorySupplierConnectorFrameworkRepository(),
  engine?: SupplierConnectorFrameworkEngine,
): SupplierConnectorFrameworkModule {
  return new SupplierConnectorFrameworkModule(
    repository,
    engine ?? new SupplierConnectorFrameworkEngine(repository),
  );
}

export const supplierConnectorFrameworkModule = createSupplierConnectorFrameworkModule();

export type { PrepareSupplierConnectorInput };

export { defaultSupplierConnectorFrameworkEngine };
