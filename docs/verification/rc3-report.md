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
- SHA-256 from this run: `984cd99bfea5cb023212f6c83d017f84165c64079bd73f8f04e038008796d9f0`

## Security review

See `security-review.md`. No authored runtime network client or dynamic code execution was found. Demo child processes use fixed local scripts and temporary paths. DSH and roleplay management remain single-user/local; no multi-user security claim is made.

## Not verified

Windows 11 execution, Windows-specific PowerShell behavior, Ubuntu GitHub Actions result, DSH Desktop plugin installation, real tool registration, Desktop profile isolation, request-before-context Hook, and model use of generated context. The repository does not publish a release and main remains intentionally unmerged.
