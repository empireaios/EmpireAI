/** X1-11 — Launch Dependency Manager (structural signals only). */

export type LaunchDependencySnapshot = {
  readinessOk: boolean;
  brandOk: boolean;
  digitalAssetsOk: boolean;
  storefrontOk: boolean;
  pricingOk: boolean;
  summary: string;
  allSatisfied: boolean;
};

export class LaunchDependencyManager {
  resolve(input: {
    readinessCertified: boolean;
    hasBrand: boolean;
    hasDigitalPlan: boolean;
    hasStorefront: boolean;
    hasPricing: boolean;
  }): LaunchDependencySnapshot {
    const readinessOk = input.readinessCertified;
    const brandOk = input.hasBrand;
    const digitalAssetsOk = input.hasDigitalPlan;
    const storefrontOk = input.hasStorefront;
    const pricingOk = input.hasPricing;
    const parts = [
      `readiness=${readinessOk ? "ok" : "missing"}`,
      `brand=${brandOk ? "ok" : "missing"}`,
      `digital=${digitalAssetsOk ? "ok" : "missing"}`,
      `storefront=${storefrontOk ? "ok" : "missing"}`,
      `pricing=${pricingOk ? "ok" : "missing"}`,
    ];
    return {
      readinessOk,
      brandOk,
      digitalAssetsOk,
      storefrontOk,
      pricingOk,
      summary: parts.join(" | "),
      allSatisfied: readinessOk && brandOk && digitalAssetsOk && storefrontOk && pricingOk,
    };
  }
}
