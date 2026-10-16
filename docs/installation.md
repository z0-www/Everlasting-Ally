# Installation

Requirements: Node.js 24 or newer (the implementation uses built-in `node:sqlite`).

```sh
npm ci
npm run build
npm test
```

This repository is a local library; it does not start a web server. Automatic DSH context injection is unavailable until a verified host hook exists.
