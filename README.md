# Everlasting Ally

Everlasting Ally v0.7 provides a local Personality Continuity Engine for DeepSeek Harness integrations. It separates explicit user preferences, observed assistant behavior, and evidence-backed growth guidelines. The engine stores profiles and proposals in SQLite, requires explicit approval before a proposal affects the active profile, supports rejection/revocation/reset, enforces scope isolation, and produces bounded context previews.

Continuity is disabled by default (`enabled=false`); style values are bounded to 0–1 and cannot override current requests, system instructions, privacy, safety, accuracy, or uncertainty. No sensitive attributes, private chain of thought, or invented emotions are inferred. The current repository has no verified DSH pre-request hook, so automatic injection is not implemented; see [`docs/dsh-api-audit.md`](docs/dsh-api-audit.md).

## Development

```sh
npm ci
npm run build
npm test
```

The implementation uses Node 24's built-in `node:sqlite`, so no external model API key is needed. `ContinuityService` exposes profile/evidence/proposal/approval/rejection/revocation/preferences/reset and bounded context-preview operations. Use a trusted host identity for `scopeId`; this package does not provide network authentication or claim multi-user identity isolation.
