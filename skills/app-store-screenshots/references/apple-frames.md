# Apple frame setup

The editor uses original Apple PNG bezels for iPhone and iPad. Import your local copies before you export an Apple device deck. The source images are not included in this repository.

## Import

Get the matching product bezels from [Apple Design Resources](https://developer.apple.com/design/resources/). Read the license that comes with those files. Keep this folder structure in your local asset folder:

```text
Apple Device Frames/
  iPhone 17/iPhone 17 Pro Max/iPhone 17 Pro Max - Silver - Portrait.png
  iPad Pro M5/PNG/iPad Pro (M5) 13" - Space Black - Portrait.png
  iPad Pro M5/PNG/iPad Pro (M5) 13" - Space Black - Landscape.png
```

In the customer editor project, run:

```bash
npm run frames:import -- "/path/to/Apple Device Frames"
```

The command checks all three file hashes before it copies the files to `public/device-frames/`. It does not resize or modify them. If a hash differs, obtain the matching original or measure the new asset and update its metadata. Do not bypass the check with a resized image. Reload an open editor after import.

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
