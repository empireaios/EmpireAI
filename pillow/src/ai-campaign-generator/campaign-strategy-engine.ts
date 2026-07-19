/** R5-12 — Campaign Strategy Engine. */

import type { CampaignObjective } from "./types.js";

export class CampaignStrategyEngine {
  generateObjective(productFocus?: string): CampaignObjective {
    const focus = productFocus?.toLowerCase() ?? "";
    if (focus.includes("brand") || focus.includes("launch")) return "awareness";
    if (focus.includes("traffic") || focus.includes("visit")) return "traffic";
    if (focus.includes("lead") || focus.includes("signup")) return "leads";
    if (focus.includes("retain") || focus.includes("loyalty")) return "retention";
    if (focus.includes("engage") || focus.includes("community")) return "engagement";
    return "conversions";
  }

  generateStrategy(objective: CampaignObjective, productFocus?: string): string {
    const focus = productFocus?.trim() || "EmpireAI product";
    const playbooks: Record<CampaignObjective, string> = {
      awareness: `Build top-of-funnel awareness for ${focus} via multi-channel storytelling and SEO amplification.`,
      traffic: `Drive qualified site traffic to ${focus} landing pages using search, social, and video discovery.`,
      engagement: `Increase engagement around ${focus} with interactive creatives and retargeting sequences.`,
      leads: `Capture high-intent leads for ${focus} through offer-led creative and intent keyword clusters.`,
      conversions: `Maximize conversions for ${focus} by aligning paid, SEO, and audience cohorts on purchase intent.`,
      retention: `Reactivate and retain customers of ${focus} with loyalty messaging and CRM-aligned paid support.`,
    };
    return playbooks[objective];
  }
}
