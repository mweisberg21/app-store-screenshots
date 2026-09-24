# App Store Screenshots — Editor Template

A pre-built Next.js + ShadCN editor for generating App Store and Google Play screenshots. Scaffolded by the `app-store-screenshots` skill.

## Quick start

For a guided first use, ask the installed skill to follow `references/first-run.md`. In the repository, start with [the plain-language guide](../../../START-HERE.md). The commands here are for the assistant or an experienced operator.

```bash
npm ci
npm run dev   # open the private link printed in the terminal
```

Use Node.js 22 or newer. The launcher binds to 127.0.0.1 and creates a new access token on each run. Open its `/unlock#...` link to set an HttpOnly, SameSite=Strict session cookie. The token stays out of query strings and is removed from browser history before the exchange. To choose another port, use `npm run dev -- --port 3001`.

The launcher uses Node directly on Mac and Windows. In Windows PowerShell, use `npm.cmd` if policy blocks the `npm.ps1` wrapper; do not change execution policy. Quote paths with spaces. The included frame filenames work on both platforms. Repository CI runs unit tests, type checking, a production build, and local server checks on Mac and Windows. These checks do not replace a first-time operator trial.

The package includes original Apple bezels for iPhone 17 Pro Max and iPad Pro 13-inch (M5), in portrait and landscape. They are the default for Apple device layouts. No separate download, import, or existing cache is needed. Copy `public/device-frames/` and `public/licenses/` with the template. The launcher and protected frame route check the file hashes. See [included Apple frames](../references/apple-frames.md) for recovery. The editor's **Credits** button identifies Apple as the image source and links to the supplied license, separate from the code's MIT license.

For a production build, run `npm run build` and `npm start`. Both server modes require the launcher. All editor pages, APIs, and image files require a local session. Writes also require the configured Origin and JSON content type. This tool is for one local operator, not remote hosting. Team members should each run their own copy.

## Resource limits

- Each PNG/JPEG upload: 8 MiB; request bytes are bounded before JSON parsing and base64 decoding.
- Upload directory: 256 MiB and 1,000 files, with a filesystem lock to serialize quota checks. Identical files reuse storage.
- Upload rate: 60 attempts per minute, at most four active uploads per process.
- Project JSON: 4 MiB, validated before an atomic save. Up to 32 locales and 50 slides per device.
- Remove unused uploaded images after a backup to recover space. No automatic deletion is performed.
- After a crash, an empty `.write-lock` directory may remain under `public/screenshots/uploaded`. Stop all servers using that project before removing this directory.

## Checks

Run `npm test`, `npm run typecheck`, `npm audit`, `npm run build`, `npm run test:runtime`, and `npm run test:runtime:dev` after changes.

## What's inside

- **Connected canvas editor** (`src/components/editor/`) — every screen sits on one horizontal canvas, so phones, captions, and other elements can be dragged across screen boundaries and exported as split crops when Connected mode is enabled.
- **Screen controls** — drag-to-reorder screens, click-to-edit text, screenshot drop targets, per-screen layout switcher and element controls.
- **Device frames** (`src/components/editor/device-frames.tsx`) — included original Apple PNGs for iPhone 17 Pro Max and iPad Pro 13-inch (M5), with portrait and landscape iPad support. Android uses generic frames.
- **Auto-save (git-trackable)** — every change is persisted within ~600ms to **`app-store-screenshots.json`** at the project root (via `/api/project`) **and** mirrored to `localStorage` as an instant-paint cache. Commit `app-store-screenshots.json` and you can `git clone` to another machine and resume exactly where you left off.
- **Multi-device decks** — iOS and Android slide decks live side by side; switching the platform tab preserves both.
- **One-click export** — bulk PNG export at the configured App Store / Play Store resolutions using `html-to-image`; each PNG is rendered from the current connected or isolated deck mode.
- **Project migration** — older `app-store-screenshots.json` files are migrated on load. Existing per-slide transforms remain valid, and connected crops become available without rewriting the deck by hand.
- **Legacy-safe mode** — pre-v2 projects opened directly in the editor start in isolated-screen mode first, then can opt into connected crops with the toolbar's Connected/Isolated control. Skill-run in-place migrations keep legacy decks isolated unless the project had already explicitly opted into connected canvas.

## Elements and assets

Use **Add element** for images, logos, devices, screenshot details, content cards, shapes, lines/arrows, icons, and text. The **Elements** panel has layers, alignment, group, copy, lock/hide, and editing controls. **Assets** stores reusable images and named groups within this customer project. Undo and redo are in the toolbar. See [the full guide](../references/elements-and-assets.md). Old projects retain their existing text and layout.

## Adding screenshots

Two ways:

1. **Drop a file in the inspector** — drag-and-drop or click Pick. The file is sent to `/api/upload`, hashed, and written to `public/screenshots/uploaded/<hash>.png`. The slide stores the resulting `/screenshots/uploaded/...` path, so commit those files alongside `app-store-screenshots.json` and the screenshots survive a `git clone`.
2. **Reference a static file** — put PNGs under `public/screenshots/{platform}/{device}/{locale}/` and reference them by path. Suggested folders:
   - `public/screenshots/apple/iphone/en/...`
   - `public/screenshots/android/phone/en/...`
   - `public/screenshots/apple/ipad/en/...`

Update the matching `screenshot` fields in `app-store-screenshots.json` to point at whatever filenames you choose.

## Exporting

The toolbar selects the device. The exporter uses the size presets in `src/lib/constants.ts`. Check current store requirements before delivery. Click **Export bundle** to download a zip. In Connected mode, each PNG is clipped from the connected canvas, so an element that straddles two screens appears split exactly where you placed it. In Isolated mode, each screen clips its own elements and legacy offscreen content cannot leak into neighboring exports.

