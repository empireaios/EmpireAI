/** X1-06 — Website Planning Engine (structural signals only). */

export class WebsitePlanningEngine {
  planArchitecture(companyName: string, industry: string): string {
    const label = companyName.trim() || "Company";
    return [
      `${label} website architecture (structural)`,
      "routes: / · /product · /pricing · /about · /contact · /legal",
      `industry focus: ${industry}`,
      "sections: hero · value · proof · offer · FAQ · CTA",
      "assets: logo · favicon · og-image · brand kit folder",
    ].join(" · ");
  }

  planBrandAssetStructure(companyName: string): string {
    const folder = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "brand";
    return [
      `brand-assets/${folder}/logo/`,
      `brand-assets/${folder}/colour/`,
      `brand-assets/${folder}/typography/`,
      `brand-assets/${folder}/guidelines/`,
      `brand-assets/${folder}/social/`,
    ].join(" | ");
  }

  planIdentityConsistency(companyName: string, primaryDomain: string): string {
    return [
      `identity base: ${companyName}`,
      `canonical domain: ${primaryDomain}`,
      "consistent handle stem across social channels",
      "email domain matches primary company domain",
      "website IA reflects brand positioning structure",
    ].join(" · ");
  }
}
