'use strict';
// Read-only operator export. No provider calls, prompts, credentials or writes.
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');
const { createHash } = require('node:crypto');
const filename = process.argv[2] || '/data/commissioning/openai-october-2026.sqlite';
const db = new DatabaseSync(filename, { readOnly: true, allowExtension: false, timeout: 3000 });
try {
  db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF; BEGIN');
  if (db.prepare('PRAGMA application_id').get().application_id !== 1162430793 || db.prepare('PRAGMA user_version').get().user_version !== 1 || db.prepare('PRAGMA quick_check').get().quick_check !== 'ok') throw Error('Ledger identity or integrity refused');
  const tables = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name));
  const providers = tables.has('call_providers') ? new Map(db.prepare('SELECT call_id,provider,request_key FROM call_providers').all().map(r => [r.call_id,r])) : new Map();
  const requests = tables.has('inference_requests') ? db.prepare('SELECT id,timestamp FROM inference_requests ORDER BY timestamp,id').all() : [];
  const rows = db.prepare('SELECT id,timestamp,model,reserved_micro_usd,status,usage_json,estimated_micro_usd,provider_response_id,invoice_actual_micro_usd FROM calls ORDER BY timestamp,id').all();
  let reserved = 0;
  const records = rows.map(r => {
    for (const key of ['reserved_micro_usd','estimated_micro_usd','invoice_actual_micro_usd']) if (r[key] !== null && (!Number.isSafeInteger(r[key]) || r[key] < 0)) throw Error('Invalid accounting quantity');
    if (r.reserved_micro_usd <= 0 || (r.estimated_micro_usd !== null && r.estimated_micro_usd > r.reserved_micro_usd)) throw Error('Invalid reservation bound');
    reserved += r.reserved_micro_usd;
    const usage = r.usage_json ? JSON.parse(r.usage_json) : null;
    const safeUsage = usage ? Object.fromEntries(['inputTokens','outputTokens','totalTokens','cachedInputTokens','cacheWriteTokens','reasoningTokens'].filter(k => Object.hasOwn(usage,k)).map(k => [k,usage[k]])) : null;
    if (safeUsage && Object.values(safeUsage).some(v => !Number.isSafeInteger(v) || v < 0)) throw Error('Invalid usage');
    const p = providers.get(r.id);
    const { usage_json, ...safe } = r;
    return {...safe,provider:p?.provider || 'openai',requestKey:p?.request_key || null,usage:safeUsage,reservationReleased:false};
  });
  if (!Number.isSafeInteger(reserved) || reserved > 20000000) throw Error('Shared ceiling invalid');
  const result = {schema:'empireai-current-accounting-v1',observedAt:new Date().toISOString(),readOnly:true,initializationMarkerPresent:fs.existsSync(filename+'.initialized'),ceilingMicroUsd:20000000,reservedMicroUsd:reserved,remainingReservationHeadroomMicroUsd:20000000-reserved,records,requests,requestLinkageAvailable:tables.has('call_providers') && tables.has('inference_requests'),unsettledUsageCount:records.filter(r=>r.usage===null).length,invoiceUnknownCount:records.filter(r=>r.invoice_actual_micro_usd===null).length,interpretation:'All reservations remain charged against the cumulative ceiling, including uncertain historical attempts. Usage settlement does not release the conservative reservation. Estimates are not actual provider invoices. No budget reset or paid call performed.'};
  result.recordDigestSha256 = createHash('sha256').update(JSON.stringify({records,requests})).digest('hex');
  db.exec('COMMIT');
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
} finally { if(db.isTransaction)db.exec('ROLLBACK'); db.close(); }
