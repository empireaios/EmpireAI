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
    'New independent acceptances this continuation: original#3/#5/#12/#24/#25 and amendments#12/#16 and accepted#14; integrated continuation independently accepts software amendments#13/#17. '
    'Work8 remains NO_GO; Work9 INACTIVE; Pillow NOT_BORN; commerce LOCKED.', '',
    'Published source: `1ff047b32547f9e987ed6f6cd5d6634d49735ccb`; reviewed local source: '
    '`06c6ae6517546359a8406d2568a6eebcb9a51503`; identical complete tree '
    '`7f5422c918f5859ed620684369259ecee0e90d79`. '
    'CI and later local engineering status are recorded in PUBLICATION-AND-CHECKPOINT.json. '
    'No later descendant is covered by the frozen-source publication authority.', '']
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
