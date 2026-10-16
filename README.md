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

## v0.8 roleplay layer

`src/roleplay` adds isolated character profiles, worlds, story branches/scenes, sessions, relationships, and bounded context previews. Roleplay mode is explicit and inactive sessions return no roleplay context. Fictional records are scoped by world/story/branch and are never promoted to real-user memory. Relationship records require source event IDs. The DSH pre-request hook remains unverified, so no automatic injection is claimed.

## v0.9 narrative evolution

`src/roleplay/evolution` adds evidence-backed narrative states, versioned transitions, isolated story branches, relationship transitions, fictional emotional states, character-growth proposals, and bounded narrative context. Proposed changes never become canon until explicitly confirmed. DSH automatic injection remains unavailable pending a verified request hook.

## Roleplay memory MVP

Run `npm run demo:roleplay` to execute a real SQLite persistence demo: it creates the fictional mage 艾琳, stores a confirmed rune-stone event, closes and reopens the database, and retrieves the event by ID. Roleplay events are scoped by world, session, branch, and character; only confirmed events are recalled. This is a local MVP and does not claim Windows DSH integration.
