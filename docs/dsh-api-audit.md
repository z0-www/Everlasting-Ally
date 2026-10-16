# DSH API audit

The repository snapshot used for v0.7 contains no DeepSeek Harness SDK, request lifecycle implementation, manifest, or verified pre-request context hook. Automatic continuity injection is therefore intentionally unavailable. `ContinuityService.context()` is a local, read-only preview and must be called by a future verified adapter after identity and authorization checks.

The roleplay layer follows the same safe fallback: `RoleplayService.context()` is a read-only preview for a trusted host adapter. No tool manifest or Desktop API is present in this checkout, so `inside_roleplay_status` and `inside_roleplay_context` are not registered as DSH tools.

The v0.9 evolution service is also exposed only as a local, trusted-host API. No automatic DSH request interception or tool registration is claimed.
