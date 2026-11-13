import copy
import importlib.util
import json
import pathlib
import unittest

CONTROL = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('preflight', CONTROL / 'host/root-preflight.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class AdmissionContract(unittest.TestCase):
    def setUp(self):
        self.authority = json.loads((CONTROL / 'authority.json').read_bytes())
        self.reservation = json.loads((CONTROL / 'reservation.json').read_bytes())
        self.operation = self.authority['operationIdentity']
        # Synthetic in-memory parser fixture. Never written to the ledger/source.
        self.fixture = {**self.reservation, 'status': 'RESERVED_IN_CANONICAL_LEDGER',
                        'expectedCountedExposureUSD': 83, 'savedLedgerVersion': 'v75',
                        'savedLedgerSHA256': 'a' * 64, 'independentReadbackSHA256': 'a' * 64}

    def test_unreserved_refused(self):
        unreserved = {**self.fixture, 'status': 'UNRESERVED_PENDING_UNIQUE_CANONICAL_OBLIGATION'}
        with self.assertRaisesRegex(ValueError, 'CANONICAL_RESERVATION_REQUIRED'):
            module.validate_admission(self.authority, unreserved, self.operation)

    def test_schema_fixture(self):
        module.validate_admission(self.authority, self.fixture, self.operation)

    def test_resource_and_evidence_bounds(self):
        for key, value in [('expectedCountedExposureUSD', 1001),
                           ('expectedCountedExposureUSD', float('inf')),
                           ('savedLedgerVersion', None),
                           ('independentReadbackSHA256', 'b' * 64),
                           ('replicas', 2), ('vCPUs', True), ('maximumRuntimeSeconds', 1201),
                           ('restartPolicyType', 'ALWAYS'), ('maximumNewExposureUSD', 6)]:
            with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                module.validate_admission(self.authority, {**self.fixture, key: value}, self.operation)

    def test_no_delegated_owner_action_or_production_scope(self):
        for key in ('personalOwnerActionDelegated', 'productionPermission', 'businessPublicationPermission'):
            altered = copy.deepcopy(self.authority)
            altered[key] = True
            with self.subTest(key=key), self.assertRaises(ValueError):
                module.validate_admission(altered, self.fixture, self.operation)


if __name__ == '__main__':
    unittest.main()
