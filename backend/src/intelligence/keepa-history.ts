/** Normalize an existing Keepa response without granting acquisition or purchase authority. */
export function normalizeKeepaHistory(data: unknown, asin: string, domainId: number) {
  const fail = (): never => { throw new Error('KEEPA_HISTORY_UNVERIFIED'); };
  if (!data || typeof data !== 'object' || Array.isArray(data)) return fail();
  const body = data as Record<string, unknown>;
  if (!Array.isArray(body.products) || body.products.length !== 1) return fail();
  const product = body.products[0];
  if (!product || typeof product !== 'object' || product.asin !== asin || product.domainId !== domainId || !Array.isArray(product.csv)) return fail();
  const history = (value: unknown): number[] => {
    if (value === null || value === undefined) return [];
    if (!Array.isArray(value) || value.length % 2 !== 0) return fail();
    let last = -1;
    for (let i = 0; i < value.length; i += 2) {
      const minute = value[i], observation = value[i + 1];
      if (!Number.isSafeInteger(minute) || minute < 0 || minute < last || !Number.isSafeInteger(observation)) return fail();
      last = minute;
    }
    return value.slice(-120);
  };
  const priceHistory = history(product.csv[0]);
  const salesRankHistory = history(product.csv[3]);
  if (!priceHistory.length && !salesRankHistory.length) return fail();
  const tokenCount = (value: unknown, optional = false): number | null => {
    if (optional && value === undefined) return null;
    if (!Number.isSafeInteger(value) || (value as number) < 0) return fail();
    return value as number;
  };
  return {
    asin, domainId, priceHistory, salesRankHistory,
    tokensLeft: tokenCount(body.tokensLeft),
    tokensConsumed: tokenCount(body.tokensConsumed, true),
  };
}
