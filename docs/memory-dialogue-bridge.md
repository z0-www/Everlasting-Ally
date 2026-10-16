# Memory-to-Dialogue Bridge

The bridge accepts authorized memory items from a provider, filters by topic relevance and confidence, removes superseded/duplicate events, and builds a bounded context with source IDs. `dialogueBridgeEnabled` is false by default. Fictional roleplay items use `fictional_roleplay`; they are never treated as real-user facts. Without a verified DSH request hook, output is a local preview only.

`npm run demo:dialogue` demonstrates persistence, restart, selection, irrelevant-memory exclusion, A/B retrieval metrics, and deletion cleanup using temporary SQLite data.
