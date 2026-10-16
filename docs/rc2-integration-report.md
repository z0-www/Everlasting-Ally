# v1.0 RC2 DSH/Roleplay integration report

- Branch: `feat/dsh-host-roleplay-integration`
- Base: `feat/roleplay-continuity-verified`
- Package: `1.0.0-rc.2`
- DSH host: restored from the remote `feat/dsh-integration-auto-recall` snapshot in `src/host.ts`; `apply()` registers and unregisters the four legacy tools through the verified host facet shape.
- Legacy tests: 25 passed.
- Current roleplay/dialogue tests: 16 passed.
- Integrated demo: passed real assistant SQLite writes, a child-process reopen, roleplay persistence, and fiction/real separation.
- Roleplay continuity demo: passed.
- Package dry run: passed (`everlasting-ally-1.0.0-rc.2.tgz`).

Database compatibility uses separate paths for legacy real memory and roleplay data in the integrated demo. The legacy schema's `schema_version` is not reused by the roleplay `schema_migrations` table. No real private database was migrated.

The DSH request-before-context hook and Windows Desktop execution remain `not_verified`; a successful host-facet unit/in-process test is not a Windows Desktop test.
