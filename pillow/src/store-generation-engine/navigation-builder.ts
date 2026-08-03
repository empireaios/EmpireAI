/** X1-07 — Navigation Builder (structural signals only). */

export class NavigationBuilder {
  build(companyName: string, industry: string): string {
    const label = companyName.trim() || "Store";
    return [
      `Home`,
      `Shop`,
      `Collections:${industry}`,
      `About ${label}`,
      `Contact`,
      `Legal`,
    ].join(" > ");
  }
}
