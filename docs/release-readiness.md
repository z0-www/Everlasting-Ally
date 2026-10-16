# v1.0.0-rc.1 readiness

Implemented and tested: continuity, roleplay profiles/worlds/scenes, narrative transitions, relationship evidence, fictional emotional states, growth proposals, mode-aware bounded context coordination, status and local backup helpers.

Partial: SQLite initialization is idempotent but lacks historical v0.3-v0.6 migration fixtures; the current repository started without those schemas. Management APIs are local TypeScript functions, not DSH tools.

Blocked: no verified DSH request-before-context hook, manifest, official tool registration schema, or Windows Desktop environment. `getPluginStatus()` reports `hook_unavailable`. This branch is a release candidate, not a formal v1.0 release.
