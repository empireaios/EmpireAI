import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countOrderedListBlocks,
  countTopLevelOrderedItems,
  looksLikeMarkdown,
  parseExecutiveChatBlocks,
} from "./executive-chat-markdown.ts";

describe("ExecutiveChatMarkdown helpers", () => {
  it("detects bold/lists/headings as markdown", () => {
    assert.equal(looksLikeMarkdown("**What I Know**\n\n- one\n- two"), true);
    assert.equal(looksLikeMarkdown("## Heading\n\nParagraph"), true);
    assert.equal(looksLikeMarkdown("1. First\n2. Second"), true);
  });

  it("plain conversational text is not forced through markdown structure", () => {
    assert.equal(
      looksLikeMarkdown("We haven't made a first sale yet. My priority is the first transaction."),
      false,
    );
  });

  it("3 requested numbered sections parse as one ol with 3 items", () => {
    const src = "1. Alpha\n\n2. Beta\n\n3. Gamma";
    assert.equal(countOrderedListBlocks(src), 1);
    assert.equal(countTopLevelOrderedItems(src), 3);
  });

  it("7 numbered sections with body stay one sequential ol", () => {
    const parts = Array.from({ length: 7 }, (_, i) => `${i + 1}. Section ${i + 1}\nBody for ${i + 1}.`);
    const src = parts.join("\n\n");
    assert.equal(countOrderedListBlocks(src), 1);
    assert.equal(countTopLevelOrderedItems(src), 7);
    const ol = parseExecutiveChatBlocks(src).find((b) => b.type === "ol");
    assert.ok(ol && ol.type === "ol");
    assert.match(ol.items[0]!, /Section 1/);
    assert.match(ol.items[6]!, /Section 7/);
  });

  it("nested bullets under numbered items do not split the ol", () => {
    const src = [
      "1. First obligation",
      "- nested a",
      "- nested b",
      "",
      "2. Second obligation",
      "- nested c",
    ].join("\n");
    assert.equal(countOrderedListBlocks(src), 1);
    assert.equal(countTopLevelOrderedItems(src), 2);
    const ol = parseExecutiveChatBlocks(src).find((b) => b.type === "ol");
    assert.ok(ol && ol.type === "ol");
    assert.match(ol.items[0]!, /nested a/);
    assert.match(ol.items[1]!, /nested c/);
  });

  it("heading between sections ends the prior ol (new list may start after)", () => {
    const src = "1. One\n\n### Break\n\n2. Two\n\n3. Three";
    const blocks = parseExecutiveChatBlocks(src);
    const ols = blocks.filter((b) => b.type === "ol");
    assert.equal(ols.length, 2);
    assert.equal(ols[0]!.items.length, 1);
    assert.equal(ols[1]!.items.length, 2);
  });
});
