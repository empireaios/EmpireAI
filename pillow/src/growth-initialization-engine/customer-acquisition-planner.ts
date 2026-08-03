/** X1-12 — Customer Acquisition Planner (structural signals only). */

export class CustomerAcquisitionPlanner {
  plan(input: {
    industry: string;
    hasPortfolio: boolean;
    hasPricing: boolean;
  }): string {
    const channels = [
      "organic-search-foundation",
      "owned-audience-activation",
      input.hasPortfolio ? "offer-led-landing-focus" : "offer-definition-first",
      input.hasPricing ? "value-aligned-conversion-path" : "pricing-clarity-first",
    ];
    return `${channels.join(" · ")} · industry=${input.industry}`;
  }

  launchMarketingRecommendations(industry: string): string {
    return [
      "announce-launch-to-owned-channels",
      "publish-core-offer-narrative",
      "seed-proof-and-trust-signals",
      `industry-angle:${industry}`,
    ].join(" · ");
  }
}
