import type { ConnectorRegistryModule } from "../../connector-registry/contract/connector-registry-module.js";
import type { GlobalProductSignal } from "../../global-product-signals/models/product-signal.js";
import type { ProductSignalRegistry } from "../../global-product-signals/repositories/product-signal-registry.js";
import type { SignalSource } from "../../global-product-signals/models/signal-source.js";
import type { ProductEvidenceSummaryCreateInput } from "../../product-evidence-aggregation/models/product-evidence-summary.js";
import type { SourceTrustProfileCreateInput } from "../models/source-trust-profile.js";
import {
  scoreSourceTrust,
  sourceTrustScoring,
  type SourceTrustAnalysisInput,
} from "../scoring/source-trust-scoring.js";

export type SourceTrustEvaluationInput = {
  source: SignalSource;
  productId?: string;
  connectorId?: string;
  signals?: GlobalProductSignal[];
  evidenceSummary?: ProductEvidenceSummaryCreateInput | null;
};

/** Evaluates intelligence source trust from registry, signal, and evidence inputs. */
export class SourceTrustEngine {
  constructor(
    private readonly connectorRegistry: ConnectorRegistryModule,
    private readonly productSignalRegistry: ProductSignalRegistry,
  ) {}

  async evaluate(
    workspaceId: string,
    input: SourceTrustEvaluationInput,
  ): Promise<SourceTrustProfileCreateInput> {
    const signals =
      input.signals ??
      (await this.productSignalRegistry.list({
        workspaceId,
        source: input.source,
        productId: input.productId,
      }));

    const connectorId =
      input.connectorId ?? sourceTrustScoring.connectorIdBySource[input.source] ?? null;
    const connector = connectorId
      ? await this.connectorRegistry.getConnector(workspaceId, connectorId)
      : null;

    const analysisInput: SourceTrustAnalysisInput = {
      source: input.source,
      connectorId,
      connector,
      signals,
      evidenceSummary: input.evidenceSummary,
    };

    return scoreSourceTrust(analysisInput);
  }
}
