---
name: app-store-screenshots
description: Set up and use a local App Store screenshot editor on Mac or Windows. Guide first-time users, reopen customer projects, and create branded App Store and Google Play images from real captures. Includes Uscreen feature checks, asset intake, listing strategy, localization, and PNG export.
---

# App Store Screenshots

Build a local screenshot editor from `template/`. Use the customer's real app screens and brand to make a clear listing. Each slide connects one useful benefit to visible evidence in the app.

Source: `mweisberg21/app-store-screenshots`. Keep the original MIT license and author credit. This workflow is self-contained; teammates do not need other design or ASO skills. ASO means App Store optimization. Here, its purpose is to help the right visitor understand the app and decide to download it.

## First use and returning users

For setup, a repository-URL request, or a user who needs help getting started, read [references/first-run.md](references/first-run.md). Verify access to the user's actual computer, handle Mac or Windows setup, open and check the editor, then guide the first useful task one step at a time. Use plain language. Do not stop after installation or send the user a command list.

For "run this skill" or "open my screenshots," find the existing customer project and its `HOW-TO-OPEN.md` note. Start it and open a fresh private link. Preserve the project; do not install again, reset the deck, or repeat first-use questions without a reason. If the customer or project is unclear, ask which one to open. Explain that the user can ask for changes in normal language.

## Ask for assets throughout the work

At each user-facing stage below, ask about assets before making choices that depend on them. Use this opening question: **"Do you have any assets you want to provide, specific screenshots, logos, colors, etcetera?"** Then make later questions specific to the current stage. These are requests for useful input, not extra permission gates.

| Stage | Asset check-in |
| --- | --- |
| Start the brief | Ask the opening question. Offer to use attachments, local paths, a brand guide, or an existing approved project. |
| Plan the feature sequence | Ask which app areas matter most, and whether the user has captures for them. Offer a short capture list for missing screens. |
| Build the first slide | Name the assets already supplied. Ask for any preferred logo variant, font, colors, creator photo, content art, or background image. |
| Add each new feature or revise a slide | Ask whether there is a better capture, featured video, photo, or other asset for that part of the app. Group related slides in one check-in. |
| Add devices or languages | Ask for matching iPad/Android captures, localized UI, approved translations, or local artwork. |
| Prepare final exports | Ask whether any image, logo, color, capture, or copy must be replaced before delivery. |

Record each answer and pending item in the brief. Show what is already available; do not ask the user to supply the same file again. Offer three simple paths: provide assets, use existing assets, or get help with captures. Respect an explicit request to use existing files throughout or to stop further questions. Otherwise, keep the stage check-ins. For a narrow edit, use only the stages it touches.

Give the user time to answer. Continue independent work while input is pending; do not treat silence as asset approval. Keep dependent choices marked as drafts. If required captures are missing, give a specific capture list and keep final delivery pending. Ask for files in the host's normal chat or attachment flow; do not use a text-only question tool to request file uploads. Never ask for passwords or access tokens.

## 1. Read the project and customer brief

Use `rg --files` to find the project file, package file, screenshot assets, and `customer-brief.md` before creating files.

- Preserve existing copy, assets, devices, languages, and brand settings.
- For an upgrade, read [references/migration.md](references/migration.md). Never replace a customer deck with starter content.
- Use a separate project folder for each customer. Never mix assets from different customers.
- Read information already supplied, including `app-marketing-context.md` when present. Keep it as context; verify claims against the current app. Use the stage check-ins above without repeating the full brief.

Record these facts in `customer-brief.md`, using [customer-brief.example.md](customer-brief.example.md):

1. App name, audience, primary user task, and listing goal. Read the current listing if supplied; confirm the target market and any campaign audience.
2. Real screenshot paths and the feature shown in each image.
3. Customer brand source: approved colors, logo, type, website, or brand guide. Read the supplied source. Do not derive a palette from the app category alone.
4. Features in priority order, with evidence that each exists in this customer's app.
5. Required store, devices, languages, and intended slide count.

For Uscreen work, read [references/uscreen-mobile-features.md](references/uscreen-mobile-features.md) before suggesting features or captures. It maps member benefits to app screens and explains platform limits. Verify every proposed feature in this customer's native app, version, and member access state. Mark each as verified, unavailable, or needs evidence. Use the customer's brand and content; do not apply Uscreen branding to every app. Keep private customer material out of this public tool repository.

