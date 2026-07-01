import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  approveExecutiveLearning,
  archiveExecutiveLearning,
  editExecutiveLearning,
  fetchExecutiveLearningReview,
  rejectExecutiveLearning,
  type ExecutiveLearningReview,
  type PendingExecutiveLearning,
} from "@/api/executive-learning";
import { paths } from "@/routes/paths";
import styles from "./ExecutiveLearningReviewPage.module.css";

const CATEGORY_LABELS: Record<string, string> = {
  A: "Permanent Executive Principle",
  B: "Strategic Knowledge",
  C: "Project Working Knowledge",
  D: "Session Context",
};

export function ExecutiveLearningReviewPage() {
  const workspaceId = "grand-king-workspace";
  const [review, setReview] = useState<ExecutiveLearningReview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExecutiveLearningReview(workspaceId);
      setReview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Executive Learning Review");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleApprove(item: PendingExecutiveLearning) {
    await approveExecutiveLearning(item.learningId, workspaceId);
    await refresh();
  }

  async function handleReject(item: PendingExecutiveLearning) {
    await rejectExecutiveLearning(item.learningId, "Rejected by Grand King", workspaceId);
    await refresh();
  }

  async function handleEdit(item: PendingExecutiveLearning) {
    const title = window.prompt("Edit title", item.title);
    if (!title) return;
    await editExecutiveLearning(item.learningId, { title }, workspaceId);
    await refresh();
  }

  async function handleArchive(learningId: string) {
    await archiveExecutiveLearning(learningId, workspaceId);
    await refresh();
  }

  const stats = review?.stats;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div>
          <h1>Executive Learning Review</h1>
          <p>
            Pillow learns how Grand King thinks — not chat memory. Permanent changes require your
            approval.
          </p>
        </div>
        <Link to={paths.dashboard.home}>← Mission Home</Link>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      {loading && !review ? (
        <p className={styles.empty}>Loading executive learnings…</p>
      ) : (
        <>
          <section className={styles.stats} aria-label="Learning statistics">
            <article className={styles.statCard}>
              <strong>{stats?.newLearnings ?? 0}</strong>
              <span>New Learnings</span>
            </article>
            <article className={styles.statCard}>
              <strong>{stats?.pendingConfirmation ?? 0}</strong>
              <span>Pending Confirmation</span>
            </article>
            <article className={styles.statCard}>
              <strong>{stats?.rejected ?? 0}</strong>
              <span>Rejected</span>
            </article>
            <article className={styles.statCard}>
              <strong>{stats?.approved ?? 0}</strong>
              <span>Approved</span>
            </article>
          </section>

          <div className={styles.grid}>
            <section className={styles.panel}>
              <h2>Pending Executive Learning</h2>
              <div className={styles.list}>
                {(review?.pending ?? []).length === 0 ? (
                  <p className={styles.empty}>No pending learnings.</p>
                ) : (
                  review!.pending.map((item) => (
                    <article key={item.learningId} className={styles.card}>
                      <div className={styles.cardHeader}>
                        <h3>{item.title}</h3>
                        <span className={styles.badge}>
                          Cat {item.category} · {Math.round(item.confidence * 100)}%
                        </span>
                      </div>
                      <p className={styles.meta}>{CATEGORY_LABELS[item.category]}</p>
                      <p>{item.description}</p>
                      <p className={styles.meta}>
                        Observation: {item.observation}
                      </p>
                      <p className={styles.meta}>Status: {item.status.replace(/_/g, " ")}</p>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          data-primary="true"
                          onClick={() => void handleApprove(item)}
                        >
                          Approve
                        </button>
                        <button type="button" onClick={() => void handleReject(item)}>
                          Reject
                        </button>
                        <button type="button" onClick={() => void handleEdit(item)}>
                          Edit
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className={styles.panel}>
              <h2>Executive Knowledge Base</h2>
              <div className={styles.list}>
                {(review?.knowledgeBase ?? []).length === 0 ? (
                  <p className={styles.empty}>No approved learnings yet.</p>
                ) : (
                  review!.knowledgeBase.map((item) => (
                    <article key={item.learningId} className={styles.card}>
                      <div className={styles.cardHeader}>
                        <h3>{item.title}</h3>
                        <span className={styles.badge}>Cat {item.category}</span>
                      </div>
                      <p>{item.description}</p>
                      <p className={styles.meta}>
                        Approved {new Date(item.approvedAt).toLocaleString()} by {item.approvedBy}
                      </p>
                      <p className={styles.meta}>
                        Reasoning areas: {item.affectedReasoningAreas.join(", ")}
                      </p>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          onClick={() => void handleArchive(item.learningId)}
                        >
                          Archive
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
