# CJ credential route investigation — 2026-09-29

## Decision

Prefer a **new MCP direct token with the standalone single-GET adapter**, leaving EmpireAI Production API Key entirely untouched. This is a source-backed implementation candidate, not authenticated CJ acceptance. No token was created, no CJ provider request occurred, and no secret value was read, copied, hashed or exposed.

## Existing-secret route

Authenticated GitHub Actions settings show zero repository secrets and only the four Amazon environment secrets. Railway OAuth returns names only: CJ_API_KEY, CJ_DROPSHIPPING_API_KEY and CJ_INTEGRATION_MODE. Local execution has no CJ environment names. No value comparison was performed, so Railway names alone cannot establish which matches the owner-visible key. No callable server-side secret-reference bridge from Railway to GitHub was found. Retrieving a value, exporting production variables, running in the protected process, or changing Railway configuration is not an acceptable shortcut.

If a securely scoped nonproduction reference becomes available, the prepared API-key flow remains auth plus one fixed catalog GET with 50-point ceiling, durable admission/readback, no retries/refresh/logout/business writes, isolated branch/environment and disablement afterward. It is currently unavailable without violating the no-copy/no-production-touch boundary.

## Official implementation evidence

Reviewed CJ's official repository https://github.com/CJ-dropshipping/api-mcp at commit e8375d86550ae834dbab0934eb226ec2819d55ae. File hashes are in the companion JSON.

- src/mcp-server/url-parser.ts supports MCP@userId@CJ:accessToken and API@userId@CJ:accessToken. Its comment records authentication error1600005 when the MCP form was mistaken for an API key.
- src/auth/session.ts direct context returns the suffix as access token without refresh/exchange; account label and a synthetic expiry are NOT provider-observed identity/expiry.
- src/api-client/http-client.ts puts that token in CJ-Access-Token for API calls. Its retry loop prevents assuming one MCP tool invocation equals one REST attempt.
- src/mcp-server/tools/product.tool.ts maps search_products to GET product/listV2 and transforms its response. Useful catalog evidence exists, but the full MCP server is broader than needed and its deployed version is unverified.

Thus an MCP credential is **not documented as the apiKey input of getAccessToken**. However, current official source demonstrates a direct REST access-header route for its token component. This is stronger than the earlier documentation-only conclusion; it does not prove newly issued credentials work on the deployed endpoint until a permitted read occurs. No first-party code was executed; source was inspected only.

## Prepared narrow adapter

Opt-in CJ_CREDENTIAL_MODE=MCP_DIRECT consumes VERIFY_CJ_DIRECT_TOKEN, accepts only a strict MCP@CJdigits@CJ:token subset, refuses URLs/percent encoding/header controls and mixed API-key credentials, and calls only GET /api2.0/v1/product/list?pageNum=1&pageSize=1. One attempt, 50points, no auth exchange, refresh, logout, MCP tool installation or business mutation. Admission/receipt persist with no credential-bearing URL; account label stays UNVERIFIED_CREDENTIAL_LABEL. No qualification/stock/cost/commerce claim follows a catalog read.

Nine offline tests cover existing Amazon/CJ paths plus exact direct-header GET, secret-free receipts, malformed/mixed credential refusal and401 stopping without refresh fallback. The dedicated ci/provider-readback-cj-v1 branch has its observe job unconditionally disabled and references only VERIFY_CJ_DIRECT_TOKEN, never the production key. Branch disablement and secret wiring were read back.

## Continuation

No CJ-support dependency. After code CI passes, prepare secure owner provisioning of a NEW MCP token in environment empireai-readonly-cj, restricted to ci/provider-readback-cj-v1, secret VERIFY_CJ_DIRECT_TOKEN. Do not supply a URL or paste anything in chat. Creation side effects are not independently proven: stop if CJ requests replacing/resetting an existing credential. Enable only after explicit readiness and safety review, execute one read, persist outcome, disable again. Unsupported format or auth rejection stops; no fallback to production credentials.

Keep unrelated Pillow/runtime/phone-console CI and protected capture coordination progressing. Railway read-only 11:25 UTC still pending RAM, flushCount3, critical saves0, roughly3s lag on the same old deployment. No restart/redeploy/promotion. NOT_BORN / LOCKED.

References: https://developers.cjdropshipping.com/en/api/api2/api/auth.html ; https://developers.cjdropshipping.com/en/api/api2/mcp.html ; https://developers.cjdropshipping.com/en/api/api2/standard/points.html .

Verified code f3ff9208165e3f69e727c093bfe1a403d541552f passed [Product](https://github.com/empireaios/EmpireAI/actions/runs/36561587724), [Semantic](https://github.com/empireaios/EmpireAI/actions/runs/36561587714) and [Runtime](https://github.com/empireaios/EmpireAI/actions/runs/36561587745), including phone browser, Pillow and offline direct-token tests. No live CJ acceptance.
