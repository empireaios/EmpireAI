import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  attentionPriorityLabel,
  explainListingRoute,
  formatFinancialAmount,
  formatGrandKingTime,
  humanizeOperatingTerm,
  scrubMachineLanguage,
} from "./executive-presentation";

describe("executive presentation (Mission 007)", () => {
  it("formats human-readable times without raw ISO default", () => {
    const formatted = formatGrandKingTime("2026-08-10T14:15:08.237Z");
    assert.ok(!formatted.includes("T14:15"));
    assert.ok(!formatted.includes(".237Z"));
    assert.match(formatted, /2026|Aug|10/);
  });

  it("scrubs machine language from default copy", () => {
    const scrubbed = scrubMachineLanguage(
      "SUCCESS-001 B5 LIVE_COMMERCE_INTEGRATION_MODE B0FPFM3TRS SMART_VIABLE_BATCH_COMPLETE",
    );
    assert.ok(!/SUCCESS-001/.test(scrubbed));
    assert.ok(!/B0FPFM3TRS/.test(scrubbed));
    assert.ok(!/LIVE_COMMERCE_INTEGRATION_MODE/.test(scrubbed));
  });

  it("humanizes commissioning terminology", () => {
    assert.match(humanizeOperatingTerm("COMMISSIONING"), /tested|continuous/i);
  });

  it("labels attention priorities for Grand King", () => {
    assert.equal(attentionPriorityLabel("critical_system"), "CRITICAL");
    assert.equal(attentionPriorityLabel("money_approval"), "DECISION");
    assert.equal(attentionPriorityLabel("commercial_opportunity"), "IMPORTANT");
  });

  it("explains existing-ASIN listing route", () => {
    const route = explainListingRoute("OFFER_ON_EXISTING_ASIN");
    assert.match(route.title, /existing/i);
    assert.match(route.explanation, /catalogue|catalog|seller offer/i);
  });

  it("labels financial truth statuses", () => {
    const unknown = formatFinancialAmount(null, {
      status: "NOT_YET_VERIFIED",
      source: "test",
    });
    assert.equal(unknown.display, "—");
    assert.match(unknown.label, /Not yet verified/i);
    const live = formatFinancialAmount(12.5, {
      status: "VERIFIED_LIVE",
      source: "test",
      currency: "USD",
    });
    assert.match(live.display, /12\.50|\$12/);
  });
});
