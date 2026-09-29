# Existing project migration

Use this guide when the required [update procedure](updates.md) finds an older project format or an earlier editor implementation. Routine updates use that procedure; they do not need a new customer brief or a separate migration confirmation. Complete its source check and backup before changing files.

Migration updates the editor and, only when needed, the saved data format. It must not redesign the customer's listing. Preserve local work and stop for a specific decision only when a conflict or unknown format prevents safe preservation.

## Inspect the existing project

Use file discovery and native file reads on Mac or Windows. Inspect `package.json`, `app-store-screenshots.json`, source files, public assets, the installed source record, and the customer's handoff note. Search for `ScreenshotEditor`, `DeckCanvas`, `connectedCanvas`, `html-to-image`, and embedded slide data when the saved project is missing.

An older implementation can have:

- A project file with no schema version, a version below the current supported format, or no `connectedCanvas` field.
- An older editor with slide data or custom themes embedded in `src/app/page.tsx` or `src/lib/defaults.ts`.
- Earlier device frames and screenshot paths under `public/`.

Compare the data with the updated template's types and validation code. A current-format project needs no state conversion merely because tool code changed. If the saved format is newer than the tool supports, stop and resolve the source version. Never downgrade it.

## Preserve the customer's work

Follow the update guide's backup and server-save steps. Do not use a blanket template copy followed by a best-effort restore. Stage the verified tool files separately, compare them with the previous source and local files, and merge changes before installation.

Keep all customer-owned files and all saved project fields, including:

- App name, icon, brand colors, fonts, custom themes, and background settings.
- Slides, their order and layouts, copy, translations, device decks, and locales.
- Screenshot paths, creator photos, catalog images, crop positions, and transforms.
- Text and other elements, groups, saved groups, asset library entries, and hidden or locked states.
- Briefs, handoff notes, exports, local instructions, and local code changes.

Copy the updated tool code, dependency files, packaged frames, and license notices as described in [updates.md](updates.md). Never replace the customer's `app-store-screenshots.json` with the template's starter. Do not rename or remove customer assets to make the new template fit.

Merge custom themes, fonts, and local renderer changes. If a referenced custom theme cannot be found, report the missing source before accepting a visual fallback as the customer's design. Preserve unrelated package scripts and dependencies where compatible. Reconcile the lockfile with the resulting package file before installation.

## Convert data only when required

Use structured JSON reads and writes. Build the converted state in a separate file and validate it before replacing the saved project. Keep the backup and original state until verification succeeds.

For a pre-v2 project:

1. Preserve an explicit boolean `connectedCanvas`. If absent, set it to `false` so old offscreen device crops remain isolated.
2. Convert legacy string copy into localized text using the project's actual language. Preserve existing locale maps and all configured languages. Do not assume English when the files identify another language.
3. Preserve supported layouts, IDs, transforms, paths, and all newer fields already present. Use the updated schema's supported values; do not use a fixed old layout list that would remove creator or library layouts.
4. Convert legacy slide arrays into device decks using evidence in the existing files. Do not discard a deck because it is incomplete or currently inactive.
5. If slide data is embedded in source instead of JSON, extract it into a separate candidate project. Compare every recovered slide and asset path against the original. Do not replace uncertain data with starter content.
6. Set the schema version only after the resulting structure satisfies that version's validation. Report an unresolved field or conversion error instead of silently dropping it.

A folder with only image files does not establish slide order, copy, or device mapping. Preserve those images and request only the missing decisions needed to recover the project.

## Verify before continuing

After installing dependencies required by the updated package, run the appropriate tool checks and reopen the editor with a fresh private link. Check:

- Customer app name, brand, copy, images, slides, order, and all device/language sets remain present.
- Existing elements, assets, backgrounds, saved groups, and local customizations still work.
- A legacy deck stays isolated unless it had already selected connected mode.
- Referenced assets resolve. Missing captures or translations remain visible as work to complete; do not remove the affected slides.
- The project loads and saves. An export for a complete device/language set succeeds and preserves its intended appearance. If customer assets are incomplete, keep final export pending and report the missing input.

Record the verified source revision and backup location as specified in the update guide. Then continue the original request without repeating the first-use tutorial. If conversion or validation fails, preserve the old working project and explain the specific conflict before further customer work.
