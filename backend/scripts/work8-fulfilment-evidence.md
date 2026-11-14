The V140 supplemental intake retains two exact authenticated CJ connector receipts
against the existing selected product and native candidate. It adds historical
constraints and a reconstructing consumer in separate immutable namespaces. It
does not add an HTTP route, scheduled acquisition, commerce action, owner decision
or positive qualification.

The actual isolated native examination completed once with nine checks, including
three negative cases. Independent read-only verification reconstructed the native
consumer and compared all 29 option rows with the original receipts. The retained
input price expired at its original cutoff; this intake did not renew it. Twenty-two
options have differing timing fields, and all 29 have unreported US tax fields.
The requested Amazon parameter is not proof of upstream filtering or seller
eligibility. Qualification remains DEFERRED. No original requirement was accepted
by this scoped operation. Accepted O13-03 and O13-09 evidence remains preserved.

Raw provider receipts and SQLite evidence are deliberately outside this repository.
An operator with the retained evidence package can verify it without importing any
application code, creating a database, replaying the intake or contacting a provider:

```sh
node backend/scripts/verify-work8-fulfilment-evidence.mjs \
  --evidence-dir /path/to/retained/v140/product \
  --base-db /path/to/retained/v139/supplier/fresh-native.sqlite
```

Use the repository's supported Node runtime with `node:sqlite`. The verifier accepts
only the exact hash-pinned completed evidence. It opens both databases read-only,
checks preserved rows and raw source equality, verifies the terminal resource bounds,
and emits aggregate status without raw provider content. It does not
constitute a fresh source observation, current economic qualification or permission
to execute another operation.
