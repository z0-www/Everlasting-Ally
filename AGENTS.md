# Everlasting Ally development guide

This repository implements the v0.1 DSH host facet, v0.2 session event capture,
and v0.3 local SQLite persistence with privacy controls. It does not implement
emotion analysis, personality continuity, vector search, prompt injection, or a
desktop UI.

Commands:

- npm ci installs the locked development dependencies.
- npm test compiles TypeScript and runs manifest, tool registration, and event capture tests.
- npm run build writes the loadable JavaScript host facet to dist/.

The v0.3 storage uses Node.js built-in node:sqlite and is disabled by default.
Use a temporary database path in tests. Never commit SQLite files, logs, API
keys, tokens, passwords, or real chat transcripts.

The plugin follows the public tool registration shape verified in the
T-Auto/dsh-ops source: ctx.inject(['tools'], ...) and
ctx.tools.register({ name, description, parameters, output, execute }).

The manifest targets Community manifest format 0.15 and host facet API v1alpha1.
Keep source, tests, and lockfiles reviewable; do not add credentials or local
chat data.
