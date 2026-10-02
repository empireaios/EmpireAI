import fs from 'node:fs';
import { createHash } from 'node:crypto';

/** Read already-persisted, secret-free routing receipts; never invoke a provider. */
export function readProviderReceipts(filename: string, workspaceId: string, requestId: string) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(requestId)) throw Error('Invalid request');
  return ['', ':readonly-result'].flatMap(suffix => {
    const requestKey = createHash('sha256').update(workspaceId+'\0'+requestId+suffix).digest('hex');
    const file = filename+'.route-'+requestKey+'.json';
    if (!fs.existsSync(file)) return [];
    const stat=fs.lstatSync(file);
    if (!stat.isFile() || stat.nlink!==1 || stat.size>1024*1024 || fs.realpathSync(file)!==file) throw Error('Receipt unavailable');
    const data=JSON.parse(fs.readFileSync(file,'utf8'));
    if (data.schema!=='locked-inference-operator-readback-v1' || data.requestKey!==requestKey || !Array.isArray(data.attempts) || data.attempts.length>2 || !Array.isArray(data.records) || data.records.length>10) throw Error('Invalid receipt');
    const models: Record<string,string> = {openai:'gpt-6.1-sol',anthropic:'claude-sonnet-5-5',gemini:'gemini-3.8-flash'};
    const safeCode = (code: unknown) => typeof code==='string' && /^(RESOURCE_EXHAUSTED|UNAVAILABLE|INVALID_ARGUMENT|FAILED_PRECONDITION|PERMISSION_DENIED|UNAUTHENTICATED|NOT_FOUND|INTERNAL|DEADLINE_EXCEEDED|rate_limit_error|overloaded_error|authentication_error|permission_error|invalid_request_error|insufficient_quota)$/.test(code) ? code : null;
    const quantity = (n: unknown) => n===null ? null : Number.isSafeInteger(n) && Number(n)>=0 ? n : null;
    const attempts=data.attempts.map((a: Record<string,unknown>) => {
      if (typeof a.provider!=='string' || models[a.provider]!==a.model || !['success','temporary_refusal','failed_closed'].includes(String(a.outcome))) throw Error('Invalid attempt');
      return {provider:a.provider,model:a.model,outcome:a.outcome,httpStatus:quantity(a.httpStatus),code:safeCode(a.code)};
    });
    const records=data.records.map((r: Record<string,unknown>) => {
      if (r.request_key!==requestKey || typeof r.provider!=='string' || models[r.provider]!==r.model) throw Error('Receipt identity mismatch');
      const usage=r.usage && typeof r.usage==='object' ? Object.fromEntries(Object.entries(r.usage).filter(([,v])=>Number.isSafeInteger(v)&&Number(v)>=0)) : null;
      return {provider:r.provider,model:r.model,reservedMicroUsd:quantity(r.reserved_micro_usd),estimatedMicroUsd:quantity(r.estimated_micro_usd),invoiceActualMicroUsd:quantity(r.invoice_actual_micro_usd),usage,reservationReleased:false};
    });
    return [{requestKey,attempts,records,fallbackUsed:attempts.length>1,retries:0,readOnly:true,inferenceCalls:0}];
  });
}
