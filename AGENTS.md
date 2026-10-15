# Everlasting Ally development guide

This repository implements the v0.1 DSH host facet, v0.2 session event capture,
v0.3 local SQLite persistence with privacy controls, and v0.4 local rule based
memory orb analysis, v0.5 local deterministic recall, and v0.6 local reflection
records. It does not implement personality continuity, vector search, prompt
injection, or a desktop UI.

Commands:

- npm ci installs the locked development dependencies.
- npm test compiles TypeScript and runs manifest, tool registration, and event capture tests.
- npm run build writes the loadable JavaScript host facet to dist/.

The v0.3 storage uses Node.js built-in node:sqlite and is disabled by default.
Use a temporary database path in tests. Never commit SQLite files, logs, API
keys, tokens, passwords, or real chat transcripts.

The v0.4 analyzer is local and conservative. It records uncertainty and
behavior style separately from human emotion. A remote model provider is only
an interface placeholder until a supported DSH API is verified.

Reflection is disabled by default and only runs through trusted programmatic
interfaces. Never expose raw event text in logs or add an automatic background
reflection loop.

The DSH request-before-model context hook and multi-user identity fields are not
verified. Keep auto recall behind the adapter and report hook_unavailable when
no supported host extension exists.

The plugin follows the public tool registration shape verified in the
T-Auto/dsh-ops source: ctx.inject(['tools'], ...) and
ctx.tools.register({ name, description, parameters, output, execute }).

The manifest targets Community manifest format 0.15 and host facet API v1alpha1.
Keep source, tests, and lockfiles reviewable; do not add credentials or local
chat data.
