/** R5-06 — Content SEO Analyzer. */

import { appendSieLog } from "./sie-logging.js";
import type { AnalyzePageInput, SeoIssue } from "./types.js";

export class ContentSeoAnalyzer {
  analyze(input: AnalyzePageInput, targetKeyword?: string | null): SeoIssue[] {
    const issues: SeoIssue[] = [];
    const page = input.pageReference;
    const title = input.pageTitle ?? "";

    if (targetKeyword && title && !title.toLowerCase().includes(targetKeyword.toLowerCase())) {
      issues.push({
        issueId: `sie-iss-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        pageReference: page,
        category: "content",
        severity: "medium",
        summary: `Primary keyword not present in page title`,
        timestamp: new Date().toISOString(),
      });
    }

    if (!title || title.trim().length < 10) {
      issues.push({
        issueId: `sie-iss-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        pageReference: page,
        category: "content",
        severity: "high",
        summary: "Page title too short for content SEO",
        timestamp: new Date().toISOString(),
      });
    }

    appendSieLog({
      event: "seo_analysis",
      level: "info",
      details: `Content SEO analysis for ${page}: ${issues.length} issue(s)`,
    });
    return issues;
  }

  score(input: AnalyzePageInput, issueCount: number): number {
    let score = 100;
    score -= Math.min(60, issueCount * 12);
    if (input.pageTitle && input.pageTitle.length >= 20 && input.pageTitle.length <= 60) {
      score += 5;
    }
    if (input.metaDescription && input.metaDescription.length >= 70) {
      score += 5;
    }
    return Math.max(0, Math.min(100, score));
  }
}
