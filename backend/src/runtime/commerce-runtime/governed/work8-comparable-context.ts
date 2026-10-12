import {projectWork8Sources, type SavedSourceReader} from './work8-source-projection.js';
import {projectWork8MarketContext} from './work8-market-context.js';

/** A functional comparator is a screening aid, never an exact-product or qualification claim.
 * Only verified retained sources enter this read-only projection. The deliberately narrow
 * category rule explains its basis in visible source titles, without fuzzy identity matching.
 */
const magneticCardStorage = (title: string | null) => Boolean(title && /\bmagnetic\b/i.test(title) && /\bcards?\b/i.test(title) && /\b(?:box|case|organizer)\b/i.test(title));
export function projectWork8ComparableContext(reader: SavedSourceReader, workspace: string, evidenceIds: string[], now: number) {
  if (evidenceIds.length > 100) throw Error('COMPARABLE_CONTEXT_BATCH_BOUND');
  const supplierIds = evidenceIds.filter(id => reader(workspace, id)?.provider === 'CJ');
  const marketIds = evidenceIds.filter(id => reader(workspace, id)?.provider === 'Amazon');
  const supplier = projectWork8Sources(reader, workspace, supplierIds, now);
  const market = projectWork8MarketContext(reader, workspace, marketIds, now);
  const candidates = supplier.products.filter(product => magneticCardStorage(product.title));
  const observations = market.observations.filter(observation => magneticCardStorage(observation.title));
  const comparisons = candidates.flatMap(product => observations.map(observation => ({
    id: `${product.candidateId}:${observation.asin}`,
    classification: 'FUNCTIONAL_COMPARABLE_ONLY' as const,
    exactMatch: false as const,
    rationale: 'Both source titles describe magnetic storage for cards. This supports a functional price comparison only.',
    differences: [
      'Supplier product and Amazon ASIN are distinct identities; no common manufacturer or GTIN is verified.',
      'Dimensions, capacity and material equivalence are unverified. Compare the original titles and variant descriptions below; differing measurements must not be treated as identical.',
      'The marketplace landed offer includes marketplace shipping, not EmpireAI supplier acquisition, freight, fees, duties or returns.'
    ],
    supplier: {
      candidateId: product.candidateId, productId: product.productId, title: product.title,
      observedVariants: product.observedVariants, observedAt: product.observedAt, freshness: product.freshness,
      source: product.source,
    },
    marketplace: observation,
    demand: {status: 'UNKNOWN' as const, unitSales: null, reason: 'No verified unit demand or comparable sales velocity is available in these retained observations. A catalogue rank, if recorded elsewhere, is only a proxy.'},
    screening: 'DEFERRED_FOR_EVIDENCE' as const,
    screeningReasons: ['EXACT_PRODUCT_EQUIVALENCE_UNVERIFIED', 'VARIANT_AND_CURRENT_SUPPLY_REQUIRE_VERIFICATION', 'COMPLETE_ECONOMICS_AND_RESTRICTIONS_UNVERIFIED', ...(product.freshness === 'HISTORICAL' ? ['SUPPLIER_OBSERVATION_HISTORICAL'] : []), ...(observation.freshness === 'HISTORICAL' ? ['MARKET_OBSERVATION_HISTORICAL'] : [])],
    nextStep: 'Verify the specific variant, current supply and complete costs before commercial qualification. This comparison is not a Pillow recommendation or an owner approval.',
    images: [], grantsAuthority: false as const,
  }))).slice(0, 20);
  return {comparisons, observedCandidates: supplier, comparisonRule: 'MAGNETIC_CARD_STORAGE_FUNCTION_V1', coverage: 'LATEST_100_SAVED_RECORDS_MAX_20_COMPARISONS', rejected: [...supplier.rejected, ...market.rejected], exactMatches: 0, qualified: 0, grantsAuthority: false as const};
}
