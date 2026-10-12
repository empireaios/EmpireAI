import collections
import json
from pathlib import Path

root = Path(__file__).resolve().parent
register = json.loads((root / 'FIXED-REGISTERS.json').read_text())
baseline = json.loads((root.parent / 'remediation-20261012/FIXED-REGISTERS.json').read_text())
rows = register['items']
assert len(rows) == 64
for group, size, counts_key in [('original45', 45, 'counts'), ('amendments19', 19, 'amendmentCounts')]:
    selected = [row for row in rows if row['group'] == group]
    assert sorted(row['id'] for row in selected) == list(range(1, size + 1))
    assert dict(collections.Counter(row['status'] for row in selected)) == register[counts_key]
    accepted = {row['id'] for row in selected if row['status'] == 'PASS'}
    preserved = {row['id'] for row in baseline['items'] if row['group'] == group and row['status'] == 'PASS'}
    assert preserved <= accepted

def counts(value):
    return ' / '.join(f'{value[key]} {key}' for key in ['PASS', 'PENDING', 'BLOCKED'] if key in value)

lines = ['# Work 8 full acceptance register', '',
    f"Original requirements: **{counts(register['counts'])} = 45**.",
    f"Owner amendments: **{counts(register['amendmentCounts'])} = 19**.", '',
    'Owner baseline24 PASS /16 PENDING /5 BLOCKED and2 PASS /17 PENDING preserved. '
    'New independent acceptances this continuation: original#3/#5/#12/#24/#25 and amendments#12/#16 and accepted#14; integrated continuation independently accepts software amendments#13/#17. Post-publication continuation independently accepts original#18 software portfolio review. '
    'Work8 remains NO_GO; Work9 INACTIVE; Pillow NOT_BORN; commerce LOCKED.', '',
    'Latest exact publication: source `' + register['latestPublication']['sourceCommit'] + '`; '
    'reviewed local source `' + register['latestPublication']['reviewedSource'] + '`; complete tree `'
    + register['latestPublication']['sourceTree'] + '`. Evidence `'
    + register['latestPublication']['evidenceCommit'] + '` published first; reviewed local evidence `'
    + register['latestPublication']['reviewedEvidence'] + '`; complete tree `'
    + register['latestPublication']['evidenceTree'] + '`. '
    'PR #113 remains draft and unmerged. CI: ' + register['latestPublication']['CI'] + '. '
    'See ../publication-closure-20261012/ for publication, CI and remaining-closure receipts.', '']
for group, title in [('original45', 'All 45 original requirements'), ('amendments19', 'All 19 owner amendments')]:
    lines += ['## ' + title, '', '| ID | Requirement | Status | Accepted evidence / preservation | Remaining action |',
              '|---|---|---|---|---|']
    for row in rows:
        if row['group'] != group:
            continue
        cells = [str(row['id']), row['name'], row['status'], row['acceptedEvidence'], row['nextAction']]
        lines.append('| ' + ' | '.join(cell.replace('|', '/').replace('\n', ' ') for cell in cells) + ' |')
    lines.append('')
(root / 'FULL-TRACKER.md').write_text('\n'.join(lines) + '\n')
print(counts(register['counts']), counts(register['amendmentCounts']))
