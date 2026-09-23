# Production backup inventory

Read-only Railway browser observation, 2026-09-23 approximately11:44UTC.

Project75374474-2b3a-4b0f-a9bc-203cdc1314d8, environmentda94aed2-956b-4903-a886-68a5e9a557c8, servicec3c89cbb-3e10-414a-98a2-f9ec4f1f840e, volume40ab30d1-2759-4eba-b3c8-255436610bb0.

Service Backups page explicitly shows **No backup schedule** and **No Backups — This service's volume does not have any backups.** No backup was created, restored or deleted. This inventory does not rule out application-managed files elsewhere, nor does a provider backup capture pending SQL.js memory.

Old production remains running, untouched. Safe final-save/quiescence is unproven. Provider deployment SUCCESS and isolated candidate shutdown observations do not establish old-process preservation. Additional $5 authorization is for the isolated recovery test, not a new production backup subscription.

Read-only console fs.readdirSync/statSync at2026-09-23T11:44:27.764Z found `/data/empireai-brain.db`,57,049,072bytes,last modified2026-09-23T05:11:54.651Z. Search was limited to names matching sqlite/.db/backup directly under /data and /data/backups, with no file contents read, no application import, no writes or flush request. This is a disk-file metadata observation, not an integrity-verified backup or proof that pending RAM is safe.
