import { getDatabase } from '../../brain/database.js';

/** Attempt identities only: recipient, body and credentials are never persisted here. */
export function createNotificationDeliveryLedger(scope = 'ws_empire_1') {
  if (!scope) throw new Error('Notification scope required');
  const database = () => {
    const db = getDatabase();
    db.exec(`CREATE TABLE IF NOT EXISTS notification_delivery_attempts (
      scope TEXT NOT NULL, message_id TEXT NOT NULL, fingerprint TEXT NOT NULL,
      status TEXT NOT NULL, attempts INTEGER NOT NULL, updated_at TEXT NOT NULL,
      PRIMARY KEY(scope, message_id))`);
    return db;
  };
  const get = (messageId:string,fingerprint:string) => {
    const row=database().prepare('SELECT fingerprint,status,attempts FROM notification_delivery_attempts WHERE scope=@scope AND message_id=@messageId').get({scope,messageId}) as {fingerprint:string;status:'unknown'|'sent'|'failed';attempts:number}|undefined;
    if(row && row.fingerprint!==fingerprint)throw Error('Notification identity conflict');
    return row;
  };
  return {
    get,
    async reserve(messageId:string,fingerprint:string) {
      const db=database(),old=get(messageId,fingerprint);
      if(old && old.status!=='failed')return null;
      const attempt=(old?.attempts??0)+1;
      // UNKNOWN is committed before dispatch. A crash can never imply permission to resend.
      db.prepare(`INSERT INTO notification_delivery_attempts VALUES(@scope,@messageId,@fingerprint,@status,@attempt,@updatedAt)
        ON CONFLICT(scope,message_id) DO UPDATE SET status=excluded.status,attempts=excluded.attempts,updated_at=excluded.updated_at`).run({scope,messageId,fingerprint,status:'unknown',attempt,updatedAt:new Date().toISOString()});
      await db.requestCriticalPersist();
      return attempt;
    },
    async finish(messageId:string,fingerprint:string,attempt:number,status:'unknown'|'sent'|'failed') {
      const db=database(),old=get(messageId,fingerprint);
      if(!old || old.attempts!==attempt || old.status!=='unknown')throw Error('Notification attempt conflict');
      db.prepare('UPDATE notification_delivery_attempts SET status=@status,updated_at=@updatedAt WHERE scope=@scope AND message_id=@messageId').run({status,updatedAt:new Date().toISOString(),scope,messageId});
      await db.requestCriticalPersist();
    }
  };
}
