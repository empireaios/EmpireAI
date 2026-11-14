"""Fail-closed owner opportunity guards; never starts or extends a lease."""
import time

MAX_PRIVATE_LIFETIME_MS = 1_200_000
CUSTODY_RESERVE_MS = 90_000
MIN_TRANSFER_REMAINING_MS = 930_000
MIN_OWNER_OPPORTUNITY_MS = 600_000


def _remaining(expires_at_ms, now_ms):
    now_ms = time.time_ns() // 1_000_000 if now_ms is None else now_ms
    if type(expires_at_ms) is not int or type(now_ms) is not int:
        raise ValueError('EXACT_INTEGER_DEADLINES_REQUIRED')
    remaining = expires_at_ms - now_ms
    if not 0 < remaining <= MAX_PRIVATE_LIFETIME_MS:
        raise ValueError('EXPIRED_OR_EXCESS_PRIVATE_LEASE')
    return remaining


def require_transfer_window(expires_at_ms, now_ms=None):
    remaining = _remaining(expires_at_ms, now_ms)
    if remaining < MIN_TRANSFER_REMAINING_MS:
        raise ValueError('INSUFFICIENT_NATIVE_STARTUP_HANDOFF_AND_OWNER_WINDOW')
    return remaining


def require_owner_handoff_window(expires_at_ms, now_ms=None):
    remaining = _remaining(expires_at_ms, now_ms) - CUSTODY_RESERVE_MS
    if remaining < MIN_OWNER_OPPORTUNITY_MS:
        raise ValueError('INSUFFICIENT_OWNER_OPPORTUNITY_AT_HANDOFF')
    return remaining
