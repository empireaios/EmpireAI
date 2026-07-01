import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

import { PillowApprovalCard, PillowMessageBubble, PillowStatusBanner } from "@/components/pillow/PillowCards";
import { PillowComposer } from "@/components/pillow/PillowComposer";
import { usePillowCompanion } from "@/context/PillowCompanionContext";
import { paths } from "@/routes/paths";
import styles from "./PillowCompanionPanel.module.css";

export function PillowCompanionPanel() {
  const { open, closeCompanion, workspaceContext, chat } = usePillowCompanion();
  const threadRef = useRef<HTMLDivElement>(null);
  const {
    sessionId,
    messages,
    streaming,
    loading,
    error,
    hostStatus,
    pendingApproval,
    decidingId,
    sendMessage,
    decideApproval,
  } = chat;

  useEffect(() => {
    if (!open) return;
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming, open]);

  return (
    <aside
      className={styles.panel}
      data-open={open || undefined}
      aria-label="Pillow Executive Companion"
      aria-hidden={!open}
    >
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h2>Pillow · Executive Companion</h2>
          <p>One conversation · session continuity · no page navigation</p>
          <span className={styles.contextChip}>{workspaceContext.screenTitle}</span>
        </div>
        <button type="button" className={styles.closeBtn} aria-label="Close companion" onClick={closeCompanion}>
          <X size={18} />
        </button>
      </header>

      <div className={styles.body}>
        <PillowStatusBanner
          health={hostStatus?.health ?? "Idle"}
          lifecycle={hostStatus?.lifecycle ?? "Unknown"}
          streaming={streaming}
        />

        {error && <p className={styles.inlineError}>{error}</p>}

        <div ref={threadRef} className={styles.thread}>
          {loading && messages.length === 0 && (
            <p className={styles.placeholder}>Starting Pillow session…</p>
          )}
          {!loading && messages.length === 0 && (
            <p className={styles.placeholder}>
              Pillow sees you on <strong>{workspaceContext.screenTitle}</strong>. Ask about this screen,
              your workflow, or executive recommendations — no need to explain where you are.
            </p>
          )}
          {messages.map((message) => (
            <PillowMessageBubble
              key={message.id}
              role={message.role}
              content={message.content || (message.streaming ? "…" : "")}
              provider={message.provider}
              result={message.result}
            />
          ))}
        </div>

        {pendingApproval && (
          <PillowApprovalCard
            approval={pendingApproval}
            busy={decidingId === pendingApproval.approvalId}
            onDecide={(outcome) => void decideApproval(pendingApproval.approvalId, outcome)}
          />
        )}

        <PillowComposer
          disabled={!sessionId || loading}
          streaming={streaming}
          onSend={(message, provider) => void sendMessage(message, provider)}
        />

        <div className={styles.footerLinks}>
          <Link to={paths.dashboard.pillowLearning}>Executive Learning Review</Link>
        </div>
      </div>
    </aside>
  );
}
