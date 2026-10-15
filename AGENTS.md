# Everlasting Ally development guide

This repository currently implements only the v0.1 DSH host facet and the
inside_memory_ping health tool. Do not claim memory storage, emotion analysis,
personality continuity, or a desktop UI until those features have been added and
tested.

Commands:

- npm ci installs the locked development dependencies.
- npm test compiles TypeScript and runs the manifest and tool registration tests.
- npm run build writes the loadable JavaScript host facet to dist/.

The plugin follows the public tool registration shape verified in the
T-Auto/dsh-ops source: ctx.inject(['tools'], ...) and
ctx.tools.register({ name, description, parameters, output, execute }).

The manifest targets Community manifest format 0.15 and host facet API v1alpha1.
Keep source, tests, and lockfiles reviewable; do not add credentials or local
chat data.
