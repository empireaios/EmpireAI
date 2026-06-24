import type { SignalSource } from "../models/signal-source.js";
import type {
  GlobalProductSignal,
  GlobalProductSignalCreateInput,
  GlobalProductSignalUpdateInput,
} from "../models/product-signal.js";

export type ProductSignalRegistryQuery = {
  workspaceId: string;
  productId?: string;
  source?: SignalSource;
  minStrength?: number;
  minConfidence?: number;
  since?: string;
  limit?: number;
  offset?: number;
};

/** Shared registry contract for global product signals collected by the Eye. */
export interface ProductSignalRegistry {
  register(workspaceId: string, input: GlobalProductSignalCreateInput): Promise<GlobalProductSignal>;
  getById(workspaceId: string, signalId: string): Promise<GlobalProductSignal | null>;
  update(
    workspaceId: string,
    signalId: string,
    input: GlobalProductSignalUpdateInput,
  ): Promise<GlobalProductSignal>;
  delete(workspaceId: string, signalId: string): Promise<boolean>;
  list(query: ProductSignalRegistryQuery): Promise<GlobalProductSignal[]>;
}
