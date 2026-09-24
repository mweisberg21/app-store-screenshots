# Team guide

Use one local project for each customer. The customer's brand controls the screenshot design. uScreen is the team context, not a theme to apply to every customer.

## Agent setup

Use an agent that can read local files, run Node.js, and open a browser, such as Codex or Claude Code. See the [Codex skill documentation](https://developers.openai.com/codex/skills/) and [Claude Code skill documentation](https://code.claude.com/docs/en/skills).

Install the fork:

```bash
npx skills add mweisberg21/app-store-screenshots -g
```

Choose your supported agent in the installer. Use Node.js 22 or newer. The skill includes the design rules and template; no extra design plugin or image generation account is required.

## Start a customer project

Create an empty folder in your approved customer work area. Open it in your agent. Supply this request with the customer material:

```text
Use app-store-screenshots to create a listing for this customer.
Read customer-brief.md and the supplied app captures first.
Use the customer's approved brand and verified features.
Start with one complete slide, then extend the same design to the set.
Keep the actual app content readable. Do not invent claims or add
decorative effects without a reason from the customer material.
Run the local editor, check the exported PNGs, and list missing input.
```

Use [customer-brief.example.md](customer-brief.example.md) for the brief. A brand guide or current website helps the agent choose colors and type. App captures show which features can be claimed. The app icon is needed for the Play Store feature graphic.

## Editor workflow

For Apple decks, follow [Apple frame setup](references/apple-frames.md) once per computer. Obtain your own originals from Apple and run `npm run frames:import -- "/path/to/Apple Device Frames"` in the editor project or the installed skill's `template/` folder. This includes the unchanged files locally and saves a local cache. Later projects get the frames automatically on startup and use them by default. Keep the source files local; do not add them to a shared source archive.

1. Start the project with `npm ci`, then `npm run dev`.
2. Open the private link from the terminal.
3. Set the app name. Use **Brand** to set colors, type, alignment, and the app icon. New projects use large, centered headlines.
4. Choose **App screen**, **Creator with app**, or **Content library**. Add a real app screenshot and one clear headline. Add an approved creator photo or two to four catalog images when the template needs them. Use crop controls to keep faces and titles clear.
5. Add more screens and the required translations.
6. Select **Export bundle**. Resolve any missing content shown in the review dialog.
7. Open the review sheet in `review/<locale>.png` to check image order. Inspect each separate store PNG at full size and as a thumbnail. Ask the assigned customer reviewer to check the result.

Use a matching iPhone or iPad capture. The automatic checks cover completeness, Apple capture proportions, headline contrast, and measured text overflow. They do not verify product claims, translation quality, element overlap, image crops, or current store rules. Keep those checks in the delivery review.

## Using a chat interface

The repository is a local Node.js editor plus an agent skill. It is not a built-in ChatGPT or Claude chat plugin. A chat session needs a local execution tool to launch this editor on your computer. Otherwise, use the chat for the brief, copy, and visual review, then use the local editor or a coding agent for rendering and export. Do not assume that attaching SKILL.md starts a local server.

## Customer files and team handoff

Keep the brief, JSON project, approved images, fonts, and output PNGs in the customer's approved storage. Share that project with the next teammate through your normal private process. Keep the public tool fork free of customer images and data.

The editor runs on one computer. Each teammate starts a separate local copy; the private start link is not a team collaboration link. Installing a newer skill does not update old customer projects. Ask the agent to migrate the project with a backup.

## Before a wider team rollout

Run a pilot with two different customer brands. Use actual assets and at least one non-English language. Measure setup time, manual layout changes, export failures, and reviewer corrections. Use those results to choose the next changes.
