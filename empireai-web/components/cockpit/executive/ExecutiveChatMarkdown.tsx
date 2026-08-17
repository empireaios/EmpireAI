/**
 * Lightweight Markdown rendering for Pillow executive chat.
 * No new dependency — supports common executive formatting only.
 * Does not execute HTML/scripts.
 */

import React from "react";
import {
  looksLikeMarkdown,
  parseExecutiveChatBlocks,
} from "@/lib/cockpit/executive/executive-chat-markdown";

export { looksLikeMarkdown, parseExecutiveChatBlocks };

function inlineFormat(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(text.slice(last, m.index));
    }
    const token = m[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <strong key={`b${key++}`} className="font-semibold text-[#f0e6d2]">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(
        <em key={`i${key++}`} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <code
          key={`c${key++}`}
          className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.85em]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(token);
    }
    last = m.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function renderListItemBody(item: string): React.ReactNode {
  const lines = item.split("\n");
  if (lines.length === 1) return inlineFormat(item);
  return (
    <span className="whitespace-pre-wrap">
      {lines.map((ln, k) => (
        <React.Fragment key={k}>
          {k > 0 ? "\n" : null}
          {/^\s*[-*]\s+/.test(ln)
            ? inlineFormat(ln.replace(/^\s*[-*]\s+/, "• "))
            : inlineFormat(ln)}
        </React.Fragment>
      ))}
    </span>
  );
}

export function ExecutiveChatMarkdown({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  const text = content ?? "";
  if (!text.trim()) return null;

  if (!looksLikeMarkdown(text)) {
    return (
      <p
        className={`max-w-[42rem] whitespace-pre-wrap text-[15px] leading-[1.65] sm:text-base ${className}`.trim()}
      >
        {text}
      </p>
    );
  }

  const blocks = parseExecutiveChatBlocks(text);
  return (
    <div
      className={`max-w-[42rem] space-y-4 text-[15px] leading-[1.65] sm:text-base ${className}`.trim()}
    >
      {blocks.map((b, idx) => {
        if (b.type === "h") {
          const sizes =
            b.level === 1
              ? "text-lg font-semibold"
              : b.level === 2
                ? "text-base font-semibold"
                : "text-[15px] font-semibold";
          return (
            <p
              key={idx}
              className={`${sizes} ${idx > 0 ? "pt-2" : ""} text-[#f0e6d2]`.trim()}
            >
              {inlineFormat(b.text)}
            </p>
          );
        }
        if (b.type === "ul") {
          return (
            <ul key={idx} className="list-disc space-y-2 pl-5 marker:text-[#d4af37]/70">
              {b.items.map((item, j) => (
                <li key={j} className="pl-0.5">
                  {inlineFormat(item)}
                </li>
              ))}
            </ul>
          );
        }
        if (b.type === "ol") {
          return (
            <ol key={idx} className="list-decimal space-y-2.5 pl-5 marker:text-[#d4af37]/70">
              {b.items.map((item, j) => (
                <li key={j} className="pl-0.5">
                  {renderListItemBody(item)}
                </li>
              ))}
            </ol>
          );
        }
        return (
          <p key={idx} className="whitespace-pre-wrap text-[#e8e0d0]/95">
            {inlineFormat(b.text)}
          </p>
        );
      })}
    </div>
  );
}
