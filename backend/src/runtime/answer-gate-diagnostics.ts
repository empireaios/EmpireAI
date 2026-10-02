import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { inferenceLedgerPath } from '../brain/llm/locked-inference.js';

export const answerGateDiagnosticsPath = () => inferenceLedgerPath() + '.answer-gate-diagnostics.sqlite';
const validId = (id: string) => /^[A-Za-z0-9_-]{1,128}$/.test(id);

/** Private examiner evidence. Never injected into model context or released as an answer. */
export function recordAnswerGateDiagnostic(input: { requestId: string; draft: string; findings: unknown },
  filename = answerGateDiagnosticsPath(), environment: NodeJS.ProcessEnv = process.env) {
  if (!validId(input.requestId)) throw Error('Invalid diagnostic request');
  if (fs.existsSync(filename) && (!fs.lstatSync(filename).isFile() || fs.realpathSync(filename) !== filename)) throw Error('Invalid diagnostic store');
  const redact = (text: string) => {
  let draft = text;
  for (const [key, value] of Object.entries(environment)) {
    if (/KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|DATABASE_URL|REDIS_URL/i.test(key) && value && value.length >= 4) draft = draft.split(value).join('[REDACTED]');
  }
  draft = draft.replace(/\b(?:sk-|sk-ant-)[A-Za-z0-9_-]{12,}/g, '[REDACTED]')
    .replace(/\bBearer\s+[A-Za-z0-9._~-]+/gi, 'Bearer [REDACTED]');
  return draft;
  };
  const draft = redact(input.draft);
  const db = new DatabaseSync(filename);
  try {
    fs.chmodSync(filename, 0o600);
    db.exec('PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS rejected_answers(request_id TEXT PRIMARY KEY, observed_at TEXT NOT NULL, draft_sha256 TEXT NOT NULL, redacted_draft TEXT NOT NULL, truncated INTEGER NOT NULL, findings_json TEXT NOT NULL)');
    db.prepare('INSERT OR IGNORE INTO rejected_answers VALUES(?,?,?,?,?,?)').run(input.requestId, new Date().toISOString(),
      createHash('sha256').update(input.draft).digest('hex'), draft.slice(0,24000), draft.length > 24000 ? 1 : 0, redact(JSON.stringify(input.findings)));
  } finally { db.close(); }
}

export function readAnswerGateDiagnostic(requestId: string, filename = answerGateDiagnosticsPath()) {
  if (!validId(requestId)) throw Error('Invalid diagnostic request');
  if (!fs.existsSync(filename)) return null;
  if (!fs.lstatSync(filename).isFile() || fs.realpathSync(filename) !== filename) throw Error('Invalid diagnostic store');
  const db = new DatabaseSync(filename, {readOnly:true, allowExtension:false});
  try { db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF');
    const row = db.prepare('SELECT * FROM rejected_answers WHERE request_id=?').get(requestId);
    return row ? {request_id:String(row.request_id), observed_at:String(row.observed_at), draft_sha256:String(row.draft_sha256), redacted_draft:String(row.redacted_draft), truncated:Number(row.truncated), findings:JSON.parse(String(row.findings_json)), trust:'rejected untrusted model draft; no authority or acceptance credit'} : null;
  } finally { db.close(); }
}
