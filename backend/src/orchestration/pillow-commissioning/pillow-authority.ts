/**
 * Current authority, shared by commissioning APIs and executive projections.
 *
 * The legacy commissioning table and sandbox/engineering tests are not an
 * independent certification receipt. Unverified receipt intake exists, but no acceptance path
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
  certificationReceiptIngestion: "IMPLEMENTED_UNVERIFIED_ONLY";
  reason: string;
}>;

const currentAuthority: PillowAuthority = Object.freeze({
  birthStatus: "NOT_BORN",
  technicallyReady: false,
  commerceStatus: "LOCKED",
  realCommerceAuthorized: false,
  waveCredit: 0,
  independentCertification: "UNVERIFIED",
  certificationReceiptIngestion: "IMPLEMENTED_UNVERIFIED_ONLY",
  reason: "Unverified certification receipt intake is implemented. The owner-authorized replacement certification requirements (PILLOW-REPLACEMENT-CERTIFICATION-V1) remain unverified and certification acceptance is not implemented; legacy commissioning, engineering passes, prose and owner approval alone cannot authorise Birth or live commerce.",
});

export function getPillowAuthority(): PillowAuthority {
  return currentAuthority;
}
