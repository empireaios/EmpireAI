#!/usr/bin/env python3
"""Independent read-only SQLite / integer-money oracle for the elapsed examination."""
import collections, datetime, hashlib, json, pathlib, sqlite3, statistics, sys
root = pathlib.Path(sys.argv[1])
sha = lambda b: hashlib.sha256(b).hexdigest()
encoded = lambda x: json.dumps(x, separators=(',', ':'), ensure_ascii=False).encode()
receipt = json.loads((root / 'receipt.json').read_text())
phase = receipt['phase']
assert phase in ['preflight', 'endurance']
minimum_ms = 300000 if phase == 'preflight' else 2700000
assert receipt['status'] == ('PASS_COUPLED_PREREQUISITE_NOT_ENDURANCE' if phase == 'preflight' else 'PASS_45_MINUTE_COUPLED_LOCAL_F31')
assert receipt['elapsedMs'] >= minimum_ms
wall = (datetime.datetime.fromisoformat(receipt['end']) - datetime.datetime.fromisoformat(receipt['started'])).total_seconds()
assert wall >= minimum_ms / 1000 and abs(wall * 1000 - receipt['elapsedMs']) < 2000
db = sqlite3.connect('file:' + str(root / 'commerce.sqlite') + '?mode=ro', uri=True)
db.execute('PRAGMA query_only=ON')
assert db.execute('PRAGMA quick_check').fetchone()[0] == 'ok'
tasks = [json.loads(x[0]) for x in db.execute('SELECT record FROM commerce_runtime_tasks ORDER BY id')]
assert len(tasks) == 9 and all(t['status'] == 'COMPLETE' for t in tasks)
all_receipts = []
orders = []
for task in tasks:
    rows = [json.loads(x[0]) for x in db.execute('SELECT record FROM commerce_runtime_receipts WHERE mission=? ORDER BY version', (task['mission'],))]
    assert len(rows) == len(task['steps']) == task['cursor']
    previous = ''
    for i, row in enumerate(rows, 1):
        body = {k: v for k, v in row.items() if k != 'digest'}
        assert row['version'] == i and row['previous'] == previous
        assert sha(encoded(body)) == row['digest']
        assert row['classification'] == 'SYNTHETIC' and row['externalEffects'] == 0
        assert row['state']['externalEffects'] == row['state']['paidInference'] == 0
        previous = row['digest']
    all_receipts += rows
    final_orders = rows[-1]['state'].get('orders', {})
    orders += list(final_orders) if isinstance(final_orders, dict) else [o['id'] for o in final_orders]
assert len(orders) == len(set(orders)) == 9
assert len({r['id'] for r in all_receipts}) == len(all_receipts)
receipt_digests = {r['digest'] for r in all_receipts}
financial = []
event_ids = []
for mission, raw_plan, plan_digest in db.execute('SELECT mission,record,digest FROM work8_sim_finance_plans ORDER BY mission'):
    assert sha(raw_plan.encode()) == plan_digest
    plan = json.loads(raw_plan)
    assert plan['assumptions']['actualCashMovement'] == 0
    rows = db.execute('SELECT sequence,record,digest FROM work8_sim_finance_events WHERE mission=? ORDER BY sequence', (mission,)).fetchall()
    assert len(rows) == len(plan['events'])
    totals = collections.Counter()
    for expected_sequence, (sequence, raw, event_digest) in enumerate(rows):
        assert sequence == expected_sequence and sha(raw.encode()) == event_digest
        event = json.loads(raw)
        assert event == plan['events'][sequence]
        assert event['classification'] == 'SIMULATION' and event['currency'] == 'SGD'
        assert event['sourceReceiptDigest'] in receipt_digests
        assert isinstance(event['minor'], int) and event['minor'] >= 0
        event_ids.append(event['id'])
        totals[event['kind']] += event['minor']
    net = totals['SALE'] - totals['FEE'] - totals['REFUND'] - totals['DISCOUNT']
    supply = totals['COGS'] + totals['FREIGHT'] + totals['DUTY']
    assert totals['SETTLEMENT'] == totals['PAYOUT_HOLD'] == totals['PAYOUT_RELEASE'] == totals['BANK_RECEIPT'] == net
    assert totals['SUPPLIER_PAYMENT'] == supply
    contribution = net - supply
    view = next(v for v in receipt['final']['financial'] if v['missionId'] == mission)
    assert view['status'] == 'COMPLETE_SIMULATION' and view['actualCashMovement'] == 0
    assert view['financial']['conserved'] is True
    assert sum(o['contributionMinor'] for o in view['financial']['orders']) == contribution
    financial.append({'mission': mission, 'eventCount': len(rows), 'currency': 'SGD', 'bankMinor': net, 'supplierMinor': supply, 'contributionMinor': contribution})
