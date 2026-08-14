import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { looksLikeMarkdown } from "./executive-chat-markdown.ts";

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
});
