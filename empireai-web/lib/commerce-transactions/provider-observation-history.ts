// Dated sanitized observations derived from committed provider receipts. No credentials or account labels.
export const providerObservationHistory = [
  {
    "provider": "Amazon",
    "observedAt": "2026-09-29T10:18:17.427Z",
    "identity": "EMP-PROOF-1786072434049 / B088NRLMPV",
    "detail": "US$14.99; seller quantity 5; not BUYABLE.",
    "limit": "Known rejected Proof 001 product. Seller quantity is not supplier stock.",
    "receiptPath": "docs/mission-state/evidence/2026-09-29-amazon-receipt.json",
    "sourceHead": "ff223ca2fd4ae086276c8d536775194f08182889",
    "responseHash": "fa9116ccbe2442b13bb729156fe3554061a99f554c06319d0c467c5a4e3d2da6",
    "runId": 36554704403
  },
  {
    "provider": "CJ",
    "observedAt": "2026-09-29T11:43:53.279Z",
    "identity": "CJYD3209759 / PID 2609291119211612600",
    "detail": "Catalog price format: string; no variants in returned summary.",
    "limit": "Variant cost, supplier stock and freight remain unverified.",
    "receiptPath": "docs/mission-state/evidence/2026-09-29-cj-receipt.json",
    "sourceHead": "90cd1630af96711b40770358cf5cd0d8048584f2",
    "responseHash": "002a53573ab59847d4c116ad7ff3ee70e3b189d1744c2e854301fc6f6665f96e",
    "runId": 36563526539
  },
  {
    "provider": "CJ",
    "observedAt": "2026-09-29T12:14:25.303Z",
    "identity": "CJYD3209759 / 18 exact variants",
    "detail": "18 variants at US$11.28 each; zero CJ-managed stock in the returned CN subwarehouse.",
    "limit": "Factory inventory is not eligible CJ stock. Rejected for qualification; freight skipped, landed cost and profit unknown.",
    "receiptPath": "docs/mission-state/evidence/2026-09-29-cj-supplier/receipt.json",
    "sourceHead": "32d72bddff82cee80d9972d6a4b32705dd3871a2",
    "responseHash": "798f74bce359ff78af8eaf1b8014ab2070957da3f74ca266c9fd10fac23d11f3",
    "runId": 36566773325
  }
] as const;