assert len(financial) == 9 and len(event_ids) == len(set(event_ids)) == 108
db.close()
events = [json.loads(line) for line in (root / 'events.jsonl').read_text().splitlines()]
assert not any(e['kind'] == 'CRITICAL_FAILURE' for e in events)
assert {e['fault'] for e in events if e['kind'] == 'PROVIDER_FAULT_OBSERVED'} == {'429', 'malformed'}
assert sum(e['kind'] == 'GAP_DETECTED_AND_VERIFIED' for e in events) == 1
redis = [e for e in events if e['kind'] == 'REDIS_INTERRUPTED_AND_AOF_REOPENED']
assert len(redis) == 1 and redis[0]['interruptedMs'] >= 5000
assert any(e['kind'] == 'COMPATIBLE_PRIOR_CODE_READBACK_VERIFIED' for e in events)
assert any(e['kind'] == 'FINAL_TASK_DRAIN_BEFORE_SETTLEMENT' for e in events)
assert not any(e['kind'].startswith('BLOCKED_') for e in events)
assurance = sqlite3.connect('file:' + str(root / 'assurance/assurance.sqlite') + '?mode=ro', uri=True)
assert assurance.execute('PRAGMA quick_check').fetchone()[0] == 'ok'
recoveries = [json.loads(x[0]) for x in assurance.execute("SELECT body FROM cp_records WHERE kind='recovery'")]
assert len(recoveries) == 1
recurrence = next(e for e in events if e['kind']=='RECURRENCE_CIRCUIT_REFUSED')
assert recurrence['status']=='CIRCUIT_OPEN'
assert recurrence['incident'] != recurrence['priorIncident']
replay = next(e for e in events if e['kind']=='BROKER_REDELIVERY_AFTER_AOF')
assert replay['attemptsAfter']==replay['attemptsBefore']+1
broker = next(e for e in events if e['kind']=='FINAL_BROKER_COUNTS')
assert broker['authority']=='NOT_BORN/LOCKED' and broker['counts']['completed']==9
assert all(broker['counts'][k]==0 for k in ['active','waiting','delayed','failed'])
margin = next(e for e in events if e['kind']=='SETTLEMENT_SCHEDULE_MARGIN')
assert margin['availableMs']>=margin['requiredMs']
recovery = recoveries[0]
assert recovery['status'] == 'VERIFIED' and recovery['verification']['healthy'] is True
assert recovery['startedAt'] <= recovery['verification']['observedAt'] <= recovery['completedAt'] <= recovery['deadlineAt']
assert recovery['result']['externalEffects'] == recovery['verification']['externalEffects'] == 0
incident = json.loads(assurance.execute("SELECT body FROM cp_records WHERE kind='incident' AND id=?", (recovery['incidentId'],)).fetchone()[0])
assert incident['status'] == 'RECOVERED' and incident['attempts'] == 1
assert assurance.execute("SELECT count(*) FROM cp_records WHERE kind='lease'").fetchone()[0] == 0
assurance.close()
restart = next(e for e in events if e['kind'] == 'APPLICATION_PROCESS_RESTART_EQUALITY')
assert restart['beforePid'] != restart['afterPid']
samples = receipt['samples']
assert all(0 < s['rss'] < 1073741824 and s['heartbeatAgeMs'] < 60000 for s in samples)
max_gap = max(b['elapsedMs'] - a['elapsedMs'] for a, b in zip(samples, samples[1:]))
assert max_gap < 60000
first = sorted(s['rss'] for s in samples if s['elapsedMs'] < (60000 if phase == 'preflight' else 300000))
last = sorted(s['rss'] for s in samples if s['elapsedMs'] >= minimum_ms - (60000 if phase == 'preflight' else 300000))
growth = last[len(last) // 2] - first[len(first) // 2]
assert growth == receipt['medianRssGrowth'] and growth <= 134217728
result = {'status': 'PASS_INDEPENDENT_PREFLIGHT_NOT_ENDURANCE' if phase == 'preflight' else 'PASS_INDEPENDENT_COUPLED_ELAPSED_ORACLE', 'phase': phase, 'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'wallElapsedSeconds': wall, 'monotonicElapsedMs': receipt['elapsedMs'], 'sqliteIntegrity': 'ok', 'tasks': len(tasks), 'canonicalReceipts': len(all_receipts), 'uniqueFinancialEvents': len(event_ids), 'financial': financial, 'assurance': {'incident': incident['id'], 'recovery': recovery['id'], 'freshVerification': True, 'recoveryMs': recovery['completedAt'] - recovery['startedAt'], 'releaseLeases': 0}, 'peakObservedWorkerRss': max(s['rss'] for s in samples), 'medianRssGrowth': growth, 'maximumSampleGapMs': max_gap, 'samples': len(samples), 'sourceReceiptSha256': sha((root / 'receipt.json').read_bytes()), 'independence': 'Separate Python process, read-only SQLite and integer-money equations; not independent human/governance certification', 'scope': 'Preflight is NOT endurance. Endurance verifies coupled recorded stages only; full platform and off-host certification remain separate.', 'integratedRecurrenceCircuit': recurrence, 'brokerRedelivery': replay, 'finalBroker': broker, 'settlementMargin': margin, 'realCommerce': False, 'paidInference': 0}
(root / 'independent-verification.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result))
