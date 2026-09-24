---
name: app-store-screenshots
description: Create customer-branded App Store and Google Play screenshots from real app captures. Use for store listing images, screenshot decks, local editor setup, localization, and PNG export. Includes brand intake, restrained design defaults, and export checks.
---

# App Store Screenshots

Build a local screenshot editor from `template/`. Use the customer's real app screens and brand to make a clear listing. Each slide connects one useful benefit to visible evidence in the app.

Source: `mweisberg21/app-store-screenshots`. Keep the original MIT license and author credit. This workflow is self-contained; teammates do not need other design skills.

## 1. Read the project and customer brief

Use `rg --files` to find the project file, package file, screenshot assets, and `customer-brief.md` before creating files.

- Preserve existing copy, assets, devices, languages, and brand settings.
- For an upgrade, read [references/migration.md](references/migration.md). Never replace a customer deck with starter content.
- Use a separate project folder for each customer. Never mix assets from different customers.
- Use information already supplied. Ask only for missing facts that affect the result. Do not repeat a full questionnaire.

Record these facts in `customer-brief.md`, using [customer-brief.example.md](customer-brief.example.md):

1. App name, audience, and primary user task.
2. Real screenshot paths and the feature shown in each image.
3. Customer brand source: approved colors, logo, type, website, or brand guide. Read the supplied source. Do not derive a palette from the app category alone.
4. Features in priority order, with evidence that each exists in this customer's app.
5. Required store, devices, languages, and intended slide count.

For uScreen work, verify every claim against that customer's app. Do not assume every app supports downloads, casting, live events, community, or a subscription feature. Use approved customer images and copy. Keep private customer material out of this public tool repository.

If brand material is missing, use the neutral starter while preparing the structure. Mark the brand choice as unresolved. Do not invent a final identity. If captures are missing, prepare the brief and list the captures needed. Do not fabricate app UI.

## 2. Choose a direction from the customer material

Read [references/listing-design-research.md](references/listing-design-research.md) for the observed patterns, three template types, and their limits. Use App screen by default. Use Creator with app for an approved creator photo. Use Content library for two to four approved catalog images. Each template still requires a real app capture.

Write three short decisions in the brief:

- **Color:** the supplied source that supports the palette.
- **Type:** the customer font or suitable local fallback, and the reason for it.
- **Composition:** the important content in the captures and how the layout keeps it visible.

Apply these design rules:

- Show the actual app. Choose useful, readable captures before adding a device frame or headline.
- Start with a solid background. White, black, and customer colors are all valid.
- Use solid headline text with strong contrast. Use 4.5:1 as a conservative thumbnail target.
- Start with large, centered headlines. Keep the same type size across the set. Use short copy that fits the template; do not shrink it to fit a paragraph.
- Keep one main message per slide. Use concrete language tied to what the app does.
- Leave the small label empty unless it adds useful context. Avoid filler labels, slogans, invented awards, ratings, and customer counts.
- Repeat a layout when it helps the reader. Do not force alternating backgrounds, tilted phones, or different layouts.
- Start in isolated mode. Use Connected mode only for a deliberate composition. Every exported slide must remain understandable on its own.
- Add an effect only when the brand or content gives it a clear purpose. There is no decoration quota. Remove unused badges, glow, blurred shapes, gradient text, and generic icons.
- Keep one type decision consistent across the set. Use approved local font files when exact brand typography matters. Do not assume a suggested font is installed.
- Review the first complete slide at full size and at 160–220 pixels wide before expanding the set. Report the design choices and unresolved input. Continue with that direction unless the user asked to approve it first.

Named styles in [style-prompts.md](style-prompts.md) are optional references. Open one only when the user explicitly selects it. Its effects, decorative counts, and fixed slide sequence never override the customer brief or these rules. Do not choose the nearest preset by category.

## 3. Create the local editor

Copy `template/` into the chosen project folder. Do not rebuild the renderer or export system. Do not overwrite unrelated files.

```bash
cp -R "<SKILL_DIR>/template/." "<PROJECT_DIR>/"
cd "<PROJECT_DIR>"
npm ci
npm run dev
```

Use Node.js 22 or newer. Open the exact private `/unlock#...` link printed by the launcher. For a different port, use `npm run dev -- --port 3001`.

For Apple decks, read [references/apple-frames.md](references/apple-frames.md). Original Apple bezels are the default for every device layout. Keep the local template's `public/device-frames/` files when copying it into a customer project. The launcher checks these files and restores them from the local cache when needed. If neither source is ready, import the user's originals once with `npm run frames:import -- "/path/to/Apple Device Frames"`, then reload. This also prepares the local cache for future projects. Use the measured original bezel above the capture. Do not draw substitute Apple hardware, add a second camera, or modify the source PNG. Keep Apple's source assets local and out of shared tool packages. If files are missing, prepare the deck and report the required import; do not claim that Apple export is ready.

The launcher binds to `127.0.0.1` and creates a session token on each start. Use `npm run dev` or `npm start`; do not bypass it. Each teammate runs a local copy. Do not share the private link, expose a tunnel, or deploy this as a shared website.

