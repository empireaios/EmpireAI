import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import {
  createAssistantSession,
  decideAssistantCommand,
  fetchAssistantHelp,
  fetchAssistantHistory,
  fetchAssistantMissions,
  fetchWhyEvidence,
  requestAuditGeneration,
  requestMissionGeneration,
  sendAssistantChat,
  type AssistantCommand,
  type AssistantMessage,
  type AssistantWorkflow,
  type WhyEvidenceResult,
} from "@/api/global-assistant";
import { useAuth } from "@/context/AuthContext";
import { useGlobalAssistant } from "@/context/GlobalAssistantContext";
import styles from "./GlobalAssistantPanel.module.css";

type TabId = "chat" | "why" | "missions" | "workflows";

interface GlobalAssistantPanelProps {
  open: boolean;
  onClose: () => void;
}

/** GC-05 — Global AI Assistant (REAL-031/032/033 + Council + ESS). */
export function GlobalAssistantPanel({ open, onClose }: GlobalAssistantPanelProps) {
  const { user } = useAuth();
  const { screenPath, kpiLabel, kpiValue } = useGlobalAssistant();
  const canUse = user?.role === "founder" || user?.role === "admin";

  const [tab, setTab] = useState<TabId>("chat");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<AssistantMessage[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [whyLabel, setWhyLabel] = useState("");
  const [whyValue, setWhyValue] = useState("");
  const [whyResult, setWhyResult] = useState<WhyEvidenceResult | null>(null);
  const [workflows, setWorkflows] = useState<AssistantWorkflow[]>([]);
  const [missions, setMissions] = useState<Array<Record<string, unknown>>>([]);
  const [pendingCommand, setPendingCommand] = useState<AssistantCommand | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const initSession = useCallback(async () => {
    if (!canUse) return;
    const { session } = await createAssistantSession(screenPath, kpiLabel ?? undefined);
    setSessionId(session.sessionId);
    const { history: initialHistory } = await fetchAssistantHistory(session.sessionId);
    setHistory(initialHistory);
  }, [canUse, screenPath, kpiLabel]);

  useEffect(() => {
    if (!open || !canUse) return;
    setTab(kpiLabel ? "why" : "chat");
    setWhyLabel(kpiLabel ?? "");
    setWhyValue(kpiValue ?? "");
    setWhyResult(null);
    setPendingCommand(null);
    void initSession();
    void fetchAssistantHelp(screenPath)
      .then((help) => setWorkflows(help.workflows))
      .catch(() => setWorkflows([]));
    void fetchAssistantMissions()
      .then((result) => setMissions(result.missions as Array<Record<string, unknown>>))
      .catch(() => setMissions([]));
  }, [open, canUse, screenPath, kpiLabel, kpiValue, initSession]);

  useEffect(() => {
    if (open && kpiLabel && sessionId) {
      void fetchWhyEvidence({ screenPath, kpiLabel, kpiValue: kpiValue ?? undefined })
        .then(setWhyResult)
        .catch(() => setWhyResult(null));
    }
  }, [open, kpiLabel, kpiValue, screenPath, sessionId]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [history]);

  async function handleSend() {
    if (!sessionId || !message.trim()) return;
    setLoading(true);
    try {
      const result = await sendAssistantChat({
        sessionId,
        message: message.trim(),
        screenPath,
        kpiLabel: kpiLabel ?? undefined,
      });
      setHistory((prev) => [...prev, result.userMessage, result.assistantMessage]);
      setMessage("");
    } finally {
      setLoading(false);
    }
  }

  async function handleWhySubmit() {
    if (!whyLabel.trim()) return;
    setLoading(true);
    try {
      const result = await fetchWhyEvidence({
        screenPath,
        kpiLabel: whyLabel.trim(),
        kpiValue: whyValue.trim() || undefined,
      });
      setWhyResult(result);
    } finally {
      setLoading(false);
    }
  }

  async function handleMissionRequest() {
    if (!sessionId) return;
    const { command } = await requestMissionGeneration(sessionId);
    setPendingCommand(command);
  }

  async function handleAuditRequest() {
    if (!sessionId) return;
    const { command } = await requestAuditGeneration(sessionId, screenPath);
    setPendingCommand(command);
  }

  async function handleCommandDecision(outcome: "approved" | "rejected") {
    if (!pendingCommand) return;
    setLoading(true);
    try {
      const { command } = await decideAssistantCommand(pendingCommand.commandId, outcome, screenPath);
      setPendingCommand(command.status === "pending" ? command : null);
      if (command.status === "executed" && command.type === "mission_generation") {
        void fetchAssistantMissions().then((r) => setMissions(r.missions as Array<Record<string, unknown>>));
      }
    } finally {
      setLoading(false);
    }
  }

  if (!open || !canUse) return null;

  return (
    <>
      <div className={styles.panelOverlay} role="presentation" onMouseDown={onClose} />
      <aside className={styles.panel} role="dialog" aria-modal="true" aria-label="Global AI Assistant">
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>
              <Sparkles size={18} aria-hidden="true" style={{ verticalAlign: "text-bottom", marginRight: "0.375rem" }} />
              AI Assistant
            </h2>
            <p className={styles.subtitle}>GC-05 · recommend-only · King decides</p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close assistant">
            <X size={18} />
          </button>
        </div>

        <div className={styles.tabs} role="tablist">
          {(["chat", "why", "missions", "workflows"] as TabId[]).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? styles.tabActive : styles.tab}
              onClick={() => setTab(id)}
            >
              {id === "chat" ? "Chat" : id === "why" ? "Why?" : id === "missions" ? "Missions" : "Workflows"}
            </button>
          ))}
        </div>

        <div className={styles.body} ref={bodyRef}>
          {tab === "chat" && (
            <div className={styles.messages}>
              {history.length === 0 ? (
                <p className={styles.empty}>Starting assistant session…</p>
              ) : (
                history.map((entry) => (
                  <div
                    key={entry.messageId}
                    className={entry.role === "user" ? styles.messageUser : styles.messageAssistant}
                  >
                    {entry.content}
                    {entry.evidence && entry.evidence.length > 0 && (
                      <ul className={styles.evidenceList}>
                        {entry.evidence.slice(0, 4).map((ev) => (
                          <li key={ev.evidenceId} className={styles.evidenceItem}>
                            [{ev.source}] {ev.title}: {ev.summary}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "why" && (
            <>
              <div className={styles.whyForm}>
                <label className={styles.label} htmlFor="why-kpi">
                  KPI label
                </label>
                <input
                  id="why-kpi"
                  className={styles.input}
                  value={whyLabel}
                  onChange={(e) => setWhyLabel(e.target.value)}
                  placeholder="e.g. Empire Health, Net profit, ROAS"
                />
                <label className={styles.label} htmlFor="why-value">
                  Current value (optional)
                </label>
                <input
                  id="why-value"
                  className={styles.input}
                  value={whyValue}
                  onChange={(e) => setWhyValue(e.target.value)}
                  placeholder="e.g. 72%, $12,400"
                />
                <button type="button" className={styles.sendButton} disabled={loading} onClick={() => void handleWhySubmit()}>
                  Get evidence
                </button>
              </div>
              {whyResult ? (
                <article className={styles.card}>
                  <h3 className={styles.cardTitle}>{whyResult.headline}</h3>
                  <p className={styles.cardBody}>{whyResult.summary}</p>
                  <ul className={styles.evidenceList}>
                    {whyResult.evidence.map((ev) => (
                      <li key={ev.evidenceId} className={styles.evidenceItem}>
                        <strong>[{ev.source}]</strong> {ev.title}: {ev.summary}
                      </li>
                    ))}
                  </ul>
                </article>
              ) : (
                <p className={styles.empty}>Ask Why? on any KPI — evidence from REAL-031/032/033, Council, and ESS.</p>
              )}
            </>
          )}

          {tab === "missions" && (
            <>
              <div className={styles.actionRow}>
                <button type="button" className={styles.actionButtonPrimary} onClick={() => void handleMissionRequest()}>
                  Generate missions
                </button>
                <button type="button" className={styles.actionButton} onClick={() => void handleAuditRequest()}>
                  Generate Executive Audit
                </button>
              </div>
              {pendingCommand && (
                <article className={styles.card}>
                  <h3 className={styles.cardTitle}>Approval required: {pendingCommand.title}</h3>
                  <p className={styles.cardBody}>{pendingCommand.summary}</p>
                  <div className={styles.actionRow}>
                    <button type="button" className={styles.actionButtonPrimary} onClick={() => void handleCommandDecision("approved")}>
                      Approve
                    </button>
                    <button type="button" className={styles.actionButton} onClick={() => void handleCommandDecision("rejected")}>
                      Reject
                    </button>
                  </div>
                </article>
              )}
              {missions.length === 0 ? (
                <p className={styles.empty}>No missions loaded.</p>
              ) : (
                missions.slice(0, 8).map((mission) => (
                  <article key={String(mission.missionId)} className={styles.card}>
                    <h3 className={styles.cardTitle}>{String(mission.title)}</h3>
                    <p className={styles.cardBody}>
                      ROI {String(mission.expectedRoi)}x · confidence {String(mission.confidence)}% · approval required
                    </p>
                  </article>
                ))
              )}
            </>
          )}

          {tab === "workflows" && (
            <>
              {workflows.length === 0 ? (
                <p className={styles.empty}>No guided workflows for this screen.</p>
              ) : (
                workflows.map((workflow) => (
                  <article key={workflow.workflowId} className={styles.card}>
                    <h3 className={styles.cardTitle}>{workflow.title}</h3>
                    <p className={styles.cardBody}>{workflow.description}</p>
                    <ol className={styles.evidenceList}>
                      {workflow.steps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </article>
                ))
              )}
            </>
          )}
        </div>

        {tab === "chat" && (
          <div className={styles.composer}>
            <input
              className={styles.input}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask for help, journey status, or recommendations…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
            />
            <button type="button" className={styles.sendButton} disabled={loading || !message.trim()} onClick={() => void handleSend()}>
              Send
            </button>
          </div>
        )}

        <div className={styles.footer}>REAL-031 · REAL-032 · REAL-033 · Council · ESS · Pillow bridge</div>
      </aside>
    </>
  );
}

export function useGlobalAssistantShortcut(onOpen: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        onOpen();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpen, enabled]);
}
