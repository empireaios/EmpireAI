import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { PillowApprovalCard, PillowMessageBubble, PillowStatusBanner } from "@/components/pillow/PillowCards";
import { PillowComposer } from "@/components/pillow/PillowComposer";
import { PillowExecutivePanel } from "@/components/pillow/PillowExecutivePanel";
import { PillowMissionCenter } from "@/components/pillow/PillowMissionCenter";
import { PillowSessionSidebar } from "@/components/pillow/PillowSessionSidebar";
import { PillowWorkspacePanel } from "@/components/pillow/PillowWorkspacePanel";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { useAuth } from "@/context/AuthContext";
import { usePillowChat } from "@/hooks/usePillowChat";
import styles from "./PillowChatPage.module.css";

export function PillowChatPage() {
  const { user } = useAuth();
  const workspaceId = user?.workspaceId ?? "default";
  const threadRef = useRef<HTMLDivElement>(null);
  const {
    sessionId,
    messages,
    streaming,
    loading,
    error,
    hostStatus,
    cursorStatus,
    missionBoard,
    approvals,
    pendingApproval,
    localSessions,
    sessionSearch,
    setSessionSearch,
    decidingId,
    sendMessage,
    bootstrapSession,
    restoreSession,
    decideApproval,
    bookmarkSession,
    reload,
  } = usePillowChat(workspaceId);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  if (!user) {
    return <LoadingState message="Loading Pillow…" />;
  }

  if (loading && !sessionId) {
    return <LoadingState message="Starting Pillow session…" />;
  }

  if (error && !sessionId) {
    return <ErrorState message={error} onRetry={() => void reload()} />;
  }

  return (
    <EmpirePageShell
      eyebrow="Pillow Program · PILLOW-018"
      title="Pillow Chat"
      description="Grand King conversation surface — streaming intelligence, mission awareness, and approval gates. No autonomous execution."
      actions={
        <Link to="/dashboard/pillow/learning">Executive Learning Review</Link>
      }
    >
      <PillowStatusBanner
        health={hostStatus?.health ?? "Idle"}
        lifecycle={hostStatus?.lifecycle ?? "Unknown"}
        streaming={streaming}
      />

      {error && <p className={styles.inlineError}>{error}</p>}

      <div className={styles.layout}>
        <div className={styles.leftRail}>
          <PillowSessionSidebar
            sessions={localSessions}
            activeSessionId={sessionId}
            search={sessionSearch}
            onSearchChange={setSessionSearch}
            onSelect={(id) => void restoreSession(id)}
            onNewSession={() => void bootstrapSession()}
            onBookmark={bookmarkSession}
          />
          <PillowWorkspacePanel
            workspaceId={workspaceId}
            hostStatus={hostStatus}
            cursorStatus={cursorStatus}
            pendingApproval={pendingApproval}
          />
        </div>

        <div className={styles.chatColumn}>
          <div ref={threadRef} className={styles.thread}>
            {messages.length === 0 && (
              <p className={styles.placeholder}>
                Ask Pillow about Journey position, mission planning, repository health, or executive
                recommendations. Responses stream live via SSE.
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

          {approvals
            .filter((item) => item.status === "Pending" && item.approvalId !== pendingApproval?.approvalId)
            .map((approval) => (
              <PillowApprovalCard
                key={approval.approvalId}
                approval={approval}
                busy={decidingId === approval.approvalId}
                onDecide={(outcome) => void decideApproval(approval.approvalId, outcome)}
              />
            ))}

          <PillowComposer
            disabled={!sessionId}
            streaming={streaming}
            onSend={(message, provider) => void sendMessage(message, provider)}
          />
        </div>

        <div className={styles.rightRail}>
          <PillowMissionCenter board={missionBoard} />
          <PillowExecutivePanel
            hostStatus={hostStatus}
            cursorStatus={cursorStatus}
            approvals={approvals}
          />
        </div>
      </div>
    </EmpirePageShell>
  );
}