The API validates writes, limits project JSON to 4 MiB, and limits each uploaded PNG/JPEG to 8 MiB. Upload storage is limited to 256 MiB and 1,000 files. Do not bypass limits with embedded image data. See the template README for storage recovery.

## 4. Set the brand and content

The first-run project has one empty screen per device. It is a starting point, not a customer example. Its content matches the separate Reset starter; edits to a customer project do not change that starter.

1. Set the app name in the toolbar.
2. Open **Brand** to set background, text color, headline type, alignment, and the app icon. These settings apply to all devices and languages.
3. Upload a real capture with **Pick**, or copy approved files into `public/screenshots/` and reference them by local path.
4. Write a short headline supported by the capture. Add screens only when there is another useful point.
5. Choose a template that protects the important part of the capture. Keep device proportions and critical UI intact.
6. For Creator with app, add the creator photo. For Content library, add two to four catalog images. Use horizontal crop, vertical crop, and zoom to keep faces and text visible. The portrait creator template puts the phone over the lower part of the photo; keep faces clear of it.
7. Use **Background** when the brief calls for a different surface. Read [references/backgrounds.md](references/backgrounds.md). Choose a solid color, linear/radial gradient, or approved background image. Set the project default or one screen override. Keep the solid starter unless the brand or user calls for another background. Review the real template in the picker before applying. Use fill, fit, crop, zoom, and tint to protect headline readability.

An agent can set these values in `app-store-screenshots.json`. Use structured JSON edits. The optional `brand` object is:

```json
{
  "background": "#FFFFFF",
  "foreground": "#202020",
  "font": "sans",
  "alignment": "center"
}
```

These colors are neutral placeholders. Font choices are `sans`, `serif`, and `humanist`; alignment is `left` or `center`. Colors use six-digit hex values. Verify the actual local font in the preview. For exact customer type, put licensed files in `public/fonts/`, define `@font-face` in the existing CSS, and update the selected stack in `src/lib/brand.ts`. Keep font files with the project.

Each slide has `id`, `layout`, `label`, `headline`, and `screenshot`. Text fields map language codes to strings. Optional fields include `photo`, `artworks`, `screenshotSecondary`, `inverted`, `transforms`, and `textElements`. Main template keys are `device-bottom` (App screen), `creator`, and `content-library`. Other layouts are `hero`, `device-top`, `two-devices`, `no-device`, `split-landscape`, and `feature-graphic`.

A photo is `{ "src": "/screenshots/creator.jpg", "crop": { "x": 50, "y": 50, "zoom": 1 } }`. `artworks` is an array of two to four objects with the same shape. Crop positions range from 0 to 100; zoom ranges from 1 to 3. Crop is optional and defaults to the center at 1×. Image paths can include `{locale}`. Changing templates preserves these assets. Each crop is shared across language variants, so inspect each variant.

The three main templates support landscape tablets. Use real tablet captures with the selected frame's proportions; do not stretch a phone capture to imply a tablet interface. The older `split-landscape` layout is also available. Text-only slides are a deliberate exception, not a required closer.

Keep existing custom themes during migration. For new projects, prefer saved `brand` settings over changes to shared template code.

## 5. Localize and review

Set `locales` and `locale` from the brief. Do not assume English if the customer supplied another language. Screenshot paths can include `{locale}`, such as `/screenshots/iphone/{locale}/01.png`.

Preview can show fallback copy while work is incomplete. Final export requires the headline, each used label, and added text in every target language. It checks required images, Apple capture proportions, basic headline contrast, and browser-measured text overflow for every target language. Shorten overflowing text or enlarge its frame. These checks do not prove correct translation, safe element overlap, image crop, or store approval.

Solid and gradient contrast checks use the selected background. Image backgrounds require visual review of the text against the image. Check each language and orientation; the image crop can change with screen proportions. Missing background images block export.

Inspect every language at export size. Check long words, line breaks, and right-to-left text. Do not claim RTL layout support from translated text alone. Use a fluent reviewer where needed.

Before delivery:

- Confirm every claim against the customer's app and brief.
- Remove placeholders and private account data.
- Inspect full-resolution PNGs and thumbnails.
- Check text bounds, contrast, device crop, screenshot visibility, and each Connected-mode seam.
- Check that the set reflects this customer, rather than the neutral starter with a new logo.
- Check current store requirements. Export presets do not guarantee coverage of every current requirement.

Apple requires screenshots to show the app in use; text overlays can explain it. Follow [Apple's accurate metadata rules](https://developer.apple.com/app-store/review/guidelines/#accurate-metadata). Real app content supports the marketing message.

## 6. Export and hand off

Choose the device, then **Export bundle**. Fix items in the export review dialog and try again. Repeat for the devices in the brief. Store-image paths are `<platform>/<device>/<WxH>/<locale>/NN-<layout>.png`. The bundle also includes `review/<locale>.png`, a contact sheet for review. Do not upload review sheets to the store.

Keep the brief, project JSON, assets, local fonts, and editor version together in the customer's approved project location. Never commit customer assets to the public tool fork. Do not submit or publish a listing unless the user asks.

Report exported devices and languages, output files, completed checks, and unresolved decisions. Give the private start link only to the local operator. See [team-guide.md](team-guide.md) for teammate setup.
