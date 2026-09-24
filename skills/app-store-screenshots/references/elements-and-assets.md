# Elements and customer assets

Use added elements only when they help explain a real member benefit. The starter stays empty. There is no required badge, icon, arrow, or decorative shape.

## Guide the user

Open **Add element** in the top bar. The right panel has three sections:

- **Screen**: the template, headline, and main app capture.
- **Elements**: added images, text, device captures, and their positions.
- **Assets**: reusable customer images and saved groups.

In a narrow window, use the active screen list to change screens. Choose **Screens** to open the full screen controls. Scroll down to the editing panel; the canvas keeps enough height to show the full image.

Start with one useful addition. Explain its purpose, show the result, and keep the existing asset check-ins. Do not ask the user to choose technical coordinates before showing a layout.

| Element | Use | Source required |
| --- | --- | --- |
| Image | Creator photo or approved artwork | Customer photo or artwork |
| Logo | Customer identity with original proportions | Approved PNG, ideally with a transparent background |
| Device | Another app capture in a device frame | Matching capture; Apple frames are included |
| Screenshot detail | A larger view of a useful part of the app | Real app capture; use Crop and zoom |
| Content cards | Two to six covers in a row, column, or grid | Approved content covers; titles are optional |
| Shape | A color panel, border, or circle | Customer palette and a clear layout purpose |
| Line or arrow | Connect a short explanation to a visible feature | Actual feature in the capture |
| Icon | A simple supporting symbol | Verified meaning; no unsupported claim |
| Text | A short label or caption | Approved copy in each export language |

Keep the main app capture and headline dominant. Preserve the real UI. Do not invent controls, metrics, awards, ratings, or member counts. A screenshot detail is a crop of supplied UI; it is not a generated replacement. Keep its context clear. Do not place arrows, cards, or labels over important controls or faces. Downloads remain excluded from suggested topics unless the user asks.

New text is centered. Use the customer's type and colors. Shorten copy instead of making it too small. Check readability at full size and at a small listing thumbnail size.

## Use images

Upload PNG or JPEG files in **Assets**. Multiple files and drag-and-drop are supported. Search by name, rename an asset, and assign Logo, Photo, Screenshot, or Cover. Existing project images also appear here. The same file can be used on more than one screen without another upload.

**Use** adds an image to the active screen. For an existing image or device element, use **Choose from assets** in its settings. Logos start with Fit so their edges remain visible. Other images start with Fill. Crop and zoom set the visible area without changing the original file. Screenshot details support up to 8× zoom; inspect source quality before using a large crop.

A device element uses the included real iPhone or iPad frame by default. Select the matching device and orientation. Use a real tablet capture for a tablet. Keep the frame's proportions. Android devices use generic frames. Do not ask users to download Apple frames.

The library is local to this customer project. Removing an unused library entry does not delete the file from disk. Images used by a screen or saved group cannot be removed from the library until those references are removed. Undo can restore the entry.

## Arrange elements

Select an element on the canvas or in the layer list. Drag it to move it. Drag an edge or corner to resize it. Use the rotation control for a deliberate angle. Alignment guides appear near screen edges, centers, and other added elements.

The panel provides size, position, rotation, opacity, and layer order. Use **Move forward** and **Move backward** for stacking. Lock an element to prevent edits. Hide it to exclude it from preview and export. Both controls remain available in the layer list.

Use the layer checkboxes to select multiple elements. Alignment works within the selection, or against the screen for one element or group. Equal spacing needs three separate elements or groups. **Group** makes the selected elements move together. Select one layer to edit its image, text, or size. **Ungroup** restores separate movement.

**Duplicate** makes an independent copy. **Copy to screens** preserves placement on selected screens in the current device deck. Check the copied layout on each screen. Use **Undo** or **Redo** in the top bar to reverse or restore edits.

When focus is on the canvas: arrow keys move a selected element by one pixel; Shift plus an arrow moves it by ten. Cmd/Ctrl+D duplicates it. Delete removes it. Locked groups stay unchanged. Text fields keep their usual typing and editing controls.

## Reuse a group

Select useful elements and choose **Save group**. Give the group a clear name, such as “Teacher introduction.” It appears in **Assets** with a preview. **Use group** adds an independent copy to the current screen and fits large groups to that canvas. Edit the new copy with the next approved content. The saved source remains unchanged.

Keep saved groups within the same customer's project. Do not transfer customer photos or logos into another customer's deck. A project supports 50 added elements per screen, 200 library entries, and 30 saved groups. Upload and project size limits still apply.

## Save and export

New fields are optional in schema version 2. Old projects keep their existing appearance and legacy text controls. Do not replace old text or transforms without reviewing the result.

The project stores added elements in each slide's `elements` array. It stores library metadata in `assets` and reusable layouts in `savedGroups`. Use `src/lib/types.ts` and `src/lib/project-schema.ts` for structured edits. Use the editor controls when possible. Keep image files with the saved project.

Export includes visible elements. It checks their required images, Apple capture proportions, translated text and card titles, and text overflow. It does not prove that a crop, overlap, icon meaning, small text, or composition is useful. Review each exported PNG and the contact sheet. A hidden element does not require assets or translations for export.

Useful requests:

- “Add this logo above the headline and keep it centered.”
- “Use these three covers to show the beginner program.”
- “Enlarge this part of the real app capture.”
- “Keep the teacher photo and name together. Save them as a group.”
- “Copy this group to the next two screens.”
- “Check that all text is readable and export the images.”
