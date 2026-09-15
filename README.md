# Formleaf

A simple, privacy-first form builder that runs entirely in your browser.

Build. Export. Done.

Repository: [github.com/heynegix/Formleaf](https://github.com/heynegix/Formleaf)

Formleaf is a small open-source developer tool for visually building portable forms. It creates a form definition in the browser and exports it as clean standalone HTML or versioned JSON.

## Overview

Formleaf follows a local-first principle: create locally, export anywhere. It does not collect form submissions and it does not need an account, backend, database, or cloud sync.

## Features

- Visual Builder and live Preview in a responsive two-column workspace.
- Text, email, number, textarea, select, radio, checkbox, date, URL, and telephone fields.
- Field labels, placeholders, help text, defaults, required state, options, and number limits.
- Edit, duplicate, delete, and move fields up or down.
- Standalone HTML export with embedded CSS.
- Versioned JSON export and validated JSON import, including file upload.
- Automatic localStorage persistence with safe recovery from invalid local data.
- Example contact form and reset/new-form flow with confirmation.
- Keyboard-friendly semantic controls, visible focus states, and responsive layouts.

## Privacy

Your forms stay in your browser. Formleaf sends neither form definitions nor form input to a Formleaf server. There is no Formleaf backend, account system, analytics, tracking, or AI API.

The editor uses `localStorage` for convenience. This is browser storage, not a secure or encrypted vault. Do not use it for secrets or sensitive data on a shared device.

## Screenshots

The UI is intentionally compact and tool-like. The Builder stays alongside the live Preview on larger screens and stacks naturally on smaller screens.

## Getting Started

Requirements: Node.js 24 or newer and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The GitHub Pages base path is configured in `vite.config.ts`; local Vite development works from the same app entry point.

## Development

```bash
npm run typecheck
npm test
npm run build
```

The application is a Vite + React + TypeScript single-page app. State is kept in React state and persisted through a small storage adapter; no global state library is required.

## Testing

Vitest and React Testing Library cover the core data paths: field creation, editing, duplication and deletion, preview submission feedback, JSON validation, HTML escaping, export/import round trips, oversized or malformed data, and localStorage recovery.

## Build

```bash
npm run build
```

The production files are written to `dist/`. The build is static and can be served by GitHub Pages or any static host.

## Deployment

`.github/workflows/deploy.yml` builds the app and deploys `dist/` to GitHub Pages whenever `main` changes. The repository owner must enable Pages with **GitHub Actions** as its build and deployment source in repository settings before the first deployment. The Vite base path is `/Formleaf/` for the project-site URL.

## Export Formats

### HTML

HTML export produces a readable standalone document with embedded CSS. User-provided titles, labels, help text, placeholders, values, and options are escaped before insertion into the document.

### JSON

JSON export uses a versioned shape so future formats can evolve without silently accepting incompatible data:

```json
{
  "version": 1,
  "title": "Contact Form",
  "description": "Get in touch.",
  "submitLabel": "Send",
  "fields": []
}
```

Imports are checked at runtime for supported field types, string limits, array shape, option validity, field count, and duplicate IDs.

## Project Structure

```text
src/
  App.tsx              Builder, Preview, dialogs, and editor UI
  types.ts             Form data model and field factories
  lib/export.ts        Escaped HTML and JSON generation
  lib/validation.ts    Runtime JSON validation
  lib/storage.ts       Safe localStorage persistence
  *.test.ts(x)         Data and interaction tests
.github/workflows/
  ci.yml               Typecheck, test, and build verification
  deploy.yml           GitHub Pages deployment
```

## Roadmap

Potential future improvements include richer accessible option reordering, import/export schema migration tooling, and optional additional field metadata. Network-backed submissions, accounts, tracking, AI, and cloud storage are intentionally outside the MVP scope.

## Contributing

Issues and pull requests are welcome. Please keep changes small, privacy-preserving, dependency-light, and compatible with static hosting. Run the typecheck, tests, and production build before opening a pull request.

## License

Formleaf is released under the [MIT License](./LICENSE).
