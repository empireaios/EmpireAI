import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type { WorkspaceSession, ConversationTurn } from './types.js';

/** Separate from the cost ledger. Stores conversation evidence, never authority. */
export class ReasoningState {
  constructor(private readonly filename: string) {}
  private use<T>(run: (db: DatabaseSync) => T): T {
    if (!path.isAbsolute(this.filename) || fs.realpathSync(path.dirname(this.filename)) !== path.dirname(this.filename)) throw Error('Reasoning store path refused');
    if (!fs.existsSync(this.filename)) fs.closeSync(fs.openSync(this.filename, 'wx', 0o600));
    const stat = fs.lstatSync(this.filename);
    if (!stat.isFile() || stat.nlink !== 1 || fs.realpathSync(this.filename) !== this.filename || stat.size > 32*1024*1024) throw Error('Reasoning store refused');
    const db = new DatabaseSync(this.filename, {allowExtension:false, timeout:1000});
    try {
      db.exec(`PRAGMA trusted_schema=OFF; PRAGMA journal_mode=DELETE; PRAGMA synchronous=EXTRA;
        CREATE TABLE IF NOT EXISTS transcripts(workspace TEXT NOT NULL, session TEXT NOT NULL, updated TEXT NOT NULL, turns TEXT NOT NULL, PRIMARY KEY(workspace,session)) STRICT;
        CREATE TABLE IF NOT EXISTS pending_learning(id TEXT PRIMARY KEY, workspace TEXT NOT NULL, session TEXT NOT NULL, request TEXT NOT NULL, created TEXT NOT NULL, evidence TEXT NOT NULL, status TEXT NOT NULL CHECK(status='pending_owner_review')) STRICT;`);
      if (db.prepare('PRAGMA quick_check').get()?.quick_check !== 'ok') throw Error('Reasoning store integrity refused');
      return run(db);
    } finally { db.close(); }
  }
  save(session: WorkspaceSession): void {
    let bytes=0;
    const turns: ConversationTurn[]=[];
    for (const turn of session.conversationHistory.slice(-48).reverse()) {
      if (!['user','assistant'].includes(turn.role)) continue;
      bytes += Buffer.byteLength(turn.content);
      if (bytes > 64000) break;
      turns.unshift({role:turn.role,content:turn.content,timestamp:turn.timestamp,requestId:turn.requestId,provider:turn.provider});
    }
    this.use(db => {db.prepare('INSERT INTO transcripts VALUES(?,?,?,?) ON CONFLICT(workspace,session) DO UPDATE SET updated=excluded.updated, turns=excluded.turns').run(session.workspaceId,session.sessionId,new Date().toISOString(),JSON.stringify(turns));});
  }
  latest(workspace:string, maxAgeMs:number): string | null {
    return this.use(db => {
      const row=db.prepare('SELECT session,updated FROM transcripts WHERE workspace=? ORDER BY updated DESC LIMIT 1').get(workspace);
      if (!row || Date.now()-Date.parse(String(row.updated)) > maxAgeMs) return null;
      return String(row.session);
    });
  }
  load(workspace: string, session: string): ConversationTurn[] | null {
    return this.use(db => {
      const row=db.prepare('SELECT turns FROM transcripts WHERE workspace=? AND session=?').get(workspace,session);
      if (!row) return null;
      const turns=JSON.parse(String(row.turns)) as ConversationTurn[];
      if (!Array.isArray(turns) || turns.length>48 || turns.some(t=>!['user','assistant'].includes(t.role)||typeof t.content!=='string')) throw Error('Transcript invalid');
      return turns;
    });
  }
  capture(workspace:string,session:string,request:string,user:string,answer:string):string {
    const id=createHash('sha256').update(JSON.stringify([workspace,request])).digest('hex');
    this.use(db=> {db.prepare('INSERT OR IGNORE INTO pending_learning VALUES(?,?,?,?,?,?,?)').run(id,workspace,session,request,new Date().toISOString(),JSON.stringify({source:'conversation',trust:'untrusted_observation',user:user.slice(0,8000),answer:answer.slice(0,12000),grantsAuthority:false}), 'pending_owner_review');});
    return id;
  }
  pending(workspace:string): unknown[] {
    return this.use(db=>db.prepare('SELECT id,session,request,created,evidence,status FROM pending_learning WHERE workspace=? ORDER BY created DESC LIMIT 8').all(workspace).map(row=>({...row,evidence:String(row.evidence).slice(0,1500),truncated:String(row.evidence).length>1500})));
  }
}
export function productionReasoningState(): ReasoningState | null {
  if (process.env.EMPIRE_RUNTIME_PROFILE !== 'LOCKED_COMMISSIONING_V1') return null;
  const root=process.env.RAILWAY_VOLUME_MOUNT_PATH;
  if (!root || process.env.DATABASE_PATH !== path.join(root,'commissioning','empireai-brain.db')) throw Error('Durable reasoning volume unavailable');
  return new ReasoningState(path.join(root,'commissioning','pillow-reasoning.sqlite'));
}
