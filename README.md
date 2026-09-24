# App Store Screenshots

A local editor and agent skill for teams that create App Store and Google Play listing images for customer apps. Start with real app captures and the customer's brand. Use the browser editor to refine the deck and export PNGs.

This fork retains Parth Jadhav's MIT license and author credit. It adds local access controls, validated saves, upload limits, and a workflow for customer work.

## Start here

- [Team guide](skills/app-store-screenshots/team-guide.md): setup, a reusable request, and customer handoff.
- [Customer brief](skills/app-store-screenshots/customer-brief.example.md): brand sources, features, assets, devices, and languages.
- [Design research](skills/app-store-screenshots/references/listing-design-research.md): six current listing references and three template types.
- [Skill instructions](skills/app-store-screenshots/SKILL.md): the complete agent workflow.

## What the editor does

- Saves customer background, text color, headline type, and alignment through **Brand** controls.
- Provides App screen, Creator with app, and Content library templates.
- Keeps creator photos and catalog artwork separate from app captures, with saved crop and zoom controls.
- Shows real captures in iPhone, iPad, and Android device frames.
- Supports per-device decks, localized copy, ordering, and element placement.
- Starts with one empty, isolated screen per device. Connected mode is available for deliberate compositions.
- Saves the project to `app-store-screenshots.json` and stores uploads in the project.
- Checks missing text, translations, required images, headline contrast, and measured text overflow before export.
- Exports PNG bundles using the configured device-size presets, plus a review sheet for each language.

These checks do not verify product claims, translation quality, element overlap, image crop, or store approval. Inspect the PNGs before delivery.

## Design direction

Use the **App screen** structure as the base: one clear headline, one real app capture, and a customer brand surface. Repeat the layout when it helps the reader. Decorative effects are optional.

Choose **Creator with app** when a teacher or creator is central to the service. Choose **Content library** for two to four approved catalog images beside the app view. Use crop controls to keep important content visible. The neutral starter is a work surface, not a finished customer design.

## Install

Use Node.js 22 or newer and a coding agent with local file and command access, such as Codex or Claude Code.

```bash
npx skills add mweisberg21/app-store-screenshots -g
```

Choose the supported agent in the installer. The skill includes its design instructions and template; no additional design skill is required.

Manual shared install:

```bash
git clone https://github.com/mweisberg21/app-store-screenshots
mkdir -p ~/.agents/skills
cp -R app-store-screenshots/skills/app-store-screenshots ~/.agents/skills/
```

Agent discovery paths can differ. See the [team guide](skills/app-store-screenshots/team-guide.md). This repository is not a built-in chat plugin. A chat session needs a local execution tool to run the editor; otherwise it can help prepare copy and review images while a local agent handles rendering.

## Create a customer project

Use a separate folder for each customer. Supply the brief and approved captures, then ask the agent:

```text
Use app-store-screenshots for this customer.
Read customer-brief.md and the real captures first.
Use the customer's brand and verified features.
Create one complete slide, then extend the design to the set.
Check every exported image at full size and thumbnail size.
```

After the agent creates the project:

```bash
npm ci
npm run dev
```

Open the private link printed in the terminal. For another port, use `npm run dev -- --port 3001`.

## Local access and customer files

The launcher binds to `127.0.0.1` and creates a temporary session token. Each teammate runs a separate local copy. Do not share the private link or deploy this editor as a shared website.

Project writes require the local session and origin. Each uploaded image is limited to 8 MiB. Stored uploads are limited to 256 MiB and 1,000 files. See the [template README](skills/app-store-screenshots/template/README.md) for recovery and checks.

Keep customer briefs, images, project files, and exports in approved private storage. Do not commit customer material to this public tool repository. Installing a newer skill does not update existing customer projects; migrate them with a backup.

## Store formats

The editor includes presets for iPhone, iPad, Android phones and tablets, and a 1024 × 500 Google Play feature graphic. It exports the selected device at each configured size and language. Presets do not guarantee coverage of every current store requirement.

Check [Apple's screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications) for the customer's target devices before delivery. Product page header and search creative assets are separate formats from gallery screenshots.

## Development

The Next.js template is in `skills/app-store-screenshots/template`. Run these commands there:

```bash
npm ci
npm test
npm run typecheck
npm run build
npm run test:runtime
npm run test:runtime:dev
npm audit
```

The tests cover local access, body limits, project validation, upload limits, brand persistence, crop validation, template geometry, and export completeness. An optional browser test covers saved crops, text overflow, and actual PNG bundles: see the template README. See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance.

## License and origin

MIT. Originally created by [Parth Jadhav](https://www.parthjadhav.com/).

The original repository's [example image](example.png) is retained as historical reference. It does not show this fork's current starter.
