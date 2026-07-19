/** R5-06 — Technical SEO Analyzer. */

import { appendSieLog } from "./sie-logging.js";
import type { AnalyzePageInput, SeoIssue } from "./types.js";

export class TechnicalSeoAnalyzer {
  analyze(input: AnalyzePageInput): SeoIssue[] {
    const issues: SeoIssue[] = [];
    const page = input.pageReference;

    if (!page.includes("/") && !page.startsWith("http")) {
      issues.push(this.issue(page, "technical", "medium", "Page path appears non-canonical"));
    }
    if (!input.metaDescription || input.metaDescription.length < 50) {
      issues.push(
        this.issue(page, "metadata", "high", "Meta description missing or too short"),
      );
    }
    if (input.pageTitle && input.pageTitle.length > 60) {
      issues.push(this.issue(page, "metadata", "medium", "Page title exceeds recommended length"));
    }
    if (!input.pageTitle) {
      issues.push(this.issue(page, "technical", "critical", "Missing page title tag"));
    }

    appendSieLog({
      event: "seo_analysis",
      level: "info",
      details: `Technical SEO analysis for ${page}: ${issues.length} issue(s)`,
    });
    return issues;
  }

  private issue(
    pageReference: string,
    category: SeoIssue["category"],
    severity: SeoIssue["severity"],
    summary: string,
  ): SeoIssue {
    return {
      issueId: `sie-iss-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      pageReference,
      category,
      severity,
      summary,
      timestamp: new Date().toISOString(),
    };
  }
}
