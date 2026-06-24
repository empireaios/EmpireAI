import { randomUUID } from "node:crypto";
import type { EyeConnector } from "../../contract/eye-connector.js";
import type {
  EyeConnectorContext,
  EyeConnectorDefinition,
  EyeConnectorHealth,
  EyeObserveRequest,
  EyeRawObservation,
  EyeSignalDomain,
} from "../../types.js";

export type MockConnectorOptions = {
  providerId?: string;
  providerName?: string;
  supportedDomains?: readonly EyeSignalDomain[];
  defaultPollIntervalSec?: number;
  rateLimitPerMinute?: number;
  /** When set, observe() throws until failureCount exhausted (for retry tests). */
  failForAttempts?: number;
  /** Deterministic product payload builder. */
  buildPayload?: (
    context: EyeConnectorContext,
    request: EyeObserveRequest,
  ) => Record<string, unknown>;
};

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function seededValue(seed: number, min: number, max: number): number {
  const normalized = (seed % 10_000) / 10_000;
  return Math.round(min + normalized * (max - min));
}

function defaultBuildPayload(
  context: EyeConnectorContext,
  request: EyeObserveRequest,
): Record<string, unknown> {
  const query = request.query;
  const productTitle = String(query.productTitle ?? "Mock Product");
  const category = String(query.category ?? "General");
  const seed = hashSeed(`${context.workspaceId}:${productTitle}:${category}`);
  const demandIndex = seededValue(seed, 30, 95);
  const competitionIndex = seededValue(seed + 11, 20, 90);
  const marginEstimatePct = seededValue(seed + 23, 15, 65);

  return {
    providerName: "Mock Eye Connector",
    productTitle,
    category,
    demandIndex,
    competitionIndex,
    marginEstimatePct,
    estimatedSellingPriceCents: seededValue(seed + 7, 999, 9999),
    monthlyOrdersEstimate: seededValue(seed + 19, 50, 5000),
    trendDirection: seed % 3 === 0 ? "rising" : seed % 3 === 1 ? "stable" : "falling",
    listingCount: seededValue(seed + 31, 10, 500),
    avgRating: seededValue(seed + 41, 35, 50) / 10,
  };
}

/** Deterministic mock EyeConnector for testing and plug-in pattern demos. */
export class MockEyeConnector implements EyeConnector {
  readonly definition: EyeConnectorDefinition;
  private connectedWorkspaces = new Set<string>();
  private attemptCount = 0;
  private readonly failForAttempts: number;
  private readonly buildPayload: (
    context: EyeConnectorContext,
    request: EyeObserveRequest,
  ) => Record<string, unknown>;

  constructor(options: MockConnectorOptions = {}) {
    const providerId = options.providerId ?? "mock-eye";
    this.definition = {
      providerId,
      providerName: options.providerName ?? "Mock Eye Connector",
      supportedDomains: options.supportedDomains ?? ["product", "trend"],
      observationMode: "poll",
      defaultPollIntervalSec: options.defaultPollIntervalSec ?? 3600,
      rateLimitPerMinute: options.rateLimitPerMinute ?? 60,
    };
    this.failForAttempts = options.failForAttempts ?? 0;
    this.buildPayload = options.buildPayload ?? defaultBuildPayload;
  }

  async connect(context: EyeConnectorContext, _credentialsRef: string): Promise<void> {
    this.connectedWorkspaces.add(context.workspaceId);
  }

  async disconnect(context: EyeConnectorContext): Promise<void> {
    this.connectedWorkspaces.delete(context.workspaceId);
  }

  async healthCheck(context: EyeConnectorContext): Promise<EyeConnectorHealth> {
    const connected = this.connectedWorkspaces.has(context.workspaceId);
    return {
      status: connected ? "active" : "registered",
      healthState: connected ? "healthy" : "unknown",
      message: connected ? "Mock connector active" : "Mock connector not connected",
      checkedAt: new Date().toISOString(),
    };
  }

  async observe(
    context: EyeConnectorContext,
    request: EyeObserveRequest,
  ): Promise<EyeRawObservation[]> {
    if (!this.definition.supportedDomains.includes(request.domain)) {
      return [];
    }

    this.attemptCount += 1;
    if (this.attemptCount <= this.failForAttempts) {
      throw new Error(`Mock connector simulated failure (attempt ${this.attemptCount})`);
    }

    const fetchedAt = new Date().toISOString();
    const payload = this.buildPayload(context, request);

    return [
      {
        observationId: randomUUID(),
        providerId: this.definition.providerId,
        domain: request.domain,
        payload,
        fetchedAt,
        mock: true,
        sourceRef: `mock://${this.definition.providerId}/observe`,
      },
    ];
  }

  getAttemptCount(): number {
    return this.attemptCount;
  }

  resetAttemptCount(): void {
    this.attemptCount = 0;
  }
}

export function createMockEyeConnector(options?: MockConnectorOptions): EyeConnector {
  return new MockEyeConnector(options);
}
