/** X1-06 — Domain Planning Engine (structural signals only). */

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 28) || "company";
}

export class DomainPlanningEngine {
  proposePrimaryDomain(companyName: string, industry: string): string {
    const base = slugify(companyName) || slugify(industry);
    return `${base}.example`;
  }

  proposeAlternatives(companyName: string, industry: string): string {
    const base = slugify(companyName) || slugify(industry);
    const industryToken = slugify(industry).slice(0, 12);
    return [
      `${base}.co`,
      `${base}.io`,
      `get${base}.com`,
      `${base}${industryToken}.com`,
      `${base}-hq.com`,
    ].join(" | ");
  }

  proposeEmailDomain(primaryDomain: string): string {
    const host = primaryDomain.replace(/^https?:\/\//, "").split("/")[0] || "company.example";
    return `mail@${host} · ops@${host} · support@${host}`;
  }
}
