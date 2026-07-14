export function formatMarketplaceIntegrationPreamble(input: {
  missionId?: string | null;
  roadmapItem?: string | null;
}): string {
  const mission = input.missionId ?? "P8-03";
  const item = input.roadmapItem ?? "Marketplace Integration Architecture";
  return [
    `# ${mission} — ${item}`,
    "",
    "Constitutional marketplace abstraction — provider-independent, replaceable connectors.",
    "Extend G2-02 · do NOT create competing integration systems.",
    "",
    "Pipeline: Business → Marketplace → Auth → Store → Catalogue → Publish → Inventory → Orders → Fulfilment → Analytics → Monitor",
  ].join("\n");
}

export function prependMarketplaceIntegration(body: string, preamble: string): string {
  return `${preamble}\n\n---\n\n${body}`;
}
