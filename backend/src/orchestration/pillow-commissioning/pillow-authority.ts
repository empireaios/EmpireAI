/**
 * Current authority, shared by commissioning APIs and executive projections.
 *
 * The legacy commissioning table and sandbox/engineering tests are not an
 * independent V53 certification receipt. No receipt ingestion/acceptance path
 * exists yet, so there is deliberately no argument, environment switch or
 * legacy-record migration that can grant Birth or live commerce here.
 */
export type PillowAuthority = Readonly<{
  birthStatus: "NOT_BORN";
  technicallyReady: false;
  commerceStatus: "LOCKED";
  realCommerceAuthorized: false;
  waveCredit: 0;
  independentCertification: "UNVERIFIED";
  certificationReceiptIngestion: "NOT_IMPLEMENTED";
  reason: string;
}>;

const currentAuthority: PillowAuthority = Object.freeze({
  birthStatus: "NOT_BORN",
  technicallyReady: false,
  commerceStatus: "LOCKED",
  realCommerceAuthorized: false,
  waveCredit: 0,
  independentCertification: "UNVERIFIED",
  certificationReceiptIngestion: "NOT_IMPLEMENTED",
  reason: "No independently accepted V53 certification receipts. Certification receipt ingestion is not implemented; legacy commissioning, engineering passes, prose and owner approval alone cannot authorise Birth or live commerce.",
});

export function getPillowAuthority(): PillowAuthority {
  return currentAuthority;
}
