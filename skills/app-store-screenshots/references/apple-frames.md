# Apple frame setup

The editor uses original Apple PNG bezels by default for all iPhone and iPad device layouts. Import your local copies once on each computer. Later projects get the files automatically when the editor starts. The source images are not included in the public repository.

## Import

Get the matching product bezels from [Apple Design Resources](https://developer.apple.com/design/resources/). Read the license that comes with those files. The assistant can help extract and place the images. Do not require a first-time user to arrange files manually.

On Mac, the original folder structure is supported:

```text
Apple Device Frames/
  iPhone 17/iPhone 17 Pro Max/iPhone 17 Pro Max - Silver - Portrait.png
  iPad Pro M5/PNG/iPad Pro (M5) 13" - Space Black - Portrait.png
  iPad Pro M5/PNG/iPad Pro (M5) 13" - Space Black - Landscape.png
```

On Mac or Windows, you can instead put the three originals in one folder with these simple names:

```text
Apple Device Frames/
  iphone-17-pro-max.png
  ipad-pro-13-portrait.png
  ipad-pro-13-landscape.png
```

Match each simple name to the corresponding model, color, and orientation above. Rename the file only; do not edit or re-save the image. This form avoids the quote character in Apple's iPad file names, which Windows cannot use. The importer checks the same hashes for both forms. A portable file takes priority when both forms exist; an invalid portable file fails verification.

Apple may supply a disk image or archive. Use local extraction tools that support its format. If Windows cannot extract that download, help the user obtain their own matching extracted PNGs. Do not assume every Apple archive opens on Windows or bypass the asset license.

In the customer editor project, run:

```bash
npm run frames:import -- "/path/to/Apple Device Frames"
```

In Windows PowerShell, the equivalent is `npm.cmd run frames:import -- "C:\path\to\Apple Device Frames"`. Use the user's actual folder path. No shell execution-policy change is needed.

The command checks all three file hashes before it copies the files to `public/device-frames/` and an operator-local cache. It does not resize or modify them. If a hash differs, obtain the matching original or measure the new asset and update its metadata. Do not bypass the check with a resized image. Reload an open editor after import.

On macOS, the cache is `~/Library/Application Support/app-store-screenshots/device-frames/`. Windows uses the local application data folder; Linux uses the XDG data folder. `SCREENSHOT_FRAME_CACHE_DIR` can select a different local cache. Do not point it at shared network storage.

Each start checks the project copies. If they are missing or changed, the launcher restores the exact originals from the local cache. A complete project works without that cache or the original download folder. The server also checks frame hashes before it serves them. Export stops if a required frame cannot load. There is no substitute Apple frame. Deliberate text-only layouts and Play Store feature graphics still have no device.

For a local skill installation, import into its `template/` folder once. New projects copied from that local template then include the files immediately. A skill update can replace that folder; the separate local cache lets new projects restore the files on startup.

Apple's source assets have a separate license. They are not covered by this repository's MIT license. Keep them local and out of commits, public packages, and shared source archives. Each teammate must obtain and import their own copies under Apple's terms. Follow [Apple's product image guidelines](https://developer.apple.com/app-store/marketing/guidelines/) for the finished composition.

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
