/**
 * Global Product Signal module — shared Eye evidence registry.
 */

import type { GlobalProductSignal, GlobalProductSignalCreateInput } from "../models/product-signal.js";
import type { SignalSource } from "../models/signal-source.js";
import type { ProductSignalRegistry } from "../repositories/product-signal-registry.js";
import { createInMemoryProductSignalRegistry } from "../repositories/in-memory-product-signal-registry.js";
import {
  normalizeProductSignalInput,
  type RawProductSignalInput,
} from "../utilities/signal-normalization.js";

export const GLOBAL_PRODUCT_SIGNAL_MODULE_ID = "global-product-signals" as const;
export type GlobalProductSignalModuleId = typeof GLOBAL_PRODUCT_SIGNAL_MODULE_ID;

export const GLOBAL_PRODUCT_SIGNAL_MODULE_VERSION = "0.1.0" as const;

export type GlobalProductSignalCapability =
  | "global-product-signals.register"
  | "global-product-signals.normalize"
  | "global-product-signals.list"
  | "global-product-signals.get";

export const GLOBAL_PRODUCT_SIGNAL_CAPABILITIES: readonly GlobalProductSignalCapability[] = [
  "global-product-signals.register",
  "global-product-signals.normalize",
  "global-product-signals.list",
  "global-product-signals.get",
] as const;

export type GlobalProductSignalModuleContract = {
  moduleId: GlobalProductSignalModuleId;
  version: string;
  capabilities: readonly GlobalProductSignalCapability[];
};

export const GLOBAL_PRODUCT_SIGNAL_MODULE_CONTRACT: GlobalProductSignalModuleContract = {
  moduleId: GLOBAL_PRODUCT_SIGNAL_MODULE_ID,
  version: GLOBAL_PRODUCT_SIGNAL_MODULE_VERSION,
  capabilities: GLOBAL_PRODUCT_SIGNAL_CAPABILITIES,
};

/** Orchestrates global product signal registration and retrieval. */
export class GlobalProductSignalModule {
  readonly contract = GLOBAL_PRODUCT_SIGNAL_MODULE_CONTRACT;

  constructor(private readonly registry: ProductSignalRegistry) {}

  normalize(raw: RawProductSignalInput): GlobalProductSignalCreateInput {
    return normalizeProductSignalInput(raw);
  }

  async register(workspaceId: string, input: GlobalProductSignalCreateInput): Promise<GlobalProductSignal> {
    return this.registry.register(workspaceId, input);
  }

  async normalizeAndRegister(
    workspaceId: string,
    raw: RawProductSignalInput,
  ): Promise<GlobalProductSignal> {
    return this.registry.register(workspaceId, this.normalize(raw));
  }

  async getSignal(workspaceId: string, signalId: string): Promise<GlobalProductSignal | null> {
    return this.registry.getById(workspaceId, signalId);
  }

  async listSignals(
    workspaceId: string,
    filters: {
      productId?: string;
      source?: SignalSource;
      minConfidence?: number;
    } = {},
  ): Promise<GlobalProductSignal[]> {
    return this.registry.list({ workspaceId, ...filters });
  }
}

/** Factory for a global product signal module with optional custom registry. */
export function createGlobalProductSignalModule(
  registry: ProductSignalRegistry = createInMemoryProductSignalRegistry(),
): GlobalProductSignalModule {
  return new GlobalProductSignalModule(registry);
}

export const globalProductSignalModule = createGlobalProductSignalModule();