## Templates

Choose **App screen**, **Creator with app**, or **Content library** in Screen settings. All three use a real app capture. Creator adds a separate photo. Library adds two to four catalog images. Each image has horizontal crop, vertical crop, zoom, and Reset crop controls. Template changes preserve these assets. Crops apply to all language variants; review every language.

Portrait creator layouts place the app view over the lower part of the photo. Use the crop controls to keep faces and important details clear. The library layout keeps artwork beside the app view. Older layouts remain available.

## Brand and export review

The toolbar's **Background** picker supports solid colors, linear/radial gradients with two to five stops, and PNG/JPG uploads. Image controls include fill or fit, crop position, zoom, base color, and tint. Set a project default or a screen override. The live preview uses the real template. Apply saves the change; Cancel discards it. Reset can restore project or brand inheritance. See [background controls](../references/backgrounds.md).

Use **Brand** in the toolbar to set customer background and text colors, headline type, alignment, and app icon. The values are saved in the project and applied across devices and languages. Local font stacks need no external font request. Exact customer fonts require licensed local files and an update to the selected stack in `src/lib/brand.ts`.

New projects use centered headlines at 13% of the canvas's shorter side. This is about 41% larger than the previous default. Existing explicit alignment choices remain in effect. Keep copy short and review each line break.

The starter has one empty screen per device, no marketing filler, and no saved demo transforms. It uses isolated mode. The checked-in project and the separate reset starter must match before release; a test checks this. Customer edits do not change the reset starter.

Export stops for missing headlines, incomplete translations, missing or unavailable required images, mismatched Apple capture proportions, insufficient basic headline contrast, and text that exceeds its frame. Text is measured in the browser for every target language before capture. Preview fallback text does not count as a completed translation. These checks do not detect all overlaps, cropping errors, or translation errors. Inspect every PNG.

The bundle includes `review/<locale>.png`, a contact sheet made from the exported images in order. Use it for review. Upload only the separate full-resolution store images.

For custom backgrounds, the contrast check uses the selected solid color or samples the gradient. Uploaded backgrounds need visual contrast review. Their missing or unreadable files block export. New background fields are optional, so old project files retain their appearance.

## Customizing

| Where | What |
|-------|------|
| `src/lib/constants.ts` | Canvas dimensions, export sizes, frame ratios, themes |
| `app-store-screenshots.json` | Saved project: app name, current device, connected-canvas mode, slide copy, screenshots, and transforms |
| `src/lib/defaults.ts` | Loads `src/lib/starter-project.json` for fallback/reset state |
| `src/components/editor/slide-canvas.tsx` | Add new layouts and connected-canvas element rendering |
| `src/lib/apple-frames.json` | Original Apple frame dimensions, source hashes, and measured screen masks |
| `src/components/editor/device-frames.tsx` | Place app captures below the unchanged Apple bezel |
| `src/lib/brand.ts` and `src/app/globals.css` | Configure licensed local customer fonts |

## Notes

- Apple bezels keep their original proportions, including in old saved transform boxes. The app capture sits below one bezel and uses the measured aperture mask. Do not add a second camera shape or alter the source image. `mockup.png` remains a legacy test fixture; the renderer does not use it.
- Image preloading converts every static path to a base64 data URI before exports run, and export retries paths that were previously missing — this prevents the html-to-image race where some slide screenshots come out black.
- Reset via the toolbar's circular arrow icon clears in-memory state and reloads the default screens. When the editor is connected, autosave also writes the reset defaults to the project file. Back up the file before reset.
- **Persistence model** — the canonical state lives in `app-store-screenshots.json` (git-tracked). On load, the editor reads localStorage first for instant paint, then overwrites with the file contents if present; if the file endpoint is unavailable, autosave is blocked so stale cache cannot overwrite disk. On save, both are written. If you ever see a conflict, the file always wins.
- **Migration model** — schema v1 projects do not need a manual conversion. On first load, the editor upgrades localized text and transform records, writes `schemaVersion: 2`, preserves all existing screens, and keeps `connectedCanvas: false` so old offscreen/clipped elements export exactly as isolated screens. Turn on **Connected** in the toolbar when you want elements to cross screen edges. Explicit skill migrations preserve an existing `connectedCanvas` choice, otherwise they keep legacy decks isolated too.
- **Custom themes** — if a project file references a theme id that is not present in `src/lib/constants.ts`, the editor falls back to `brand-neutral` and shows a warning. Merge custom `THEMES` entries during in-place upgrades.

## Browser regression check

Run `npm run build` and `node tests/templates-browser.mjs` in an environment with the Playwright package and Google Chrome. If Playwright is supplied by an external runtime, set `PLAYWRIGHT_MODULE` to that runtime's module path. Pass an output directory as the first argument to retain test review sheets. The test uses an isolated temporary project and synthetic app images; it does not modify customer projects.

The check covers photo and catalog uploads, crop changes and persistence, template changes, library add/remove, English and German export, text overflow, iPad portrait and landscape export, review sheets, frame route access, unchanged frame bytes, and camera pixels in the exported iPhone image. It does not establish design approval for a real customer.

Run `node tests/backgrounds-browser.mjs` with the same setup for background controls. It checks cancellation, undo/redo, reload, gradient stops and center, image upload/crop/fit/tint, project and screen scope, export pixels, and a missing-image failure. An optional output directory retains screenshots of the picker and exported review images.

Run `node tests/elements-browser.mjs` with the same browser setup for the element editor. It uses an isolated project to check all nine element types, image upload and reuse, crop, layer controls, groups, saved reuse, copying, persistence, PNG export, missing translations/images, and a narrow viewport. The pure tests also validate schema limits, independent copies, group placement and alignment, and snapping.
