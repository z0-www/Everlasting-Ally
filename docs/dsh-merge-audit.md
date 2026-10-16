# DSH merge audit

The remote `feat/dsh-integration-auto-recall` contains the v0.6.1 host, manifest, bundle, capture/storage/orb/recall/reflection/auto-recall modules and 25 legacy tests. They were restored under `src/host.ts`, `src/memory/*`, `dsh-plugin.json`, `everlasting-ally.bundle.yml`, and `test/*.test.mjs`; the current public exports remain in `src/index.ts`.

The roleplay branch contributes separate `roleplay_*` tables and `schema_migrations`; the legacy schema keeps its own `schema_version` table. The two storage systems use separate database paths in the integrated demo, avoiding migration-number collisions. DSH request-before-context injection remains `hook_unavailable`.
