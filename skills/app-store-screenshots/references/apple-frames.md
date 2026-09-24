# Included Apple frames

The package contains three original Apple PNG bezels in `template/public/device-frames/`. Every iPhone and iPad device layout uses the matching bezel by default. A new installation works without a separate Apple download, import, or local frame cache.

| File | Device |
| --- | --- |
| `iphone-17-pro-max.png` | iPhone 17 Pro Max, Silver, portrait |
| `ipad-pro-13-portrait.png` | iPad Pro 13-inch (M5), Space Black, portrait |
| `ipad-pro-13-landscape.png` | iPad Pro 13-inch (M5), Space Black, landscape |

These portable filenames work on Mac and Windows. The image bytes, alpha channels, and dimensions are unchanged from the supplied originals.

## Setup and recovery

Copy the full template into each customer project, including `public/device-frames/` and `public/licenses/`. Start the editor normally. No frame setup command is needed. Both the launcher and the protected frame route verify SHA-256 hashes against `src/lib/apple-frames.json`.

If a file is missing or changed, restore only the affected package files from the same repository version or an intact installed template. Preserve the customer's project and captures. Reload an open editor after repair. Do not ask a first-time user to download Apple's resource archives.

The launcher can also restore the exact files from a pre-existing local cache. macOS uses `~/Library/Application Support/app-store-screenshots/device-frames/`; Windows uses local application data; Linux uses the XDG data folder. `SCREENSHOT_FRAME_CACHE_DIR` can select a different local cache. The cache is optional and is not needed for a complete package.

The optional maintenance command `npm run frames:import -- "<folder>"` accepts the three portable filenames above or the original paths recorded in the manifest. In Windows PowerShell, use `npm.cmd`. It checks all three files before copying them to the project and cache. Use it to repair an old project from an intact template's `public/device-frames/` folder, not as a first-run requirement. It never resizes or re-saves the images.

Export stops if a required frame cannot load. There is no substitute Apple frame. Deliberate text-only layouts and Play Store feature graphics still have no device. Android uses the existing generic frames.

## Credits and license notices

Device images: Apple Inc., from [Apple Design Resources](https://developer.apple.com/design/resources/). The [supplied Apple license](../template/public/licenses/apple-design-resources.txt) is included with the assets and stays separate from the code's MIT license. Attribution does not change the license terms or imply Apple endorsement. The editor's **Credits** button links to both license notices.

Follow [Apple's product image guidelines](https://developer.apple.com/app-store/marketing/guidelines/) when composing marketing images.

## Captures and measurements

Use a capture from the matching device. A smaller capture with the same proportions can fit, but its detail can be insufficient at export size. Export rejects captures with different proportions. A phone capture cannot serve as an iPad capture.

| Frame | Original PNG | Screen origin | Screen size |
| --- | --- | --- | --- |
| iPhone 17 Pro Max, Silver | 1470 × 3000 | 75, 66 | 1320 × 2868 |
| iPad Pro 13-inch (M5), Space Black, portrait | 2300 × 3000 | 118, 124 | 2064 × 2752 |
| iPad Pro 13-inch (M5), Space Black, landscape | 3000 × 2300 | 124, 118 | 2752 × 2064 |

These values describe the supplied originals. `template/src/lib/apple-frames.json` contains the source paths, hashes, dimensions, and screen masks. The masks follow the measured transparent aperture, including its curved corners. They clip only the inserted screenshot. One unchanged bezel sits above the screenshot; its camera and hardware details remain visible. No second bezel or CSS camera is added.

The renderer keeps the original frame proportions, including when an older project has a saved device box with different dimensions. iPad uses a separate original PNG for each orientation. Android still uses the existing generic frames.

## Check a new asset

Measure the original image and its alpha channel. Confirm the screen bounds, curved aperture, and camera position. Do not infer these values from another model. Update the source hash and metadata together. Inspect a full-resolution PNG with a contrasting app capture: check every edge, the corners, and the camera area. Keep the original frame unchanged.
