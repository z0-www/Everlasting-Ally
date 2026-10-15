# Everlasting Ally development guide

This repository implements the v0.1 DSH host facet, the inside_memory_ping health
tool, and a v0.2 in-memory session event capture layer. It does not persist
events and does not implement emotion analysis, personality continuity, or a
desktop UI.

Commands:

- npm ci installs the locked development dependencies.
- npm test compiles TypeScript and runs manifest, tool registration, and event capture tests.
- npm run build writes the loadable JavaScript host facet to dist/.

The plugin follows the public tool registration shape verified in the
T-Auto/dsh-ops source: ctx.inject(['tools'], ...) and
ctx.tools.register({ name, description, parameters, output, execute }).

The manifest targets Community manifest format 0.15 and host facet API v1alpha1.
Keep source, tests, and lockfiles reviewable; do not add credentials or local
chat data.
