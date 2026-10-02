#!/usr/bin/env python3
"""Read an existing downloaded ledger. No network, writes, prompts, or credentials."""
import argparse
import hashlib
import json
from pathlib import Path
import sqlite3

CEILING = 20_000_000

def inspect_ledger(filename, since=None):
    file = Path(filename).resolve(strict=True)
    before = hashlib.sha256(file.read_bytes()).hexdigest()
    db = sqlite3.connect(file.as_uri() + '?mode=ro', uri=True)
    db.row_factory = sqlite3.Row
    try:
        db.execute('PRAGMA query_only=ON')
        db.execute('PRAGMA trusted_schema=OFF')
        if db.execute('PRAGMA application_id').fetchone()[0] != 1162430793:
            raise ValueError('Unexpected ledger identity')
        if db.execute('PRAGMA user_version').fetchone()[0] != 1:
            raise ValueError('Unexpected ledger version')
        if db.execute('PRAGMA quick_check').fetchone()[0] != 'ok':
            raise ValueError('Ledger integrity check failed')
        tables = {r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        providers = {r['call_id']:dict(r) for r in db.execute('SELECT call_id,provider,request_key FROM call_providers')} if 'call_providers' in tables else {}
        calls = []
        for row in db.execute('SELECT * FROM calls ORDER BY timestamp,id'):
            row = dict(row)
            for name in ['reserved_micro_usd','estimated_micro_usd','invoice_actual_micro_usd']:
                value = row[name]
                if value is not None and (type(value) is not int or value < 0):
                    raise ValueError('Invalid accounting quantity')
            if row['reserved_micro_usd'] <= 0:
                raise ValueError('Missing conservative reservation')
            if row['estimated_micro_usd'] is not None and row['estimated_micro_usd'] > row['reserved_micro_usd']:
                raise ValueError('Estimate exceeds reserved bound')
            usage = json.loads(row['usage_json']) if row['usage_json'] else None
            safe_usage = None
            if usage is not None:
                safe_usage = {k:usage[k] for k in ['inputTokens','outputTokens','totalTokens','cachedInputTokens','cacheWriteTokens','reasoningTokens'] if k in usage}
                if any(type(v) is not int or v < 0 for v in safe_usage.values()):
                    raise ValueError('Invalid usage quantity')
                if all(k in safe_usage for k in ['inputTokens','outputTokens','totalTokens']) and safe_usage['inputTokens'] + safe_usage['outputTokens'] != safe_usage['totalTokens']:
                    raise ValueError('Usage total mismatch')
            provider = providers.get(row['id'], {}).get('provider', 'openai')
            if provider not in ['openai','anthropic','gemini']:
                raise ValueError('Unknown provider requires reconciliation')
            calls.append({k:row[k] for k in ['id','timestamp','model','status','reserved_micro_usd','estimated_micro_usd','invoice_actual_micro_usd','provider_response_id']} | {'provider':provider,'usage':safe_usage,'request_key':providers.get(row['id'],{}).get('request_key')})
        reserved = sum(r['reserved_micro_usd'] for r in calls)
        if reserved > CEILING:
            raise ValueError('Cumulative ceiling exceeded')
        selected = [r for r in calls if since is None or r['timestamp'] >= since]
        result = {'schema':'empireai-readonly-inference-reconciliation-v1','sha256':before,'readOnly':True,
          'recordCount':len(calls),'earliest':calls[0]['timestamp'] if calls else None,'latest':calls[-1]['timestamp'] if calls else None,
          'ceilingMicroUsd':CEILING,'reservedMicroUsd':reserved,'remainingReservationHeadroomMicroUsd':CEILING-reserved,
          'recordedEstimateMicroUsd':sum(r['estimated_micro_usd'] or 0 for r in calls),'unknownEstimateCount':sum(r['estimated_micro_usd'] is None for r in calls),
          'invoiceActualKnownForAll':bool(calls) and all(r['invoice_actual_micro_usd'] is not None for r in calls),
          'inferenceRequestCount':db.execute('SELECT count(*) FROM inference_requests').fetchone()[0] if 'inference_requests' in tables else None,
          'since':since,'selectedCalls':selected,'selectedEvidencePresent':bool(selected),
          'interpretation':'Reservations consume the guard; estimates are not provider invoices. An absent row in an old snapshot does not prove zero spend.'}
    finally:
        db.close()
    if hashlib.sha256(file.read_bytes()).hexdigest() != before:
        raise ValueError('Snapshot changed during readback')
    return result

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('ledger')
    parser.add_argument('--since')
    args=parser.parse_args()
    print(json.dumps(inspect_ledger(args.ledger,args.since),indent=2))
