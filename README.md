# CodeSentinel

CodeSentinel is a local web app for static analysis of Python repositories. It accepts a ZIP archive or a GitHub repository URL, runs AST-based checks, and stores reports in `server/data/db.json`.

## Requirements

- Node.js 20 or newer
- Python 3.8 or newer

## Run Locally

```sh
npm install
npm run dev:all
```

Open the Vite URL printed in the terminal. The API runs on port `3001`; Vite proxies `/api` requests to it.

Set `GEMINI_API_KEY` in `.env.local` to enable AI finding enrichment and remediation generation. Static analysis works without the key; code remediation reports an unavailable state when the key is not configured.

## Checks

```sh
npm run lint
npm run build
```
