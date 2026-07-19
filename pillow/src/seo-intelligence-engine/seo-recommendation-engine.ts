/** R5-06 — SEO Recommendation Engine. */

import { appendSieLog } from "./sie-logging.js";
import type { SeoIssue, SeoRecommendation } from "./types.js";

export class SeoRecommendationEngine {
  private recommendations: SeoRecommendation[] = [];

  generateFromIssues(issues: SeoIssue[], pageReference: string): SeoRecommendation[] {
    const generated: SeoRecommendation[] = [];
    for (const issue of issues) {
      const type =
        issue.category === "linking"
          ? "internal_link"
          : issue.category === "metadata"
            ? "metadata"
            : issue.category === "technical"
              ? "technical"
              : "content";
      const rec: SeoRecommendation = {
        recommendationId: `sie-rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        pageReference: issue.pageReference || pageReference,
        type,
        summary: `Resolve: ${issue.summary}`,
        priority:
          issue.severity === "critical" || issue.severity === "high"
            ? "high"
            : issue.severity === "medium"
              ? "medium"
              : "low",
        requiresValidationBeforeApply: true,
        timestamp: new Date().toISOString(),
      };
      generated.push(rec);
      this.recommendations.push(rec);
    }

    appendSieLog({
      event: "recommendation_generation",
      level: "info",
      details: `Generated ${generated.length} recommendation(s) for ${pageReference}`,
    });
    return generated.map((r) => ({ ...r }));
  }

  recommendInternalLinks(pageReference: string): SeoRecommendation[] {
    const rec: SeoRecommendation = {
      recommendationId: `sie-rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      pageReference,
      type: "internal_link",
      summary: `Add contextual internal links from ${pageReference} to related high-authority pages`,
      priority: "medium",
      requiresValidationBeforeApply: true,
      timestamp: new Date().toISOString(),
    };
    this.recommendations.push(rec);
    appendSieLog({
      event: "recommendation_generation",
      level: "info",
      details: `Internal linking recommendation for ${pageReference}`,
    });
    return [{ ...rec }];
  }

  optimizeMetadata(
    pageReference: string,
    proposedTitle?: string,
    proposedDescription?: string,
  ): SeoRecommendation[] {
    const parts: string[] = [];
    if (proposedTitle) parts.push(`title → validated proposal`);
    if (proposedDescription) parts.push(`description → validated proposal`);
    if (parts.length === 0) {
      parts.push("Generate unique title and meta description");
    }
    const rec: SeoRecommendation = {
      recommendationId: `sie-rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      pageReference,
      type: "metadata",
      summary: `Metadata optimization (validation required before apply): ${parts.join("; ")}`,
      priority: "high",
      requiresValidationBeforeApply: true,
      timestamp: new Date().toISOString(),
    };
    this.recommendations.push(rec);
    appendSieLog({
      event: "recommendation_generation",
      level: "info",
      details: `Metadata optimization recommendation for ${pageReference}`,
    });
    return [{ ...rec }];
  }

  list(): SeoRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  count(): number {
    return this.recommendations.length;
  }

  resetForTesting(): void {
    this.recommendations = [];
  }
}
