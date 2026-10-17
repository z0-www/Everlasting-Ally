# RC3 public-beta readiness report

Date: 2026-10-17 UTC
Base: `feat/dsh-host-roleplay-integration`
Development branch: `feat/public-beta-readiness-rc3`
Package remains `1.0.0-rc.2`; RC3 is not declared complete because Windows/Ubuntu GitHub Actions and real DSH Desktop tests are pending.

## Evidence run in this environment

- Node.js: `v24.19.0`
- `npm_config_cache=/tmp/npm-cache npm ci`: PASS
- `npm run build`: PASS
- `npm test`: PASS, 17 current TypeScript tests + 28 legacy/lifecycle tests
- `npm run test:memory-lifecycle`: PASS, 1 lifecycle test with a child process
- `npm run verify:manifest`: PASS
- `node scripts/run-demos.mjs`: PASS, all six demos
- `npm_config_cache=/tmp/npm-cache npm run verify:package`: PASS; clean install/import and SHA-256 artifact generated under `artifacts/`
- SHA-256 from this run: `e901436ef3e8b90dfb7ff2239c8ba607157649be729d745165e6e50c6ab19e04`

## Security review

See `security-review.md`. No authored runtime network client or dynamic code execution was found. Demo child processes use fixed local scripts and temporary paths. DSH and roleplay management remain single-user/local; no multi-user security claim is made.

## Not verified

Windows 11 execution, Windows-specific PowerShell behavior, Ubuntu GitHub Actions result, DSH Desktop plugin installation, real tool registration, Desktop profile isolation, request-before-context Hook, and model use of generated context. The repository does not publish a release and main remains intentionally unmerged.

## Windows CI failure investigation update

The referenced Actions run `39041772822` could not be read from this environment: GitHub API returned `Forbidden`; no original Windows test name or stack trace is claimed. Static review identified the portable failure risk in the old `node --test dist/test/*.test.js && node --test test/*.test.mjs` shell glob. `scripts/run-tests.mjs` now enumerates exactly the 19 test files with Node filesystem APIs and propagates the child exit code, so Windows does not depend on shell glob expansion. The new local run executed 45 tests with 45 passing. A new Actions run is required before declaring the Windows failure resolved.

## Test parity update

`npm test` now uses `scripts/test-discovery.mjs`, which classifies `dist/test` and `test` through explicit metadata rather than platform-specific path suffixes. The local inventory contained 9 compiled test files and 11 legacy files; 46 test cases passed. The inventory is written from the actual runner to `artifacts/test-inventory.json`. A new Windows/Ubuntu Actions run is still required to prove parity on both hosts.

## Confirmed Windows SQLite failure and fix

Actions run `39042998345` reported `EPERM` during `rmSync()` in `src/test/mvp.test.ts` (`roleplay MVP persists confirmed events and isolates branch/character`). The test left its first and reopened `RoleplayService` connections alive before deleting the temporary directory. The test now uses `try/finally`, explicitly closes the first connection before reopening, closes the second connection before cleanup, and closes any partially constructed connection on assertion failure. The package remains RC2 until a new Windows and Ubuntu Actions run confirms this fix.
