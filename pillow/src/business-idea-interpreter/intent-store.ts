import type { StructuredBusinessIntent } from "./types.js";

/** Authoritative in-memory Business Idea Interpreter store — interpret only. */
export class IntentStore {
  private intents = new Map<string, StructuredBusinessIntent>();
  private latestIntentId: string | null = null;

  seed(intents: StructuredBusinessIntent[]) {
    this.intents.clear();
    this.latestIntentId = null;
    for (const intent of intents) {
      this.intents.set(intent.intentId, clone(intent));
      this.latestIntentId = intent.intentId;
    }
  }

  count() {
    return this.intents.size;
  }

  list() {
    return [...this.intents.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(intentId: string) {
    const intent = this.intents.get(intentId);
    return intent ? clone(intent) : null;
  }

  getLatestIntentId() {
    return this.latestIntentId;
  }

  save(intent: StructuredBusinessIntent) {
    this.intents.set(intent.intentId, clone(intent));
    this.latestIntentId = intent.intentId;
    return clone(intent);
  }
}

function clone(intent: StructuredBusinessIntent): StructuredBusinessIntent {
  return {
    ...intent,
    constraints: [...intent.constraints],
    missingInformation: [...intent.missingInformation],
  };
}
