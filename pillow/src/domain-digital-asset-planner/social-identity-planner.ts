/** X1-06 — Social Identity Planner (structural signals only). */

function handleBase(companyName: string): string {
  const cleaned = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20);
  return cleaned || "brandpresence";
}

export class SocialIdentityPlanner {
  planHandles(companyName: string): string {
    const base = handleBase(companyName);
    return [
      `x:@${base}`,
      `instagram:@${base}`,
      `linkedin:/company/${base}`,
      `youtube:@${base}`,
      `tiktok:@${base}`,
    ].join(" | ");
  }
}
