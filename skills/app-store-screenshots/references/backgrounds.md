# Backgrounds

Open **Background** in the editor toolbar. The preview uses the actual screen, headline, and device frame. Changes stay in the picker until you select **Apply background**. Cancel discards them. The editor's undo and redo commands include applied background changes.

## Scope

- **Project default · all devices** sets the background for screens that have no override. This also applies to new screens.
- **This screen only** saves a separate background for the selected screen.
- **Replace screen overrides** removes all saved screen backgrounds when you apply a project default. Leave this unchecked to preserve them.
- **Use project background** removes the selected screen's override.
- **Use brand background** removes the custom project background and returns to the brand or legacy theme colors.

The neutral starter still uses a solid brand background. Selecting a background is an explicit design choice. Keep backgrounds consistent with the customer material.

## Solid

Use the native color picker, enter a six-digit hex color, or select a swatch. The swatches include the current brand colors.

## Gradient

Choose linear or radial. Linear gradients have an angle control. Radial gradients have horizontal and vertical center controls. Use two to five color stops. Each stop has a color and a position. Add, remove, or reverse the stops. Stops can share a position to make a hard edge.

The four optional presets are starting points. Adjust their colors to the customer's brand. They are not applied automatically.

## Image

Upload or drop a PNG or JPG up to 8 MB. The existing local upload service saves the file with the project.

- **Fill** covers the entire screen and crops the excess. Change horizontal position, vertical position, and zoom to choose the visible area.
- **Fit** shows the whole image without stretching it. Zoom is disabled. Position controls place it within the available space.
- **Image base color** fills space around a fitted image and behind transparent pixels.
- **Image tint** and **Tint strength** add a uniform color layer over the image. Use this to make the headline easier to read.
- **Reset image position** centers the image and returns zoom to 1×.

Switching background types inside the picker retains each draft until the picker closes. A background image is independent of app captures, creator photos, and catalog images. Each background fits one listing screen, including in Connected mode. It does not span the entire deck.

## Text and export

**Background text color** controls the headline and other default text on that background. Explicit colors on added text elements remain in effect. Custom backgrounds take priority over the older inverted-background setting.

Export checks the selected solid color and samples the entire gradient for headline contrast. Adjust the background or text until the sampled contrast is at least 4.5:1. Images require a visual contrast check; a base color cannot describe the picture behind a headline. Check image crops and text readability at full size and as thumbnails.

Export stops if a required background image is missing or cannot decode. Background paths can contain `{locale}`. Each requested language is checked. The same renderer handles preview, thumbnails, individual store PNGs, and review sheets.

## Project format

The optional `background` field can appear on the project or on a slide. A slide value takes priority. Omit it to inherit the project or brand background. Old project files keep their previous appearance.

```json
{
  "kind": "gradient",
  "style": "linear",
  "angle": 150,
  "center": { "x": 50, "y": 50 },
  "stops": [
    { "color": "#FAF6EF", "position": 0 },
    { "color": "#E2D4C2", "position": 100 }
  ],
  "textColor": "#302B25"
}
```

Solid fields are `kind`, `color`, and optional `textColor`. Image fields are `kind`, `image` (the existing source/crop format), `fit` (`cover` or `contain`), `color`, `tint` (`color` and percentage `opacity`), and optional `textColor`. Color values are six-digit hex codes. Angles range from 0 to 360; positions and tint strength range from 0 to 100; zoom ranges from 1 to 3. The schema rejects unsupported values, external image sources, and CSS in color fields.
