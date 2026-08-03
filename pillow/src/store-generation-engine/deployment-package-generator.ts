/** X1-07 — Deployment Package Generator (preparation only — never auto-deploys). */

export class DeploymentPackageGenerator {
  prepare(storefrontId: string, companyName: string, domainPlanReference: string): string {
    return [
      `structural://deployment-package/${storefrontId}`,
      `company=${companyName}`,
      `domainPlan=${domainPlanReference}`,
      "artifacts:website-structure,navigation,catalogue,legal-templates",
      "autoDeploy=false",
      "requiresValidation=true",
    ].join(" · ");
  }
}
