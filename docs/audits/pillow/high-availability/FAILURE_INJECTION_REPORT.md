# Failure Injection Report

**Status:** PASS (soft injection)

## Injected failure

Client-side short timeout (800ms) on `/api/pillow/chat` while Brain continued processing.

## Expected

Brain remains healthy; no unrecovered wedge.

## Observed

- Client timed out as intended  
- `/health/live` afterward: **200**, lag normal  
- Subsequent phases completed successfully
