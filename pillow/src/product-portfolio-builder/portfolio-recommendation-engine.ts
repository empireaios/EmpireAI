/** X1-08 — Portfolio Recommendation Engine (structural signals only). */

export class PortfolioRecommendationEngine {
  recommend(input: {
    industry: string;
    profitability: number;
    demand: number;
    overlapSummary: string;
  }): string {
    const actions: string[] = [];
    if (input.profitability < 70) actions.push("Increase margin-focus SKUs");
    if (input.demand < 70) actions.push("Prioritize higher-demand categories");
    if (!input.overlapSummary.includes("no-overlap")) {
      actions.push("Consolidate overlapping SKUs");
    }
    if (actions.length === 0) {
      actions.push("Maintain balanced portfolio mix");
      actions.push("Pilot one adjacent category");
    }
    return `${input.industry}: ${actions.join(" · ")}`;
  }
}
