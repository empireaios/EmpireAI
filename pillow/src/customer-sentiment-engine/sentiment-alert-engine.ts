/** R4-10 — Sentiment alert engine. */

import type { CustomerSentimentEngineConfiguration } from "./configuration.js";
import type { SentimentAlert, SentimentRecord } from "./types.js";
import { SentimentMetadataGenerator } from "./sentiment-metadata-generator.js";
import { SentimentScoringEngine } from "./sentiment-scoring-engine.js";

export class SentimentAlertEngine {
  private readonly metadataGenerator = new SentimentMetadataGenerator();
  private readonly scoringEngine = new SentimentScoringEngine();

  generateAlerts(
    record: SentimentRecord,
    config: CustomerSentimentEngineConfiguration,
  ): SentimentAlert[] {
    if (!config.alertThresholdsEnabled) return [];

    const alerts: SentimentAlert[] = [];

    if (this.scoringEngine.isFrustrated(record, config.frustrationThreshold)) {
      alerts.push(
        this.metadataGenerator.buildAlert({
          sentimentRecordId: record.sentimentRecordId,
          customerId: record.customerId,
          alertType: "frustration",
          severity: "high",
          message: `Customer frustration detected (score ${record.sentimentScore})`,
        }),
      );
    }

    if (this.scoringEngine.isEscalationRisk(record, config.escalationThreshold)) {
      alerts.push(
        this.metadataGenerator.buildAlert({
          sentimentRecordId: record.sentimentRecordId,
          customerId: record.customerId,
          alertType: "escalation_risk",
          severity: "high",
          message: `Escalation risk detected (score ${record.sentimentScore})`,
        }),
      );
    }

    if (this.scoringEngine.isSatisfied(record, config.satisfactionThreshold)) {
      alerts.push(
        this.metadataGenerator.buildAlert({
          sentimentRecordId: record.sentimentRecordId,
          customerId: record.customerId,
          alertType: "satisfaction",
          severity: "low",
          message: `Customer satisfaction detected (score ${record.sentimentScore})`,
        }),
      );
    }

    if (this.scoringEngine.isPositiveExperience(record, config.satisfactionThreshold)) {
      alerts.push(
        this.metadataGenerator.buildAlert({
          sentimentRecordId: record.sentimentRecordId,
          customerId: record.customerId,
          alertType: "positive_experience",
          severity: "low",
          message: `Positive customer experience detected (score ${record.sentimentScore})`,
        }),
      );
    }

    for (const threshold of config.alertThresholds) {
      if (!threshold.enabled) continue;
      if (
        record.sentimentCategory === threshold.category &&
        record.sentimentScore >= threshold.minScore &&
        record.sentimentScore <= threshold.maxScore
      ) {
        const exists = alerts.some((a) => a.alertType.includes(threshold.category as never));
        if (!exists) {
          alerts.push(
            this.metadataGenerator.buildAlert({
              sentimentRecordId: record.sentimentRecordId,
              customerId: record.customerId,
              alertType:
                threshold.category === "frustrated"
                  ? "frustration"
                  : threshold.category === "escalation_risk"
                    ? "escalation_risk"
                    : threshold.category === "positive"
                      ? "positive_experience"
                      : "satisfaction",
              severity: threshold.severity,
              message: `Threshold alert: ${threshold.label}`,
            }),
          );
        }
      }
    }

    return alerts;
  }
}
