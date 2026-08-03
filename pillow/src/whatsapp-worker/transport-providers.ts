import type { DeliveryOutcome, EvidenceMode, WhatsAppInput } from "./types.js";

export type TransportSendRequest = {
  conversationId: string;
  messageBody: string;
  customerReference: string;
  templateId: string | null;
  evidenceMode: EvidenceMode;
  deliveryFixture?: WhatsAppInput["deliveryFixture"];
};

export type TransportSendResult = {
  deliveryOutcome: DeliveryOutcome;
  evidenceMode: EvidenceMode;
};

/** Modular WhatsApp transport provider interface. */
export interface WhatsAppTransportProvider {
  readonly providerId: string;
  readonly evidenceMode: EvidenceMode;
  send(request: TransportSendRequest): TransportSendResult;
}

/**
 * Fixture provider — delivery results ONLY from observed fixture outcomes.
 * Never hard-codes successful delivery; absent fixture → unknown/failed.
 */
export class FixtureTransportProvider implements WhatsAppTransportProvider {
  readonly providerId = "fixture-whatsapp-transport";
  readonly evidenceMode: EvidenceMode = "fixture";

  send(request: TransportSendRequest): TransportSendResult {
    const fixture = request.deliveryFixture;
    const now = new Date().toISOString();
    if (!fixture || typeof fixture.passed !== "boolean") {
      return {
        evidenceMode: "fixture",
        deliveryOutcome: {
          passed: false,
          observed: true,
          provider: "fixture",
          reason: "no_fixture_delivery_result_observed",
          observedAt: now,
          transportMessageId: null,
        },
      };
    }
    return {
      evidenceMode: "fixture",
      deliveryOutcome: {
        passed: fixture.passed,
        observed: true,
        provider: "fixture",
        reason: fixture.reason?.trim() || (fixture.passed ? "fixture_observed_pass" : "fixture_observed_fail"),
        observedAt: now,
        transportMessageId: fixture.transportMessageId ?? (fixture.passed ? `fixture-tx-${Date.now()}` : null),
      },
    };
  }
}

/** Optional sandbox/mock provider — still requires an observed sandbox outcome. */
export class SandboxTransportProvider implements WhatsAppTransportProvider {
  readonly providerId = "sandbox-whatsapp-transport";
  readonly evidenceMode: EvidenceMode = "sandbox";
  private outcomes = new Map<string, { passed: boolean; reason?: string; transportMessageId?: string | null }>();

  setOutcome(
    key: string,
    outcome: { passed: boolean; reason?: string; transportMessageId?: string | null },
  ) {
    this.outcomes.set(key, outcome);
    return this;
  }

  send(request: TransportSendRequest): TransportSendResult {
    const now = new Date().toISOString();
    const key = `${request.conversationId}:${request.customerReference}`;
    const observed = this.outcomes.get(key) ?? this.outcomes.get(request.customerReference);
    if (!observed) {
      return {
        evidenceMode: "sandbox",
        deliveryOutcome: {
          passed: false,
          observed: true,
          provider: "sandbox",
          reason: "no_sandbox_delivery_result_observed",
          observedAt: now,
          transportMessageId: null,
        },
      };
    }
    return {
      evidenceMode: "sandbox",
      deliveryOutcome: {
        passed: observed.passed,
        observed: true,
        provider: "sandbox",
        reason: observed.reason ?? (observed.passed ? "sandbox_observed_pass" : "sandbox_observed_fail"),
        observedAt: now,
        transportMessageId: observed.transportMessageId ?? null,
      },
    };
  }
}

/**
 * Live provider interface stub — NEVER claims success without an observed transport result.
 * Without a live adapter binding, all sends report unknown/failed honestly.
 */
export class LiveTransportProviderStub implements WhatsAppTransportProvider {
  readonly providerId = "live-whatsapp-transport-stub";
  readonly evidenceMode: EvidenceMode = "live";

  send(_request: TransportSendRequest): TransportSendResult {
    const now = new Date().toISOString();
    return {
      evidenceMode: "live",
      deliveryOutcome: {
        passed: false,
        observed: true,
        provider: "live",
        reason: "live_transport_not_bound_no_observed_result",
        observedAt: now,
        transportMessageId: null,
      },
    };
  }
}

export function resolveTransportProvider(
  evidenceMode: EvidenceMode,
  overrides?: {
    fixture?: FixtureTransportProvider;
    sandbox?: SandboxTransportProvider;
    live?: WhatsAppTransportProvider;
  },
): WhatsAppTransportProvider {
  if (evidenceMode === "sandbox") {
    return overrides?.sandbox ?? new SandboxTransportProvider();
  }
  if (evidenceMode === "live" || evidenceMode === "cached") {
    return overrides?.live ?? new LiveTransportProviderStub();
  }
  return overrides?.fixture ?? new FixtureTransportProvider();
}
