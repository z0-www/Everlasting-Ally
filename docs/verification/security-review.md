# RC3 security review scope

Reviewed source, package files, build scripts, examples, Host entry, roleplay management CLI and SQLite queries on 2026-10-17.

- Network/telemetry: no `fetch`/HTTP client in runtime source; package scripts only invoke local Node/npm.
- Credentials: no reads of credential files or token values; existing memory sanitizer redacts credential-shaped event fields.
- Shell/process: `child_process.spawnSync` appears only in temporary child-process demos and package verification with fixed script paths; no untrusted chat text is used as an executable argument. The Windows script is read-only.
- Dynamic execution: no `eval` or `new Function` found in authored runtime.
- SQL: storage queries use parameters; identifiers are static. Demo/package scripts use temporary paths. Roleplay management requires explicit local consent variables and full scope for listing.
- Prompt injection: history is emitted as bounded evidence text and explicitly cannot become system instructions.
- Deletion: legacy `MemoryStorage.deleteEvent` clears derived orbs/reflections; roleplay deletion and correction are tested locally. Shared/multi-user authorization is not implemented.
- Package: no API keys, user databases or logs are tracked; `npm run verify:package` checks a clean install/import and SHA-256 artifact.

Limits: this is static and local runtime review, not a penetration test, dependency audit, Windows Desktop audit, or proof of DSH host trust boundaries. The `roleplay` JSON scene cleanup remains less normalized than the legacy schema; do not use roleplay storage for shared/private production data until a trusted identity boundary exists.
