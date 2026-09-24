# Team guide

Use one local project for each customer. The customer's brand controls the screenshot design. uScreen is the team context, not a theme to apply to every customer.

## First-time users

Share [Start here](https://github.com/mweisberg21/app-store-screenshots/blob/improve-brand-defaults/START-HERE.md). It has a short request to paste into Claude, a plain-language walkthrough, and examples for later use. The assistant handles setup on Mac or Windows, checks local access, opens the editor, and teaches one step at a time. It leaves a `HOW-TO-OPEN.md` note with the user's actual project location.

The setup steps below are for the assistant or an experienced operator. New users do not need to run these commands. The installed skill carries its own [first-run guide](references/first-run.md).

## Agent setup

Use an agent that can read local files, run Node.js, and open a browser, such as Codex or Claude Code. See the [Codex skill documentation](https://developers.openai.com/codex/skills/) and [Claude Code skill documentation](https://code.claude.com/docs/en/skills).

The current team version is on the `improve-brand-defaults` branch in [draft PR 1](https://github.com/mweisberg21/app-store-screenshots/pull/1). A default-branch install does not include these changes yet. Install this draft with:

```bash
npx skills add https://github.com/mweisberg21/app-store-screenshots/tree/improve-brand-defaults/skills/app-store-screenshots -g
```

Choose your supported agent in the installer. Use Node.js 22 or newer. The skill includes the design rules and template; no extra design plugin or image generation account is required.

The bundle has one entry skill plus supporting guides. It includes an [ASO playbook](references/aso-screenshot-playbook.md), a [Uscreen feature and capture guide](references/uscreen-mobile-features.md), design research, and local editor instructions. The agent reads the relevant guide as it plans the work. It does not need another ASO skill installed.

## Start a customer project

Create an empty folder in your approved customer work area. Open it in your agent. Supply this request with the customer material:

```text
Use app-store-screenshots to create a listing for this customer.
Read customer-brief.md and the supplied app captures first.
Use the customer's approved brand and verified features.
Plan the sequence around the audience and the customer's content.
Ask for assets at each stage. Keep a record of files already supplied.
Help me capture the app sections needed to support each message.
Do not suggest download slides unless I ask for them.
Start with one complete slide, then extend the same design to the set.
Keep the actual app content readable. Do not invent claims or add
decorative effects without a reason from the customer material.
Run the local editor, check the exported PNGs, and list missing input.
```

Use [customer-brief.example.md](customer-brief.example.md) for the brief. A brand guide or current website helps the agent choose colors and type. App captures show which features can be claimed. The app icon is needed for the Play Store feature graphic.

## What the agent will ask

It starts with: "Do you have any assets you want to provide, specific screenshots, logos, colors, etcetera?"

It then asks for relevant assets when it plans features, makes the first slide, adds a feature, adds a device or language, and prepares final exports. It names the files it already has. You can provide more files, ask for capture help, or tell it to use the existing files. You can also tell it to use those files throughout and stop further asset questions.

For each planned image, the agent records the member benefit, real app screen, device, language, and claim evidence. If a capture is missing, it gives a short capture list with the app area and state needed. It does not invent a feature to complete the deck.

For Uscreen apps, start with the customer's content, teachers, programs, playback, community, and live experiences where supported. Confirm the features in that customer's native app. Downloads are excluded from suggested sequences unless requested. Do not assume a feature exists on mobile because it appears on the website or an admin page.

## Editor workflow

The package includes the original iPhone and iPad frames. They are used by default and need no separate download or import. Copy the full template, including `public/device-frames/` and `public/licenses/`. See [included Apple frames](references/apple-frames.md) for recovery if an installation is incomplete. The editor's **Credits** button shows the asset source and license notices.

1. Start the project with `npm ci`, then `npm run dev`.
2. Open the private link from the terminal.
3. Set the app name. Use **Brand** to set colors, type, alignment, and the app icon. New projects use large, centered headlines.
   Use **Background** for a solid, gradient, or image background. Choose the project default or one screen. Preview the crop and text color, then apply. See [background controls](references/backgrounds.md).
4. Choose **App screen**, **Creator with app**, or **Content library**. Add a real app screenshot and one clear headline. Add an approved creator photo or two to four catalog images when the template needs them. Use crop controls to keep faces and titles clear.
5. Add more screens and the required translations.
6. Select **Export bundle**. Resolve any missing content shown in the review dialog.
7. Open the review sheet in `review/<locale>.png` to check image order. Inspect each separate store PNG at full size and as a thumbnail. Ask the assigned customer reviewer to check the result.

The asset check-ins happen in the agent conversation. They are skill instructions, not forced dialogs in the editor. Direct manual use of the editor does not run them.

Use a matching iPhone or iPad capture. The automatic checks cover completeness, Apple capture proportions, headline contrast, and measured text overflow. They do not verify product claims, translation quality, element overlap, image crops, or current store rules. Keep those checks in the delivery review.

## Using a chat interface

The repository is a local Node.js editor plus an agent skill. It is not a built-in ChatGPT or Claude chat plugin. A chat session needs a local execution tool to launch this editor on your computer. Otherwise, use the chat for the brief, copy, and visual review, then use the local editor or a coding agent for rendering and export. Do not assume that attaching SKILL.md starts a local server.

## Customer files and team handoff

Keep the brief, JSON project, approved images, fonts, and output PNGs in the customer's approved storage. Share that project with the next teammate through your normal private process. Keep the public tool fork free of customer images and data.

The editor runs on one computer. Each teammate starts a separate local copy; the private start link is not a team collaboration link. Installing a newer skill does not update old customer projects. Ask the agent to migrate the project with a backup.

## Before a wider team rollout

Run a pilot with two different customer brands. Use actual assets and at least one non-English language. Measure setup time, manual layout changes, export failures, and reviewer corrections. Use those results to choose the next changes.
