// Shared durable incident lifecycle for independent observations.
export function ensureFindings(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS assurance_findings(id TEXT PRIMARY KEY,source TEXT NOT NULL,severity TEXT NOT NULL,status TEXT NOT NULL,first_at INTEGER NOT NULL,last_at INTEGER NOT NULL,resolved_at INTEGER,detail TEXT NOT NULL)`);
}
export function reconcileFinding(db, {id, source, observedAt, failed, severity='HIGH', detail}) {
  if (failed) {
    db.prepare(`INSERT INTO assurance_findings VALUES(?,?,?,'OPEN',?,?,NULL,?)
      ON CONFLICT(id) DO UPDATE SET last_at=excluded.last_at,detail=excluded.detail,
        status='OPEN',resolved_at=NULL
      WHERE excluded.last_at>assurance_findings.last_at
        AND (assurance_findings.resolved_at IS NULL OR excluded.last_at>assurance_findings.resolved_at)`)
      .run(id,source,severity,observedAt,observedAt,JSON.stringify(detail));
  } else {
    db.prepare("UPDATE assurance_findings SET status='RESOLVED',resolved_at=? WHERE source=? AND status='OPEN' AND last_at<?")
      .run(observedAt,source,observedAt);
  }
}
