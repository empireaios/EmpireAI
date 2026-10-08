import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { DurableChatRequest } from './pillow-chat-request-store.js';

export function requestReceiptPath(): string | null {
  const root=process.env.RAILWAY_VOLUME_MOUNT_PATH;
  return root && process.env.EMPIRE_RUNTIME_PROFILE==='LOCKED_COMMISSIONING_V1'
    ? path.join(root,'commissioning','pillow-request-receipts.sqlite') : null;
}

/** Evidence copy only: never used to dispatch, replay, or authorize a request. */
export function archivePillowRequest(r:DurableChatRequest): void {
  const filename=requestReceiptPath();
  if(!filename || !r.workspaceId) return;
  if(fs.realpathSync(path.dirname(filename))!==path.dirname(filename)) throw Error('RECEIPT_PATH');
  if(!fs.existsSync(filename))fs.closeSync(fs.openSync(filename,'wx',0o600));
  if(!fs.lstatSync(filename).isFile() || fs.realpathSync(filename)!==filename)throw Error('RECEIPT_PATH');
  // Explicit projection excludes session tokens, queue inputs and credentials.
  const body=JSON.stringify({requestId:r.requestId,sessionId:r.sessionId,workspaceId:r.workspaceId,
    createdAt:r.createdAt,updatedAt:r.updatedAt,status:r.status,failureClass:r.failureClass,
    deliveryState:r.deliveryState,observability:r.observability,attemptCount:r.attemptCount,
    messagePreview:r.messagePreview,lastError:r.lastError,upstreamStatus:r.upstreamStatus,finalResult:r.finalResult});
  const db=new DatabaseSync(filename,{allowExtension:false,timeout:1000});
  try {
    db.exec('PRAGMA trusted_schema=OFF; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS receipts(workspace TEXT, request TEXT, session TEXT, updated TEXT, body TEXT, PRIMARY KEY(workspace,request)) STRICT; CREATE INDEX IF NOT EXISTS receipt_session ON receipts(workspace,session,updated)');
    db.prepare('INSERT INTO receipts VALUES(?,?,?,?,?) ON CONFLICT(workspace,request) DO UPDATE SET session=excluded.session,updated=excluded.updated,body=excluded.body WHERE excluded.updated>=receipts.updated').run(r.workspaceId,r.requestId,r.sessionId,r.updatedAt,body);
  } finally {db.close();}
}

export function preservePillowReceipt(r:DurableChatRequest):void {
  try {archivePillowRequest(r);} catch {console.warn('Pillow readback receipt unavailable; canonical request remains authoritative');}
}
