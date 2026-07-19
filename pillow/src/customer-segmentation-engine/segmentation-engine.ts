/** R4-16 — Segmentation Engine. */

import type { CustomerSegmentationEngineConfiguration } from "./configuration.js";
import type { CustomerSegmentSignals, SegmentationClassification, SegmentType } from "./types.js";

export class SegmentationEngine {
  classifyByType(
    signals: CustomerSegmentSignals,
    segmentType: SegmentType,
    config: CustomerSegmentationEngineConfiguration,
  ): { segments: string[]; confidence: number } {
    if (!config.segmentationRulesEnabled) {
      return { segments: [], confidence: 0 };
    }

    const segments: string[] = [];
    let confidence = 50;

    switch (segmentType) {
      case "demographics":
        if (signals.hasEmail) {
          segments.push("contactable");
          confidence += 10;
        }
        if (signals.customerOwner) {
          segments.push("assigned_owner");
          confidence += 5;
        }
        break;
      case "purchasing":
        if (signals.purchaseCount >= config.frequentPurchaseThreshold) {
          segments.push("frequent_buyer");
          confidence += 20;
        } else if (signals.purchaseCount >= 1) {
          segments.push("active_buyer");
          confidence += 10;
        } else {
          segments.push("prospect");
        }
        break;
      case "value":
        if (signals.lifetimeValue >= config.highValueClvThreshold * 2) {
          segments.push("premium_value");
          confidence += 25;
        } else if (signals.lifetimeValue >= config.highValueClvThreshold) {
          segments.push("high_value");
          confidence += 20;
        } else {
          segments.push("standard_value");
        }
        break;
      case "loyalty":
        if (signals.loyaltyTier === "platinum" || signals.loyaltyTier === "gold") {
          segments.push("loyal_member");
          confidence += 20;
        } else if (signals.loyaltyTier === "silver") {
          segments.push("emerging_loyalty");
          confidence += 10;
        } else if (signals.loyaltyPoints > 0) {
          segments.push("loyalty_enrolled");
          confidence += 5;
        }
        break;
      case "sentiment":
        if (signals.negativeSentimentCount >= 2) {
          segments.push("negative_sentiment");
          confidence += 15;
        } else if (signals.avgSentimentScore >= 60) {
          segments.push("positive_sentiment");
          confidence += 15;
        } else {
          segments.push("neutral_sentiment");
        }
        break;
      case "risk":
        if (signals.riskScore >= config.highRiskScoreThreshold) {
          segments.push("at_risk");
          confidence += 20;
        } else if (signals.riskScore >= 40) {
          segments.push("moderate_risk");
          confidence += 10;
        } else {
          segments.push("low_risk");
        }
        break;
      case "behaviour":
        if (signals.purchaseCount === 0 && signals.timelineEventCount <= 1) {
          segments.push("new_customer");
        } else if (signals.purchaseCount >= config.frequentPurchaseThreshold) {
          segments.push("frequent_buyer");
          confidence += 15;
        } else if (signals.timelineEventCount === 0) {
          segments.push("dormant");
        }
        break;
      default:
        break;
    }

    for (const rule of config.segmentationRules) {
      if (!rule.enabled || rule.segmentType !== segmentType) continue;
      if (segments.includes(rule.segmentName) && confidence >= rule.minConfidence) {
        confidence = Math.max(confidence, rule.minConfidence);
      }
    }

    return { segments, confidence: Math.min(100, confidence) };
  }

  buildComposite(
    signals: CustomerSegmentSignals,
    config: CustomerSegmentationEngineConfiguration,
  ): SegmentationClassification {
    const types: SegmentType[] = [
      "demographics",
      "purchasing",
      "value",
      "loyalty",
      "sentiment",
      "risk",
      "behaviour",
    ];
    const assignedSegments = new Set<string>();
    let totalConfidence = 0;

    for (const type of types) {
      const result = this.classifyByType(signals, type, config);
      for (const seg of result.segments) assignedSegments.add(seg);
      totalConfidence += result.confidence;
    }

    const segmentConfidence = Math.round(totalConfidence / types.length);

    return {
      assignedSegments: [...assignedSegments],
      behaviourProfile: this.resolveBehaviourProfile(signals, config),
      loyaltyTier: signals.loyaltyTier || "bronze",
      customerValueTier: this.resolveValueTier(signals, config),
      riskTier: this.resolveRiskTier(signals),
      segmentConfidence,
    };
  }

  private resolveBehaviourProfile(
    signals: CustomerSegmentSignals,
    config: CustomerSegmentationEngineConfiguration,
  ): SegmentationClassification["behaviourProfile"] {
    if (signals.riskScore >= config.highRiskScoreThreshold) return "at_risk";
    if (signals.purchaseCount >= config.frequentPurchaseThreshold) return "frequent_buyer";
    if (signals.purchaseCount === 0 && signals.timelineEventCount <= 1) return "new_customer";
    if (signals.timelineEventCount === 0) return "dormant";
    if (signals.avgSentimentScore >= 70 && signals.loyaltyPoints >= 100) return "loyal_advocate";
    return "occasional_buyer";
  }

  private resolveValueTier(
    signals: CustomerSegmentSignals,
    config: CustomerSegmentationEngineConfiguration,
  ): SegmentationClassification["customerValueTier"] {
    if (signals.lifetimeValue >= config.highValueClvThreshold * 2) return "premium";
    if (signals.lifetimeValue >= config.highValueClvThreshold) return "high";
    return "standard";
  }

  private resolveRiskTier(signals: CustomerSegmentSignals): SegmentationClassification["riskTier"] {
    if (signals.riskLevel === "critical" || signals.riskScore >= 85) return "critical";
    if (signals.riskLevel === "high" || signals.riskScore >= 65) return "high";
    if (signals.riskScore >= 40) return "medium";
    return "low";
  }
}
