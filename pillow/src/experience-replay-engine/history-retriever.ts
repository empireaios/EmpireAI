import type {
  ExperienceReplayEngineInput,
  HistoricalExecutionEvent,
} from "./types.js";

/** Retrieves historical execution events for replay learning. */
export class HistoryRetriever {
  private catalog: HistoricalExecutionEvent[] = [];

  seed(events: HistoricalExecutionEvent[]) {
    this.catalog = events.map((e) => ({ ...e, factors: [...e.factors] }));
  }

  list() {
    return this.catalog.map((e) => ({ ...e, factors: [...e.factors] }));
  }

  retrieve(input: ExperienceReplayEngineInput): HistoricalExecutionEvent[] {
    const eventTypes = (input.eventTypes ?? []).map((t) => t.toLowerCase());
    const sources = (input.sources ?? []).map((s) => s.toLowerCase());
    const missionId = input.missionId?.trim().toLowerCase();
    const businessId = input.businessId?.trim().toLowerCase();

    return this.list().filter((event) => {
      if (missionId && event.missionId.toLowerCase() !== missionId) return false;
      if (businessId && event.businessId.toLowerCase() !== businessId) return false;
      if (eventTypes.length && !eventTypes.includes(String(event.eventType).toLowerCase())) return false;
      if (sources.length && !sources.includes(String(event.source).toLowerCase())) return false;
      if (input.includeGrandKingFeedback === true && !event.grandKingFeedback) return false;
      return true;
    });
  }

  byOutcome(outcome: string) {
    return this.list().filter((e) => String(e.outcome).toLowerCase() === outcome.toLowerCase());
  }

  withGrandKingFeedback() {
    return this.list().filter((e) => Boolean(e.grandKingFeedback?.trim()));
  }
}
