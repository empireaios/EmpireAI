# Retained Amazon broad market context

`projectWork8MarketContext(reader,workspace,evidenceIds,now)` resolves authenticated workspace-scoped saved evidence only. Maximum 100 evidence IDs. Facts hashes, LIVE_PROVIDER authenticity and chronological validity are checked before catalogue/offer projection. Amazon US catalogue titles are linked to exact ASIN and marketplace-matched offer payloads; endpoints, status, condition, numeric minor-unit prices and currency must agree. Failed records are reported as rejected. Stale records remain historical. No external refresh, images, demand estimate or supplier equivalence is inferred.

Return API: `{observations,rejected,counts,classification:'BROAD_MARKET_CONTEXT_ONLY',verifiedCandidateMatches:0,grantsAuthority:false}`. Each observation includes title, brand, ASIN, price, USD currency, observed/expiry timestamps, freshness, source receipt IDs/digests and `verifiedCandidateMatch:false`. Catalogue/offer evidence is distinct from CJ product discovery totals.

Actual retained evidence produces ten catalogue ASINs and one priced observation: WALI 4-tier desk organizer, ASIN B0GN1TZZ9W, USD18.99 lowest new landed offer observed 2026-10-10 18:39 UTC. This is general market context. It is not a proven competitor range or same-product match for the ten CJ products. Image rights remain unverified; no images are emitted.

Owner component accepts optional `marketContext` separately from `value` and `discovery`. Displays observed name/price and explicit no-verified-match label; ASIN/source details are behind a disclosure. Existing portfolio filters and qualified missions are unchanged. Caller adds field through existing authenticated portfolio readback; no new route or paid provider call.

Four backend contract tests and seven combined owner source-render tests passed, plus focused strict TypeScript checks. Tests cover genuine retained evidence, stale timestamps, invalid prices, wrong identity, unknown catalogue linkage, digest tampering and truthful non-equivalence. Not authenticated production acceptance.
