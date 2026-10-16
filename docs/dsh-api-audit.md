# DSH API audit

The repository snapshot used for v0.7 contains no DeepSeek Harness SDK, request lifecycle implementation, manifest, or verified pre-request context hook. Automatic continuity injection is therefore intentionally unavailable. `ContinuityService.context()` is a local, read-only preview and must be called by a future verified adapter after identity and authorization checks.
