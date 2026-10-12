type Row = Record<string, unknown>;
const row = (value: unknown): Row => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Row : {};
const list = (value: unknown): unknown[] => Array.isArray(value) ? value.slice(0, 10) : [];

/** Preserve only bounded, attributable catalogue measurements lost by generic depth limiting.
 * Rank is a point-in-time category proxy, never unit demand or a supplier match.
 * Everything else continues through the existing redacting sanitizer unchanged.
 */
export function amazonCatalogFacts(data: Row, marketplaceId: string, sanitize: (value: unknown) => unknown): unknown {
  const cleaned = row(sanitize(data));
  const text = (value: unknown, identifier = false): string | null => {
    if (typeof value !== 'string' || !value.trim() || value.length > 200) return null;
    const safe = sanitize(value);
    if (typeof safe !== 'string' || safe.includes('[REDACTED]') || safe.includes('[DEPTH_BOUND]')) return null;
    return identifier && !/^[A-Za-z0-9_-]{1,128}$/.test(safe) ? null : safe;
  };
  cleaned.items = list(data.items).map((value, index) => {
    const item = row(value), output = row(list(cleaned.items)[index]);
    if (typeof item.asin !== 'string' || !/^[A-Z0-9]{10}$/.test(item.asin) || output.asin !== item.asin) return output;
    const rankGroups = list(item.salesRanks).filter(value => row(value).marketplaceId === marketplaceId);
    const ranks = (value: unknown, key: 'classificationId' | 'websiteDisplayGroup') => list(value).flatMap(value => {
      const entry = row(value), id = text(entry[key], true), title = text(entry.title);
      if (!id || !title || typeof entry.rank !== 'number' || !Number.isSafeInteger(entry.rank) || entry.rank < 1) return [];
      return [{[key]: id, title, rank: entry.rank}];
    });
    // Ambiguous duplicate marketplace groups are not merged into invented observations.
    output.salesRanks = rankGroups.length === 1 ? [{marketplaceId,
      classificationRanks: ranks(row(rankGroups[0]).classificationRanks, 'classificationId'),
      displayGroupRanks: ranks(row(rankGroups[0]).displayGroupRanks, 'websiteDisplayGroup')}] : [];
    const dimensionGroups = list(item.dimensions).filter(value => row(value).marketplaceId === marketplaceId);
    output.dimensions = dimensionGroups.length === 1 ? [{marketplaceId, ...Object.fromEntries(['item', 'package'].map(scope => {
      const dimensions = row(row(dimensionGroups[0])[scope]);
      return [scope, Object.fromEntries(['height', 'length', 'width', 'weight'].flatMap(name => {
        const measure = row(dimensions[name]);
        const units = name === 'weight' ? ['grams', 'kilograms', 'ounces', 'pounds'] : ['millimeters', 'centimeters', 'meters', 'inches', 'feet'];
        if (typeof measure.unit !== 'string' || !units.includes(measure.unit) || typeof measure.value !== 'number' || !Number.isFinite(measure.value) || measure.value <= 0) return [];
        return [[name, {unit: measure.unit, value: measure.value}]];
      }))];
    }))}] : [];
    return output;
  });
  return cleaned;
}
