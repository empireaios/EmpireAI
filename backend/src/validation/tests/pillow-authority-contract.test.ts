import assert from "node:assert/strict";
import { test } from "node:test";
import { getPillowAuthority } from "../../orchestration/pillow-commissioning/pillow-authority.js";
import { validateOutput } from "../../orchestration/pillow-host/mission-execution/contract.js";
const output = () => ({ kind: "actual_readonly_authority_inspection", observedAt: "2026-09-23T00:00:00.000Z", authority: { ...getPillowAuthority() } });
test("current implementation reporting remains unverified and locked", () => {
 const value = output();
 assert.equal(value.authority.certificationReceiptIngestion, "IMPLEMENTED_UNVERIFIED_ONLY");
 assert.match(value.authority.reason, /owner-authorized replacement certification requirements \(PILLOW-REPLACEMENT-CERTIFICATION-V1\).*remain unverified/);
 assert.match(value.authority.reason, /acceptance is not implemented/);
 validateOutput(value);
 for (const [field, invalid] of Object.entries({ birthStatus: "BORN", technicallyReady: true, commerceStatus: "OPEN", realCommerceAuthorized: true, waveCredit: 1, independentCertification: "PASS", certificationReceiptIngestion: "ACCEPTED" })) {
   assert.throws(() => validateOutput({ ...value, authority: { ...value.authority, [field]: invalid } }));
 }
});
test("historical immutable receipt observations survive readback without authority promotion", () => {
 const historical = JSON.parse(JSON.stringify({ ...output(), authority: { ...getPillowAuthority(), certificationReceiptIngestion: "NOT_IMPLEMENTED", reason: "Historical intake unavailable" } }));
 const bytes = JSON.stringify(historical);
 validateOutput(historical);
 assert.equal(JSON.stringify(historical), bytes);
 assert.equal(getPillowAuthority().certificationReceiptIngestion, "IMPLEMENTED_UNVERIFIED_ONLY");
 assert.throws(() => validateOutput({ ...historical, authority: { ...historical.authority, realCommerceAuthorized: true } }));
});