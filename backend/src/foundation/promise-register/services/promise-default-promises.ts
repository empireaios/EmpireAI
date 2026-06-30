import type { KingPromise } from "../models/king-promise.js";
import { CANONICAL_PROMISE_IDS } from "../models/king-promise.js";
import { CANONICAL_ENTITY_IDS } from "../../identity-registry/models/identity-entity.js";

function kingPromise(
  input: Omit<KingPromise, "createdAt" | "updatedAt" | "fulfilledAt"> & { fulfilledAt?: string },
): KingPromise {
  const timestamp = new Date().toISOString();
  return {
    ...input,
    fulfilledAt: input.fulfilledAt,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** Default promises made to the King — register seeds, never deletes. */
export function createDefaultPromises(workspaceId: string): KingPromise[] {
  const kingId = CANONICAL_ENTITY_IDS.GRAND_KINGS_ACCOUNT;

  return [
    kingPromise({
      promiseId: CANONICAL_PROMISE_IDS.REVENUE_TRUTH,
      workspaceId,
      title: "Revenue Truth to King",
      statement:
        "Every revenue claim presented to Grand King will be ledger-backed with auditable financial truth.",
      madeToKingId: kingId,
      status: "IN_PROGRESS",
      progressPercent: 40,
      progressNotes: "First revenue validation loop in progress",
      dependencies: ["promise:empire-protection-to-king"],
      version: 1,
      metadata: { mission: "S001-S006", tier: "core" },
    }),
    kingPromise({
      promiseId: CANONICAL_PROMISE_IDS.LIVING_SOUL,
      workspaceId,
      title: "Living Soul to King",
      statement:
        "The Soul File will remain a living record of identity, continuity, and operational memory — never static.",
      madeToKingId: kingId,
      status: "IN_PROGRESS",
      progressPercent: 75,
      progressNotes: "Soul File, Runtime, and Identity foundations complete",
      dependencies: [],
      version: 1,
      metadata: { mission: "S001-S004", tier: "foundation" },
    }),
    kingPromise({
      promiseId: CANONICAL_PROMISE_IDS.EMPIRE_PROTECTION,
      workspaceId,
      title: "Empire Protection to King",
      statement:
        "No destructive live action will execute without governance clearance and founder approval.",
      madeToKingId: kingId,
      status: "FULFILLED",
      progressPercent: 100,
      progressNotes: "Governance, Doctrine, and Policy engines enforce protection",
      dependencies: [],
      fulfilledAt: new Date().toISOString(),
      version: 1,
      metadata: { mission: "S003-S006", tier: "core" },
    }),
  ];
}
