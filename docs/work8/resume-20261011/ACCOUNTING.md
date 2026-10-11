# Production accounting reconciliation — unresolved

Read-only Advisor readbacks at 2026-10-11T02:16:10Z and 2026-10-11T02:39:51.492Z both report 227 accounting records, SHA256 `9a443196bae7cde0e02a583108a61b157cc4262f060a81c21af2affa4ffaaa92`. The original 224-record digest was `1b51a5f806abc75c68904ec20dc46d6dcb286d5ced9ef7b24897876554fca39b`. Those aggregates do not identify the three additions or prove preservation of the original subset.

Journal: 3, digest `e59dcbdd7a85614ce46e2b75a7e4dfe8971847cec3b1980617bc4e128de0f4dc`. Legacy history: 7, digest `2dafb93abe62c17339351529eacd02c4b33f29e9f2df3173be28c818b6ee21bf`. Both remain unchanged. Reserved/held amounts total 112427447 micro-USD; recorded estimates total 20507705 micro-USD; invoice actuals remain unknown for all 227 calls. Reservations are not payments or verified actual charges.

Three previously observed Pillow requests were `pcr_d9c4b797ac1a431a` (2026-10-10T21:37:30Z), `pcr_f4316f954345430a` (21:43:10Z), and `pcr_ea7be3e4e9974a3f` (21:45:06Z). The subsequent read-only recovery in ACCOUNTING-REQUEST-CORRELATION.json independently verifies all three canonical request keys as SHA256(workspace + NUL + Pillow request ID). The finalResult also preserves the distinct HTTP transport request IDs. No call-row ID or proof that these constitute the three added rows has been recovered. No corruption or examination attribution is asserted.

The missing capability is an authorised **read-only snapshot** of `/data/commissioning/openai-october-2026.sqlite`, including `calls` and `call_providers`, together with the retained original 224-row snapshot and canonical request/transport-correlation lineage. Available Advisor readers return aggregates; available Railway readers expose deployment/configuration/log information, not these SQL rows. Bounded accounting-filtered logs yielded no rows. No secret retrieval, production write, deployment or inference was attempted to work around this boundary.

`scripts/work8/accounting-readonly-extract.mjs` is prepared for that exact read capability. On Node22 it opens read-only, disables extensions, enables query-only/trusted-schema-off, checks the existing ledger application/version/integrity marker, bounds rows and payloads, and reads calls/provider lineage in one transaction. Its six-column digest uses the same field order and SQL ordering as the existing accounting reader. It does not initialise a database or record a reservation. Output is on stdout; it does not upload private records anywhere.

Invocation once the authorised snapshot is available:

```sh
node scripts/work8/accounting-readonly-extract.mjs /absolute/readable/ledger.sqlite /absolute/original-224-extract.json
```

Without baseline rows, output explicitly remains `UNRESOLVED_BASELINE_ROWS_UNAVAILABLE`. With a baseline it independently distinguishes additions, changed rows and removals, but the supplied baseline must first match the original retained digest. A `request_key` is SHA256(workspace + NUL + the correlationId supplied to inference). For these three recovered requests that correlationId is the `pcr_` Pillow request ID, not the HTTP `req-` transport ID. The three hashes match independently, but actual call/provider rows and original-subset equality remain mandatory before attributing additions.

Four isolated injected-ledger tests passed (112.291537ms): unchanged source bytes/canonical digest; additions versus changes/removals; addition-only proof separated from baseline authenticity/request attribution; schema and oversized-payload refusal. These test the extractor, **not production reconciliation**. No invoice amount, supplier permission, source assessment or actual accounting row was fabricated.
