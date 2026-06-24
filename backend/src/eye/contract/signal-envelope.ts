import type { EyeProviderId, EyeSignalDomain } from "../types.js";
import type { ProductSignal } from "./product-signal.js";

export type ConfidenceFactor = {
  name: string;
  weight: number;
  value: number;
  explanation: string;
};

export type EyeSignalEnvelope<TPayload = Record<string, unknown>> = {
  envelopeId: string;
  workspaceId: string;
  domain: EyeSignalDomain;
  providerId: EyeProviderId;
  providerName: string;
  subjectKey: string;
  payload: TPayload;
  confidence: number;
  confidenceFactors: ConfidenceFactor[];
  provenance: {
    observationIds: string[];
    mock: boolean;
    fetchedAt: string;
    sourceRefs: string[];
  };
  normalizedAt: string;
};

export type ProductSignalEnvelope = EyeSignalEnvelope<ProductSignal>;
