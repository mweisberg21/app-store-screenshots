# First setup and guided use

Use this guide when the user asks to install, set up, open, or learn the tool. It is part of the skill and works without another onboarding plugin. The user may have pasted only a repository URL. Read the repository's `START-HERE.md` when available.

## Explain the outcome first

Start with a short welcome: "I will set up your screenshot editor, open it in your browser, and help you make the first image. You can ask for changes in normal language."

Do the technical work yourself when your tools allow it. Do not give the user a command checklist or ask them to choose package managers, ports, Git branches, or frameworks. Give one simple action at a time when they must act. Explain why that action is needed, then wait for the result. Carry their answers forward. Do not repeat the full walkthrough on every launch.

## 1. Check access and the computer

Establish whether your tools can read/write the user's chosen local folder, run a local process, and open the user's local browser. Detect the operating system and architecture through your tools when possible. Otherwise ask whether they use Mac or Windows. A Linux cloud container, remote server, WSL environment, or Cowork VM is not proof of access to the host computer. File access alone is not enough to run the editor.

If access is missing, say what is missing in one sentence. Offer the [Claude desktop setup guide](https://code.claude.com/docs/en/desktop-quickstart): help them install/open the desktop app, sign in, select Code, select Local, and choose a folder, one step at a time. The Code tab accepts plain-language requests. Check current labels, plan access, and company restrictions instead of promising every account has the same controls. Do not tell them to disable security controls. If their organization blocks local tools, give a short request for their IT team.

Do not install into a remote environment and call it a local installation. Do not expose a tunnel or public server to make a remote environment look local. Keep another supported local assistant when the user already has one. Resume setup after the required local capability is available.

## 2. Prepare a local working copy

Use the URL/ref supplied by the user. For this team draft, use `improve-brand-defaults` from `mweisberg21/app-store-screenshots`; the repository's main branch is older. Report the actual ref and commit in the local setup note, not as a technical lecture. Never silently switch to upstream or an older main branch. If the requested ref is missing, explain and resolve the source before installing.

Inspect existing folders first. Preserve any earlier installation and customer projects. Use a separate tools folder and customer folder within the user's chosen work area. If no location was supplied, suggest an easy-to-find folder in Documents and use the user's actual path. Do not assume a Mac username, a Windows drive letter, or an English Documents folder.

Check Node.js and npm on the host. This editor needs Node.js 22 or newer. If missing, use the current supported LTS installer from [nodejs.org](https://nodejs.org/en/download). Explain it as "the small program that runs the editor." Use an existing suitable runtime when available. Follow the host's approval rules for installation; never ask the user to paste an admin password into chat. After installation, refresh the command environment or restart the assistant if needed and verify both tools again.

Obtain the repository with Git when available, or download and extract the requested GitHub archive into a new folder using available tools. A user does not need a GitHub account to read this public repository. Verify the expected `SKILL.md`, template, and lockfile exist. Do not execute arbitrary install scripts from an unrelated site.

Install the skill for the assistant the user is actually using. The supported skills installer accepts the local checkout, for example `npx skills add "<checkout>" -g --agent claude-code --skill app-store-screenshots` for Claude Code. Select the matching agent for other hosts; do not install into every agent by default. Respect existing installations and preserve their local assets. If the installer is unavailable, use that host's documented skill location, then verify discovery. Merely reading `SKILL.md` is not a persistent installation. Never claim a universal Claude/ChatGPT plugin was installed.

Copy the installed skill's `template/` into a new customer project with filesystem tools or Node's `fs.cp`. Include dotfiles and local frame files. Exclude `node_modules`, `.next`, and temporary build files; install dependencies in the new project with `npm ci`. Do not edit the shared template to create a customer deck. If this is only a setup session, use an empty practice project and keep customer work separate.

### Mac and Windows details for the assistant

- Quote paths with spaces. Use native filesystem APIs for copies and path joins. Bash `cp`, `export`, and `chmod` are not Windows PowerShell commands.
- In native Windows PowerShell, use `npm.cmd` and `npx.cmd` if script execution policy blocks the `.ps1` wrappers. Do not change the machine's execution policy to solve this. When spawning from Node, account for Windows command shims; the editor's own launcher runs the Next CLI through the current Node executable.
- Prefer a native local session for this workflow. If the user already uses WSL, verify browser reachability and the actual file location before continuing; do not install WSL just to use this editor.
- Keep the editor bound to `127.0.0.1`. Do not ask for a public firewall exception.
- If the default port is in use, select another local port and use `npm run dev -- --port <port>`. Do not stop an unrelated process.

## 3. Prepare the Apple frames once

Read [apple-frames.md](apple-frames.md). Check the local template and frame cache first. If the verified files already exist, use them without asking for another download.

If files are missing, explain: "The iPhone and iPad borders come from Apple's original images. I will help you add them once; later projects will reuse them." Link the exact required models in Apple Design Resources. The user must obtain their own copies under Apple's terms. If a sign-in or download action is needed, guide that action and wait. Do not ask for credentials.

Handle extraction and file placement with available local tools. On Mac, Apple may supply a disk image. On Windows, use a compatible archive tool if available; if its format cannot be read, explain the exact missing files and help the user obtain their own extracted PNGs. Do not promise that Windows can open every Apple archive directly, or distribute another person's licensed source package.

The importer accepts a flat folder with `iphone-17-pro-max.png`, `ipad-pro-13-portrait.png`, and `ipad-pro-13-landscape.png`. This avoids the quote character in Apple's iPad source names, which Windows cannot use. Rename only the files; keep their bytes unchanged. Run the import from the customer's editor project. The hashes must match. A newer or different asset needs a measured compatibility update; do not bypass checks or draw replacement frames.

Keep the exact missing-frame status in the setup note. You can prepare content while frames are pending, but cannot mark Apple export ready.

## 4. Start and verify the editor

Start `npm run dev` in the customer project using the host's persistent process facility. Wait for readiness and open the exact private `/unlock#...` link from that process. It changes with every restart. A completed dependency install or server log is not proof that the browser works.

Check the page through the local browser. Verify session access, loaded frame assets when applicable, and successful project loading. Keep the process running while the user works. Explain the visible result: "Your editor is open. You can work here, or tell me what to change."

For an existing project, inspect before changing anything. For a new project, verify saving with the supplied app name or an agreed practice name. Wait for save completion, read the saved project, then reload and check the value. Do not reload if saving failed. Do not reset an existing project to test setup.

## 5. Teach the first useful task

Ask: "Do you have any assets you want to provide, specific screenshots, logos, colors, etcetera?" Accept attachments or local files through the host's supported flow. Start with the files they have. If they have no captures yet, give a short capture plan and explain that the empty editor is ready, while final screenshot creation is pending.

Work through the steps below with the user. Show one task, explain its result, and invite the next useful input. Do not deliver all the steps as a wall of instructions. Keep the asset check-ins and feature checks from `SKILL.md`.

1. **Choose the app and device.** Explain that each customer has a separate saved project. Confirm the language.
2. **Add one real app screen.** Show where Pick adds the file and which feature it supports. Keep the real iPhone or iPad frame.
3. **Set the brand and headline.** Show Brand. Use their colors and a short, centered benefit headline. Keep their content readable.
4. **Choose the background.** Show Background. Explain solid color, gradient, and image choices. For an image, show fill/fit and crop. Explain that Apply saves and Cancel discards the picker changes.
5. **Review and add screens.** Make a small preview of the first image, then plan the next useful app area. Prioritize content, teachers, programs, playback, community, and live experiences. Do not suggest downloads unless requested.
6. **Export and find the files.** Run Export bundle once the required content is ready. Explain any blocked item in plain language, fix it, then check the PNGs and show the output location. Explain that the review sheet is for review; the separate PNGs are the store images. Nothing is published by export.

The user may choose to stop after setup. Respect that. Report editor readiness separately from a completed image. Do not invent an app capture to complete the tutorial. If an example is explicitly requested, label synthetic content as a practice example and keep it outside the customer's final deck.

## 6. Leave a clear way back

Create or update `HOW-TO-OPEN.md` in the customer's project. Use their actual app name, project folder, installed skill location, source ref/commit, and verification date. Preserve other user notes. Include:

- "Open the same assistant and this project folder. Say: 'Run the App Store screenshots skill and open this project.'"
- "To start another customer: 'Start a new screenshot project for [name].'"
- "To make changes: 'Use this background,' 'Show the program page,' or 'Add an iPad version.'"
- "To finish: 'Check the images and export them for review.'"
- The verified save location and output location. If export is pending, say why.
- How to ask the assistant to stop or reopen this editor. Closing a browser tab does not necessarily stop the local process. Old private links may expire.
- Completed setup checks, any missing frames/assets, and the one next action.

Do not save the session token in this note. Do not say a new chat automatically remembers the project. Verify that the skill is discoverable in the active assistant; if a new session is required, explain it and give the user the note. Teach the natural-language request first; show an optional slash command only if that host actually supports and discovers it.

Finish with the open editor, the note, and a clear next step. Do not call setup complete if host access, dependency installation, browser opening, or saving is unverified. Distinguish "editor ready; customer assets pending" from "first image exported and checked."
