"use client";

import { useEffect, useId, useRef } from "react";
import layout from "./PillowConversationLayout.module.css";

type Exchange = { id: string; content: string; recordedAt: string };

function displayTitle(content: string) {
  const text = content.replace(/\s+/g, " ").trim();
  if (!text) return "Saved exchange";
  if (/^(?:\{|\[|```|curl\s|\/pillow-request\b|\/api\/|[a-z_]+\.[a-z_]+\s*\()/i.test(text)) return "Saved technical request";
  return text.length > 72 ? `${text.slice(0, 69).trimEnd()}…` : text;
}

/** Display labels never change persisted titles, messages, order or IDs. */
export function MobileConversationPicker({ exchanges, selected, onSelect }: {
  exchanges: Exchange[]; selected: string; onSelect: (id: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const chosen = exchanges.find(exchange => exchange.id === selected);
  useEffect(() => {
    const updateBounds = () => {
      const node = dialog.current;
      if (!node) return;
      const viewport = window.visualViewport;
      node.style.setProperty("--picker-height", `${viewport?.height ?? window.innerHeight}px`);
      node.style.setProperty("--picker-top", `${(viewport?.offsetTop ?? 0) + 12}px`);
      if (window.innerWidth > 700 && node.open) node.close();
    };
    updateBounds();
    window.addEventListener("resize", updateBounds);
    window.visualViewport?.addEventListener("resize", updateBounds);
    window.visualViewport?.addEventListener("scroll", updateBounds);
    return () => {
      window.removeEventListener("resize", updateBounds);
      window.visualViewport?.removeEventListener("resize", updateBounds);
      window.visualViewport?.removeEventListener("scroll", updateBounds);
    };
  }, []);
  return <>
    <button ref={trigger} type="button" className={layout.mobileHistoryTrigger}
      aria-label="Conversation history" aria-haspopup="dialog" aria-controls={id}
      onClick={() => dialog.current?.showModal()}>
      <span>{chosen ? displayTitle(chosen.content) : "Choose a saved exchange"}</span><span aria-hidden="true">▾</span>
    </button>
    <dialog ref={dialog} id={id} aria-labelledby={`${id}-title`} className={layout.historyDialog}
      onKeyDown={event => {
        if (event.key !== "Tab") return;
        const targets = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button, summary")).filter(node => node.getClientRects().length);
        const first = targets[0], last = targets.at(-1);
        if (event.shiftKey && document.activeElement === first && last) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last && first) { event.preventDefault(); first.focus(); }
      }}
      onClose={() => { if (window.innerWidth <= 700) trigger.current?.focus({ preventScroll: true }); }}>
      <div className={layout.historyDialogHeader}>
        <h2 id={`${id}-title`}>Conversation history</h2>
        <button type="button" onClick={() => dialog.current?.close()}>Close</button>
      </div>
      <div className={layout.historyOptions} data-testid="conversation-picker-options">
        {exchanges.length === 0 && <p>No saved exchanges yet.</p>}
        <ul aria-label="Saved exchanges">
          {exchanges.map((exchange, index) => <li key={exchange.id}>
            <button type="button" data-exchange-id={exchange.id} aria-current={selected === exchange.id ? "true" : undefined}
              onClick={() => { onSelect(exchange.id); dialog.current?.close(); }}>
              <small>{Number.isFinite(Date.parse(exchange.recordedAt)) ? new Date(exchange.recordedAt).toLocaleDateString("en-SG") : "Date unknown"} · Exchange {index + 1}{selected === exchange.id ? " · Selected" : ""}</small>
              <span>{displayTitle(exchange.content)}</span>
            </button>
            <details><summary>Full original title</summary><p>{exchange.content}</p></details>
          </li>)}
        </ul>
      </div>
    </dialog>
  </>;
}
