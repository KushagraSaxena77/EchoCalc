# Voice Calculator (EchoCalc)

A modern, Vite-powered voice calculator that lets you speak natural math expressions, parses them into valid formulas, evaluates safely, and stores history locally in your browser using IndexedDB.

## Features

- Voice input (Web Speech API) with clear UI states
- Natural language → math expression parser (e.g., "square root of 16 plus five")
- Safe evaluation with support for common functions: sqrt, cbrt, abs, sin, cos, tan, log, ln, floor, ceil, round, factorial, powers
- Speech synthesis reads out the result
- Local IndexedDB-backed history (insert, list, clear) - no server or configuration required!

## Prerequisites

- Node.js 18+ and npm
- Modern browser with IndexedDB support (all major browsers)

## Setup

1) Install dependencies

```
npm ci
```

2) Run in development

```
npm run dev
```

3) Build for production

```
npm run build
```

4) Preview the production build

```
npm run preview
```

## Local Storage

Your calculation history is stored locally in your browser using IndexedDB. This means:
- No external database or API configuration needed
- Data persists across sessions in the same browser
- Data is private to your browser (not shared across devices)
- Clearing browser data will remove the history

## Notes and caveats

- The word "percent" is currently mapped to the modulo operator `%`. If you prefer percentage math (e.g., `50 percent of 200` → `100`), let me know and I can extend the parser.
- Browser support for Web Speech API varies. Chrome works best. If speech recognition or synthesis isn't available, the UI will disable related features.
- History is stored per-browser, so different browsers or devices won't share the same history.

## License

MIT
