import { randomUUID } from "node:crypto";

import type { CompetitorAlert } from "../models/competitor-alert.js";
import type { CompetitorChange } from "../models/competitor-change.js";
import type { CompetitorChangeType } from "../models/competitor-change-types.js";

const PRICE_THRESHOLD_PERCENT = 3;
const REVIEW_COUNT_THRESHOLD = 5;
const REVIEW_RATING_THRESHOLD = 0.2;
const BESTSELLER_RANK_THRESHOLD = 5;

function resolveSeverity(
  changeType: CompetitorChangeType,
  magnitude: number,
): CompetitorAlert["severity"] {
  if (changeType === "PRICE_CHANGE" && magnitude >= 10) return "HIGH";
  if (changeType === "OFFER" || changeType === "CREATIVE_CHANGE") return "HIGH";
  if (changeType === "BEST_SELLER" && magnitude >= 10) return "HIGH";
  if (magnitude >= 8) return "MEDIUM";
  return "LOW";
}

function buildAlertTitle(change: CompetitorChange): string {
  switch (change.changeType) {
    case "PRICE_CHANGE":
      return `${change.competitorName} price ${change.magnitude >= 0 ? "increased" : "decreased"} ${Math.abs(change.magnitude).toFixed(1)}%`;
    case "CREATIVE_CHANGE":
      return `${change.competitorName} updated ad creative`;
    case "LANDING_PAGE":
      return `${change.competitorName} changed landing page`;
    case "OFFER":
      return `${change.competitorName} updated offer`;
    case "REVIEW":
      return `${change.competitorName} review activity changed`;
    case "BEST_SELLER":
      return `${change.competitorName} bestseller rank shifted`;
  }
}

function buildAlertDescription(change: CompetitorChange): string {
  return `${change.previousValue} → ${change.newValue}`;
}

/** Generates alerts from detected competitor changes. */
export function generateAlertsFromChanges(changes: CompetitorChange[]): CompetitorAlert[] {
  return changes.map((change) => ({
    alertId: randomUUID(),
    changeId: change.changeId,
    competitorId: change.competitorId,
    competitorName: change.competitorName,
    changeType: change.changeType,
    severity: resolveSeverity(change.changeType, change.magnitude),
    title: buildAlertTitle(change),
    description: buildAlertDescription(change),
    acknowledged: false as const,
    createdAt: change.detectedAt,
  }));
}

/** Detects changes between previous and current competitor snapshots. */
export function detectChanges(
  previous: import("../models/competitor-snapshot.js").CompetitorSnapshot | null,
  current: import("../models/competitor-snapshot.js").CompetitorSnapshot,
): CompetitorChange[] {
  if (!previous) return [];

  const changes: CompetitorChange[] = [];
  const detectedAt = current.capturedAt;

  const addChange = (
    changeType: CompetitorChangeType,
    previousValue: string,
    newValue: string,
    magnitude: number,
  ) => {
    changes.push({
      changeId: randomUUID(),
      competitorId: current.competitorId,
      competitorName: current.competitorName,
      changeType,
      previousValue,
      newValue,
      magnitude: Math.abs(magnitude),
      detectedAt,
      snapshotId: current.snapshotId,
      observationId: current.observationId,
    });
  };

  if (previous.price !== current.price) {
    const magnitude =
      previous.price > 0 ? ((current.price - previous.price) / previous.price) * 100 : 0;
    if (Math.abs(magnitude) >= PRICE_THRESHOLD_PERCENT) {
      addChange(
        "PRICE_CHANGE",
        `$${previous.price.toFixed(2)}`,
        `$${current.price.toFixed(2)}`,
        magnitude,
      );
    }
  }

  if (previous.creativeHash !== current.creativeHash) {
    addChange(
      "CREATIVE_CHANGE",
      previous.creativeSummary,
      current.creativeSummary,
      100,
    );
  }

  if (previous.landingPageHash !== current.landingPageHash) {
    addChange(
      "LANDING_PAGE",
      previous.landingPageUrl,
      current.landingPageUrl,
      100,
    );
  }

  if (previous.offerText !== current.offerText) {
    addChange("OFFER", previous.offerText, current.offerText, 100);
  }

  const reviewCountDelta = current.reviewCount - previous.reviewCount;
  const reviewRatingDelta = current.reviewRating - previous.reviewRating;
  if (
    Math.abs(reviewCountDelta) >= REVIEW_COUNT_THRESHOLD ||
    Math.abs(reviewRatingDelta) >= REVIEW_RATING_THRESHOLD
  ) {
    addChange(
      "REVIEW",
      `${previous.reviewCount} reviews @ ${previous.reviewRating}`,
      `${current.reviewCount} reviews @ ${current.reviewRating}`,
      Math.max(Math.abs(reviewCountDelta), Math.abs(reviewRatingDelta) * 10),
    );
  }

  const prevRank = previous.bestsellerRank;
  const currRank = current.bestsellerRank;
  if (prevRank !== currRank) {
    const magnitude =
      prevRank && currRank ? Math.abs(currRank - prevRank) : BESTSELLER_RANK_THRESHOLD + 1;
    if (magnitude >= BESTSELLER_RANK_THRESHOLD || prevRank === null || currRank === null) {
      addChange(
        "BEST_SELLER",
        prevRank ? `#${prevRank} in ${previous.bestsellerCategory}` : "Not ranked",
        currRank ? `#${currRank} in ${current.bestsellerCategory}` : "Not ranked",
        magnitude,
      );
    }
  }

  return changes;
}

export const competitorChangeDetection = {
  detectChanges,
  generateAlertsFromChanges,
  PRICE_THRESHOLD_PERCENT,
};
