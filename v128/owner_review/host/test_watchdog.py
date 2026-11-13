import importlib.util
import pathlib
import unittest

spec = importlib.util.spec_from_file_location('watchdog', pathlib.Path(__file__).with_name('root-watchdog.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class WatchdogContract(unittest.TestCase):
    def test_expired_refused(self):
        with self.assertRaisesRegex(ValueError, 'EXPIRED_OR_EXCESS_LIFETIME'):
            module.timeout_argv({'expiresAtMs': 1_000_000}, 1_000_000)

    def test_no_duration_extension(self):
        with self.assertRaisesRegex(ValueError, 'EXPIRED_OR_EXCESS_LIFETIME'):
            module.timeout_argv({'expiresAtMs': 2_200_001}, 1_000_000)

    def test_absolute_deadline_and_fixed_control_command(self):
        first = module.timeout_argv({'expiresAtMs': 2_200_000}, 1_000_000)
        second = module.timeout_argv({'expiresAtMs': 2_200_000}, 1_100_000)
        self.assertIn('1200.000s', first)
        self.assertIn('1100.000s', second)
        self.assertIn('--kill-after=5s', first)
        self.assertEqual(first[-1], '/control/owner_review/host/root-preflight.py')
        self.assertNotIn('--foreground', first)


if __name__ == '__main__':
    unittest.main()
