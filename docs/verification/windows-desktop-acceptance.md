# Windows DSH Desktop acceptance protocol

Status in this repository: `NOT_VERIFIED`. The referenced DSH Desktop version is Windows 11 / DSH Desktop 0.2.0-rc.2 nightly win-x64 / Node.js 24.21.0, but no Desktop process is available in this environment and no installation command is assumed.

1. Record `dsh --version` (if the vendor actually provides `dsh`) and Node `node --version`. If a command is absent, mark `BLOCKED`; do not invent a replacement.
2. Create or select a vendor-supported isolated profile. Record how it was selected and inspect installed memory plugins. Do not modify or disable a main profile.
3. Build or obtain the candidate tgz and verify its SHA-256. Use only the official local-plugin installation procedure for the exact Desktop version.
4. Start the isolated profile and verify `dsh-plugin.json` is loaded. Invoke `inside_memory_ping`, then `inside_memory_status`; record raw status without private content.
5. Explicitly set an isolated database path and `memory.enabled=true`, `recallEnabled=true`. Save fictional messages only. Verify event count increases.
6. Stop the profile using the vendor-supported shutdown. Start it again and call `inside_memory_recall` for a fictional keyword. Record source event IDs.
7. Set `memory.enabled=false`, restart, and verify new event count does not increase. Do not treat a disabled setting as deletion.
8. Stop/disable the plugin using the vendor procedure, close all handles, delete only the test database, and restore the original profile.

Record each row as `PASS`, `FAIL`, `BLOCKED`, or `NOT_VERIFIED`: installation, manifest load, ping, status, capture, restart recall, reflection source IDs, disabled capture, cleanup, restore, and automatic model context use. A successful local Host test is not a Desktop result. No request-before-context Hook is verified, so automatic memory injection remains `BLOCKED`.
