/** R4-10 — Conversation analysis engine. */

import type { CustomerSentimentEngineConfiguration } from "./configuration.js";
import type { CommunicationChannel, SentimentCategory } from "./types.js";
import { SentimentAnalysisEngine } from "./sentiment-analysis-engine.js";

export class ConversationAnalysisEngine {
  private readonly messageEngine = new SentimentAnalysisEngine();

  analyzeConversation(
    messages: string[],
    config: CustomerSentimentEngineConfiguration,
  ): {
    sentimentScore: number;
    sentimentCategory: SentimentCategory;
    confidenceScore: number;
    messageCount: number;
  } {
    if (messages.length === 0) {
      return {
        sentimentScore: 50,
        sentimentCategory: "neutral",
        confidenceScore: 30,
        messageCount: 0,
      };
    }

    const analyses = messages.map((m) => this.messageEngine.analyzeMessage(m, config));
    const avgScore = Math.round(
      analyses.reduce((sum, a) => sum + a.sentimentScore, 0) / analyses.length,
    );
    const avgConfidence = Math.round(
      analyses.reduce((sum, a) => sum + a.confidenceScore, 0) / analyses.length,
    );

    const categoryCounts = new Map<SentimentCategory, number>();
    for (const a of analyses) {
      categoryCounts.set(a.sentimentCategory, (categoryCounts.get(a.sentimentCategory) ?? 0) + 1);
    }
    let dominant: SentimentCategory = "neutral";
    let max = 0;
    for (const [cat, count] of categoryCounts) {
      if (count > max) {
        max = count;
        dominant = cat;
      }
    }

    return {
      sentimentScore: avgScore,
      sentimentCategory: dominant,
      confidenceScore: avgConfidence,
      messageCount: messages.length,
    };
  }

  inferChannelFromReference(reference: string): CommunicationChannel {
    if (reference.includes("chat")) return "live_chat";
    if (reference.includes("email")) return "email";
    if (reference.includes("sms")) return "sms";
    if (reference.includes("whatsapp")) return "whatsapp";
    return "live_chat";
  }
}
