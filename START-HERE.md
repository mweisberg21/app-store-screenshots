# Make your first App Store screenshots

This tool helps you make listing images from your customer's app screens. Your assistant handles setup. You choose the content, supply the brand files, and review the images in your browser.

You do not need to write code or learn commands.

## 1. Give this request to your assistant

Copy this message into Claude or another assistant that can work on your computer:

```text
Please set up this App Store screenshot tool on my computer:
https://github.com/mweisberg21/app-store-screenshots/tree/improve-brand-defaults

Read START-HERE.md and follow the first-run guide linked from it.
I am not technical. Check whether you can work on my computer.
If I need another app or setting, help me with one step at a time.
Do the setup for me, open the editor, and show me how to make my
first screenshot. Ask for my app screenshots, logo, colors, and
other assets as we go. Show me how to return to the tool later.
```

This link selects the current team draft. It works for setup on Mac and Windows. The main repository still contains the older version until the draft is merged.

## 2. Let the assistant check your setup

The assistant needs to read and save files and run the editor on **your computer**. Access to a GitHub link alone is not enough. It should tell you what it can do before it starts.

If your current chat cannot do this, use Claude's desktop app. Open **Code**, choose **Local**, and select a folder for your screenshot work. Despite the name, you can use normal requests; you do not need to write code. The assistant will explain each step. Access depends on your Claude plan and your company's settings. See [Claude's desktop setup guide](https://code.claude.com/docs/en/desktop-quickstart).

If you already use another assistant with local file and command access, keep using it. A remote chat or cloud workspace must not claim it has installed the tool on your computer.

## 3. Supply what you have

Start with your customer name and any of these files:

- Real screenshots from the customer's mobile app.
- The logo, brand colors, fonts, or brand guide.
- Approved teacher photos, video covers, or other content images.
- The app areas you want to show, plus the devices and languages you need.

You do not need all the files at once. The assistant will list what is missing and help you capture the right app screens. It will ask for assets as you work, without asking for the same file again.

The original iPhone and iPad frames are included. They work by default on Mac and Windows, with no separate Apple download. The assistant checks that they load. If an installation is incomplete, it repairs the included files. The editor has a Credits button for the source and license notices.

## 4. Make one image together

The assistant will open the editor and show you how to:

1. Choose a customer project and a device.
2. Add a real app screenshot.
3. Set the customer colors and a short headline.
4. Choose a solid, gradient, or image background.
5. Review the first image before adding more.
6. Export the image files for review.

You can ask for changes in normal language. The assistant can make them, or show you the controls. For example: "Make the title larger," "Use this photo as the background," or "Show the program page next."

Your project saves on your computer. The assistant will check that saving works and tell you where the files are. Export creates a ZIP file with the finished images. Export does not publish anything to an app store.

## 5. Come back at any time

Return to the same assistant and project folder. You can say:

- "Run the App Store screenshots skill and open my customer project."
- "Start a new screenshot project for [customer name]."
- "Continue the screenshots for [customer name]."
- "Help me capture the app screens we still need."
- "Add an iPad version of these screenshots."
- "Check these images and export them for review."

The assistant will give you a short **How to open your editor** note with your actual folder path. Keep that note. A new chat may not know your previous project. Give it the note or open the same folder.

The editor's private browser link changes when it restarts. If an old tab does not open, ask: "Open my screenshot editor again." If saving fails, ask the assistant for help before you close or refresh the page.

## Instructions for the assistant

When the user asks you to set up or use this tool, read [the skill](skills/app-store-screenshots/SKILL.md), then follow [the first-run guide](skills/app-store-screenshots/references/first-run.md). Complete the local checks and the guided first use. Do not stop after downloading files or showing install commands.
