# Portfolio OS

A portfolio that is a desktop. His projects are the icons on it; each opens in a window you can drag, resize, snap, minimise and close. An assistant on the desktop answers questions about him, from facts he wrote down, with sources, and says so when it does not know.

It is Mohammad Uzair Khan's portfolio. Windows 11 is the look; no Microsoft artwork is used (the Start button is his own mark).

## Try it in a minute

1. Open the site. The assistant is already up: click **What projects has he built?**
2. Double-click **Sayso** on the desktop. Press the arrow keys to move between icons and Enter to open one.
3. Drag a window to the left edge of the screen to snap it. Try Alt and the arrow keys with a window selected.
4. Press **Start**, type `react flow`, press Enter.
5. Prefer reading? **Start, Simple view** (or `/simple`) is the same content as one plain page.

## What it is made of

- **A window manager written for the job**, no windowing library. Where a window may sit, how it resizes and where it snaps are plain functions in `src/os/geometry.ts`, unit-tested without a browser. What is open, where, and in what order lives in a Redux Toolkit slice (`src/store/windowsSlice.ts`). A dragged window moves through CSS and is handed to the store only when the pointer is let go.
- **An assistant that is not a language model** (`src/ai`): it normalises a question, spots the project or technology it names, searches short passages with BM25, and composes an answer from them. No API, no key, no network; it runs in the browser. Every answer carries source chips that open the window it came from, and a "How I answered" fold-out shows what it read the question as and the passages it found. It declines what it does not know, what is not published (grades, phone numbers) and anything that tries to reprogram it.
- **One source of truth** (`src/knowledge`): typed data for projects, profile, FAQ. The desktop, the Projects folder, Start's search, the assistant and the simple view all read it, so they cannot disagree. A test fails if a phone number, a grade, a second email address or a secret-looking string ever gets in.

## Run it

```
npm install
npm run dev        # http://localhost:3050
```

| Command | What it does |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run typecheck` | Next's route types, then `tsc` |
| `npm test` | Vitest: window maths, the windows reducer, the knowledge data, the assistant |
| `npm run build` then `CI=1 npm run e2e` | Playwright against the production build |
| `node scripts/look.mjs [light\|dark] [width] [height] [scene]` | Takes pictures of the running site |

## Limits

- The assistant answers only from what is written in `src/knowledge`. About one fresh question in five may be missed; it says so rather than guessing.
- On a phone every window is full screen, one at a time; there is no dragging.
- Nothing here stores anything but the theme choice, in the browser.

## Licence

MIT. See [LICENSE](LICENSE).
