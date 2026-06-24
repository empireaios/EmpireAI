import type { SignalSource } from "../../global-product-signals/models/signal-source.js";
import type {
  SourceTrustProfile,
  SourceTrustProfileCreateInput,
} from "../models/source-trust-profile.js";
import type { TrustTier } from "../models/source-trust-profile.js";

export type SourceTrustRepositoryQuery = {
  workspaceId: string;
  source?: SignalSource;
  trustTier?: TrustTier;
  minTrustScore?: number;
  limit?: number;
  offset?: number;
};

/** Persists source trust profiles. */
export interface SourceTrustRepository {
  save(workspaceId: string, input: SourceTrustProfileCreateInput): Promise<SourceTrustProfile>;
  getBySource(workspaceId: string, source: SignalSource): Promise<SourceTrustProfile | null>;
  getById(workspaceId: string, profileId: string): Promise<SourceTrustProfile | null>;
  list(query: SourceTrustRepositoryQuery): Promise<SourceTrustProfile[]>;
  delete(workspaceId: string, profileId: string): Promise<boolean>;
}
