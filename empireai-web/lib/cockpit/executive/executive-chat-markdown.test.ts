import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countInlineNextSectionOccurrences,
  countOrderedListBlocks,
  countTopLevelOrderedItems,
  looksLikeMarkdown,
  parseExecutiveChatBlocks,
} from "./executive-chat-markdown.ts";

describe("ExecutiveChatMarkdown helpers", () => {
  it("renders saved pipe tables as cells without collapsing or changing the source", () => {
    const src = "| Test | Required support |\r\n|---|---|\r\n| **Customer value** | Evidence. 2. Next check |\r\n| Served economics | Costs and margin |";
    assert.equal(looksLikeMarkdown(src), true);
    assert.deepEqual(parseExecutiveChatBlocks(src), [{
      type: "table", headers: ["Test", "Required support"], rows: [
        ["**Customer value**", "Evidence. 2. Next check"],
        ["Served economics", "Costs and margin"],
      ],
    }]);
    assert.ok(src.includes("\r\n|---|---|\r\n"));
  });

  it("supports optional outer pipes, alignment delimiters, escaped pipes and text-only HTML", () => {
    assert.deepEqual(parseExecutiveChatBlocks("Name | Evidence\n:--- | ---:\nA\\|B | <script>alert(1)</script>"), [{
      type: "table", headers: ["Name", "Evidence"], rows: [["A|B", "<script>alert(1)</script>"]],
    }]);
  });

  it("does not swallow tables after prose or list bodies, or the following paragraph", () => {
    const table = "| Test | Support |\n|---|---|\n| Value | Evidence |";
    for (const prefix of ["Introduction", "1. Review\nDetails"]) {
      const blocks = parseExecutiveChatBlocks(`${prefix}\n${table}\n\nAfter the table.`);
      assert.equal(blocks.length, 3);
      assert.equal(blocks[1]?.type, "table");
      assert.deepEqual(blocks[2], { type: "p", text: "After the table." });
    }
  });

  it("leaves ordinary pipes and malformed tables as text, retaining mismatched rows", () => {
    for (const src of ["A | B", "A | B\n--- | invalid", "A | B\n--- | --- | ---"]) {
      assert.equal(looksLikeMarkdown(src), false);
      assert.equal(parseExecutiveChatBlocks(src).some((b) => b.type === "table"), false);
    }
    const blocks = parseExecutiveChatBlocks("| A | B |\n|---|---|\n| one | two | three |");
    assert.deepEqual(blocks[1], { type: "p", text: "| one | two | three |" });
  });

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

  it("inline next-section marker is split — no text. 3. Heading continuity", () => {
    const src =
      "1. First\nCapacity remains limited and needs additional fixed investment. 3. Impact of the Unverified Saving\nDetails here.\n4. Next Action";
    assert.equal(countInlineNextSectionOccurrences(src) >= 1, true);
    const blocks = parseExecutiveChatBlocks(src);
    const ol = blocks.find((b) => b.type === "ol");
    assert.ok(ol && ol.type === "ol");
    assert.ok(ol.items.length >= 3);
    assert.match(ol.items[1]!, /Impact of the Unverified/);
    for (const item of ol.items) {
      assert.equal(countInlineNextSectionOccurrences(item), 0);
    }
  });
});