Prioritize the customer's content, teachers, programs, playback, community, and live experiences where supported. Do not propose downloads as a screenshot topic or use them to fill a spare slot. Include a download slide only when the user explicitly requests one.

If brand material is missing, use the neutral starter while preparing the structure. Mark the brand choice as unresolved. Do not invent a final identity. If captures are missing, prepare the brief and list the captures needed. Do not fabricate app UI.

## 2. Choose a direction from the customer material

For an App Store deck, read [references/aso-screenshot-playbook.md](references/aso-screenshot-playbook.md) before writing the sequence. Record each slide's visitor need, benefit, real capture, and evidence. Put the strongest useful experience first. Match the number of slides to the evidence and brief; do not force ten slides or a promotional closer. Check Google Play's own current rules for a Play deck; Apple rules do not establish Play compliance.

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
- Review the first complete slide at full size and at 160–220 pixels wide before expanding the set. Report the design choices and unresolved input. Make the first-slide asset check-in, then carry the chosen design through the set. Honor any pending asset input or requested design approval.

Named styles in [style-prompts.md](style-prompts.md) are optional references. Open one only when the user explicitly selects it. Its effects, decorative counts, invented sample UI, and fixed slide sequence never override real captures, the feature evidence, asset check-ins, or these rules. Do not choose the nearest preset by category.

## 3. Create the local editor

Copy `template/` into the chosen project folder. Do not rebuild the renderer or export system. Do not overwrite unrelated files. Use native filesystem tools on Windows; the shell example below is for Mac. The first-run guide covers Windows command shims and paths. Run commands for the user when tools allow it.

```bash
cp -R "<SKILL_DIR>/template/." "<PROJECT_DIR>/"
cd "<PROJECT_DIR>"
npm ci
npm run dev
```

Use Node.js 22 or newer. Open the exact private `/unlock#...` link printed by the launcher. For a different port, use `npm run dev -- --port 3001`.

For Apple decks, read [references/apple-frames.md](references/apple-frames.md). The package includes original Apple bezels, used by default for every iPhone and iPad device layout. Copy `public/device-frames/` and `public/licenses/` with the template. Do not ask the user to download or import frames during setup. The launcher and frame route check the original file hashes. If a package file is missing or damaged, repair it from the same repository version or an intact installed template; a local cache can also restore it. Preserve customer work during repair. Use the measured bezel above the capture. Do not draw substitute Apple hardware, add a second camera, or modify the source PNG. Keep the Apple attribution and supplied license separate from the code's MIT license. Verify frame loading before marking Apple export ready.

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
- Check the planned benefit-to-capture sequence. Verify access conditions for featured paid content; do not imply that a paid membership or purchase is free.
- Remove placeholders and private account data.
- Inspect full-resolution PNGs and thumbnails.
- Check text bounds, contrast, device crop, screenshot visibility, and each Connected-mode seam.
- Check that the set reflects this customer, rather than the neutral starter with a new logo.
- Check current store requirements. Export presets do not guarantee coverage of every current requirement.

Apple requires screenshots to show the app in use; text overlays can explain it. Follow [Apple's accurate metadata rules](https://developer.apple.com/app-store/review/guidelines/#accurate-metadata). Real app content supports the marketing message.

## 6. Export and hand off

Complete the final asset check-in. Resolve required replacements before calling the set final. If feedback is pending, label exports as drafts.

Choose the device, then **Export bundle**. Fix items in the export review dialog and try again. Repeat for the devices in the brief. Store-image paths are `<platform>/<device>/<WxH>/<locale>/NN-<layout>.png`. The bundle also includes `review/<locale>.png`, a contact sheet for review. Do not upload review sheets to the store.

Keep the brief, project JSON, assets, local fonts, and editor version together in the customer's approved project location. Never commit customer assets to the public tool fork. Do not submit or publish a listing unless the user asks.

Report exported devices and languages, output files, completed checks, and unresolved decisions. Include the slide-to-feature list so the teammate can trace each claim to its capture. If optimization is in scope, propose one test hypothesis and a metric; do not claim a conversion gain from appearance alone. Give the private start link only to the local operator. See [team-guide.md](team-guide.md) for teammate setup.
