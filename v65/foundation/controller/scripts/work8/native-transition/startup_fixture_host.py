"""One foreground fixture per retained-image container; no nested Node roles."""
import hashlib
import json
import subprocess

from native_diagnostics import parse_stream
from private_contract import backend_options

MODES = ('protected-entrypoint', 'system-errno', 'untrusted-message')


def lifecycle(name, mode):
    # Never return raw inspect, environment, error text, host paths or commands.
    try:
        result = subprocess.run(['docker', 'inspect', name], stdout=subprocess.PIPE,
                                stderr=subprocess.DEVNULL, text=True, timeout=5,
                                check=False)
        if result.returncode:
            return {'fixture': mode, 'available': False}
        state = json.loads(result.stdout)[0]['State']
        return {'fixture': mode, 'available': True,
                'status': state.get('Status') if state.get('Status') in
                    {'created', 'running', 'paused', 'restarting', 'removing', 'exited', 'dead'} else None,
                'exitCode': state.get('ExitCode') if type(state.get('ExitCode')) is int else None,
                'oomKilled': state.get('OOMKilled') is True}
    except (OSError, subprocess.TimeoutExpired, ValueError, KeyError, IndexError):
        return {'fixture': mode, 'available': False}


def execute(private, script, image, label, mounts, run, created, out):
    rows = []
    progress = []
    states = []

    def save():
        (out / 'child-startup-fixture-progress.json').write_text(json.dumps({
            'schema': 'work8-v61-child-fixture-progress-v1', 'progress': progress,
            'containerLifecycle': states, 'rawOutputRetained': False}, indent=2) + '\n')

    for mode in MODES:
        name = label + '-child-fixture-' + mode
        progress.append({'fixture': mode, 'phase': 'STARTING'})
        save()
        cmd = ['docker', 'run', '--name', name, '--label', 'work8.native=' + label,
               '--pull', 'never', '--network', 'none', '--memory', '256m', '--cpus', '1',
               '--pids-limit', '16', *backend_options(private, script)]
        for src, dst in mounts:
            cmd += ['--mount', 'type=bind,src=' + str(src) + ',dst=' + dst + ',readonly']
        cmd += ['--entrypoint', 'node', image,
                '/examination/child-startup-fixture.cjs', mode,
                '/app/deployment/runtime-membership-controller.cjs']
        created.append(name)
        try:
            output = run(cmd, timeout=20, log='child-fixture-' + mode + '-command.log',
                         expected_exit_codes=(1,))
            record = parse_stream(output)
            assert record and record.get('origin'), 'ACTUAL_CHILD_CAUSAL_RECORD_REQUIRED'
            assert record['origin']['pid'] == record['identity']['pid']
            assert record['origin']['role'] == 'startup-readback'
            assert record['origin']['startTicks'] is not None
            assert output.count('WORK8_NATIVE_FIRST_FAILURE ') == 1, 'LATER_FAILURE_REPLACED_FIRST'
            if mode == 'protected-entrypoint':
                assert record['assertion'] == 'OPERATOR_PATH_NOT_PROTECTED' and record['errno'] is None
                assert any(frame.startswith('runtime-membership-controller.cjs:') for frame in record['sourceFrames'])
            elif mode == 'system-errno':
                assert record['assertion'] == 'ENOENT' and record['errno'] == 'ENOENT'
            else:
                assert record['assertion'] == 'UNCLASSIFIED_NATIVE_STARTUP_ERROR' and record['errno'] is None
                assert 'AK' + 'IA' + 'A' * 16 not in json.dumps(record)
            rows.append({'mode': mode, 'status': 'PASS', 'record': record,
                         'childExitCode': 1,
                         'rawOutputSha256': hashlib.sha256(output.encode()).hexdigest(),
                         'rawOutputRetained': False})
            progress.append({'fixture': mode, 'phase': 'PASS_EXPECTED_REFUSAL'})
        except Exception:
            progress.append({'fixture': mode, 'phase': 'FAILED'})
            raise
        finally:
            # Captured before the controller's final cleanup even on timeout.
            states.append(lifecycle(name, mode))
            save()
    diagnostic = {'schema': 'work8-v61-child-startup-selftest-v1',
                  'status': 'PASS_CHILD_STARTUP_CAUSE_PROPAGATION', 'fixtures': rows,
                  'nativeApplicationStarted': False, 'applicationAuthorityExpanded': False,
                  'processTopology': 'ONE_FOREGROUND_NODE_PER_CONTAINER_HOST_ORCHESTRATION',
                  'pidsLimit': 16, 'rawPrivateOutputRetained': False}
    (out / 'child-startup-selftest.json').write_text(json.dumps(diagnostic, indent=2) + '\n')
    return diagnostic
