# Included device frames

The package contains three original Apple PNG bezels and one supplied Samsung Galaxy S22 PNG in `template/public/device-frames/`. Every iPhone, iPad, and Android phone device layout uses the matching bezel by default. A new installation works without a separate Apple download, import, or local frame cache.

| File | Device |
| --- | --- |
| `samsung-galaxy-s22.png` | Samsung Galaxy S22, portrait |
| `iphone-17-pro-max.png` | iPhone 17 Pro Max, Silver, portrait |
| `ipad-pro-13-portrait.png` | iPad Pro 13-inch (M5), Space Black, portrait |
| `ipad-pro-13-landscape.png` | iPad Pro 13-inch (M5), Space Black, landscape |

These portable filenames work on Mac and Windows. The image bytes, alpha channels, and dimensions are unchanged from the supplied originals.

## Setup and recovery

Copy the full template into each customer project, including `public/device-frames/` and `public/licenses/`. Start the editor normally. No frame setup command is needed. Both the launcher and the protected frame route verify SHA-256 hashes against `src/lib/apple-frames.json` and `src/lib/android-frames.json`.

If a file is missing or changed, restore only the affected package files from the same repository version or an intact installed template. Preserve the customer's project and captures. Reload an open editor after repair. Do not ask a first-time user to download Apple's resource archives.

For Apple frames, the launcher can also restore the exact files from a pre-existing local cache. macOS uses `~/Library/Application Support/app-store-screenshots/device-frames/`; Windows uses local application data; Linux uses the XDG data folder. `SCREENSHOT_FRAME_CACHE_DIR` can select a different local cache. The cache is optional and is not needed for a complete package.

The optional maintenance command `npm run frames:import -- "<folder>"` accepts the three Apple filenames above or the original paths recorded in the manifest. In Windows PowerShell, use `npm.cmd`. It checks all three files before copying them to the project and cache. Use it to repair an old project from an intact template's `public/device-frames/` folder, not as a first-run requirement. It never resizes or re-saves the images.

Export stops if a required frame cannot load. There is no substitute for a missing packaged frame. Deliberate text-only layouts and Play Store feature graphics still have no device. Android tablets use the existing generic frames.

The Samsung frame is self-contained and does not use the Apple import or cache. Restore a missing Samsung file from the same package version.

## Credits and license notices

Device images: Apple Inc., from [Apple Design Resources](https://developer.apple.com/design/resources/). The [supplied Apple license](../template/public/licenses/apple-design-resources.txt) is included with the assets and stays separate from the code's MIT license. Attribution does not change the license terms or imply Apple endorsement. The editor's **Credits** button links to both license notices.

The Samsung frame was supplied by Mark Weisberg as `mockup-samsung-galaxy-s22-2022-transparent.png`. The original file is preserved. No creator or asset license was supplied with it; do not label it as Apple artwork or assume that the code's MIT license applies to it. The Credits panel identifies the supplied source.

Follow [Apple's product image guidelines](https://developer.apple.com/app-store/marketing/guidelines/) when composing marketing images.

## Captures and measurements

Use a capture from the matching device. A smaller capture with the same proportions can fit, but its detail can be insufficient at export size. Export rejects captures with different proportions. A phone capture cannot serve as an iPad capture.

| Frame | Original PNG | Screen origin | Screen size |
| --- | --- | --- | --- |
| Samsung Galaxy S22 | 388 × 800 | 15, 15 | 355 × 769 |
| iPhone 17 Pro Max, Silver | 1470 × 3000 | 75, 66 | 1320 × 2868 |
| iPad Pro 13-inch (M5), Space Black, portrait | 2300 × 3000 | 118, 124 | 2064 × 2752 |
| iPad Pro 13-inch (M5), Space Black, landscape | 3000 × 2300 | 124, 118 | 2752 × 2064 |

These values describe the supplied originals. `template/src/lib/apple-frames.json` and `template/src/lib/android-frames.json` contain the source paths, hashes, dimensions, and screen masks. The masks follow the measured transparent aperture, including its curved corners. They clip only the inserted screenshot. One unchanged bezel sits above the screenshot; its camera and hardware details remain visible. No second bezel or CSS camera is added.

The renderer keeps the original frame proportions, including when an older project has a saved device box with different dimensions. iPad uses a separate original PNG for each orientation. Android phones use the supplied Galaxy S22 image. Android tablets still use generic frames.

The Samsung PNG has real transparency outside the body and inside the screen. Its camera is already part of the image. A 1080 × 2340 Android capture matches the measured screen proportions within the export tolerance. The listing canvas remains 1080 × 1920; it contains the headline and the complete framed capture. Do not crop the app to the listing canvas shape.

The source frame is only 388 × 800 pixels. The editor preserves those bytes; it does not add detail by enlarging the frame. Inspect the edges in each store-size export. Ask for a larger original if the customer needs sharper device edges. Do not substitute an iPhone screenshot for an Android capture.

## Check a new asset

Measure the original image and its alpha channel. Confirm the screen bounds, curved aperture, and camera position. Do not infer these values from another model. Update the source hash and metadata together. Inspect a full-resolution PNG with a contrasting app capture: check every edge, the corners, and the camera area. Keep the original frame unchanged.
