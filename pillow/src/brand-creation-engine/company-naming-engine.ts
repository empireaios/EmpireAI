/** X1-05 — Company Naming Engine (structural signals only). */

const PREFIXES = ["Aether", "Summit", "North", "Prime", "Lumen", "Forge", "Vertex", "Harbor"];
const SUFFIXES = ["Labs", "Works", "Collective", "Systems", "Studio", "Group", "Commerce", "Co"];

function slug(industry: string): string {
  return industry
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24) || "general";
}

export class CompanyNamingEngine {
  generate(industry: string, hint?: string): string {
    if (hint?.trim()) {
      const cleaned = hint.trim().replace(/\s+/g, " ").slice(0, 64);
      return cleaned;
    }
    const prefix = PREFIXES[Math.abs(hash(industry)) % PREFIXES.length]!;
    const suffix = SUFFIXES[Math.abs(hash(industry + "sfx")) % SUFFIXES.length]!;
    const industryToken = slug(industry)
      .split("-")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
    return `${prefix}${industryToken || ""} ${suffix}`.replace(/\s+/g, " ").trim();
  }
}

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return h;
}
