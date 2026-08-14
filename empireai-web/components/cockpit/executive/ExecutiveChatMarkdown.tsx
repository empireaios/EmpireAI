/**
 * Lightweight Markdown rendering for Pillow executive chat.
 * No new dependency — supports common executive formatting only.
 * Does not execute HTML/scripts.
 */

import React from "react";
import { looksLikeMarkdown } from "@/lib/cockpit/executive/executive-chat-markdown";

export { looksLikeMarkdown };

type Block =
  | { type: "p"; text: string }
  | { type: "h"; level: 1 | 2 | 3; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

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

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (!line.trim()) {
      i += 1;
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      blocks.push({
        type: "h",
        level: Math.min(3, heading[1].length) as 1 | 2 | 3,
        text: heading[2].trim(),
      });
      i += 1;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*[-*]\s+/, "").trim());
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*\d+[.)]\s+/, "").trim());
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }
    const parts: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      (lines[i] ?? "").trim() &&
      !/^(#{1,3})\s+/.test(lines[i] ?? "") &&
      !/^\s*[-*]\s+/.test(lines[i] ?? "") &&
      !/^\s*\d+[.)]\s+/.test(lines[i] ?? "")
    ) {
      parts.push(lines[i] ?? "");
      i += 1;
    }
    blocks.push({ type: "p", text: parts.join(" ").replace(/\s+/g, " ").trim() });
  }
  return blocks;
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
      <p className={`whitespace-pre-wrap leading-relaxed ${className}`.trim()}>
        {text}
      </p>
    );
  }

  const blocks = parseBlocks(text);
  return (
    <div className={`space-y-3 text-[15px] leading-relaxed sm:text-base ${className}`.trim()}>
      {blocks.map((b, idx) => {
        if (b.type === "h") {
          const sizes =
            b.level === 1
              ? "text-lg font-semibold"
              : b.level === 2
                ? "text-base font-semibold"
                : "text-[15px] font-semibold";
          return (
            <p key={idx} className={`${sizes} text-[#f0e6d2]`}>
              {inlineFormat(b.text)}
            </p>
          );
        }
        if (b.type === "ul") {
          return (
            <ul key={idx} className="list-disc space-y-1.5 pl-5">
              {b.items.map((item, j) => (
                <li key={j}>{inlineFormat(item)}</li>
              ))}
            </ul>
          );
        }
        if (b.type === "ol") {
          return (
            <ol key={idx} className="list-decimal space-y-1.5 pl-5">
              {b.items.map((item, j) => (
                <li key={j}>{inlineFormat(item)}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={idx} className="whitespace-pre-wrap">
            {inlineFormat(b.text)}
          </p>
        );
      })}
    </div>
  );
}
