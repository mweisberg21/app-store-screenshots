# Listing design research and proposed templates

Reviewed: 24 September 2026. Scope: the first four phone screenshots from six current US App Store web listings, plus Apple's current guidance. The observations below are design judgments. No conversion data was available for these screenshot sets.

## What the listings show

| Reference | Useful pattern | What to avoid copying |
| --- | --- | --- |
| [MasterClass](https://apps.apple.com/us/app/masterclass-online-classes/id1273867416) | Screens 2–4 repeat the headline area and large app view. The sequence explains the library, a lesson, and saved learning. | The cover collage is busy. Use multiple content images only when content variety is the message. |
| [Peloton](https://apps.apple.com/us/app/peloton-fitness-workouts/id792750948) | Real instructor photography introduces the service. Later slides use a stable device and headline position. | Do not copy the recognition badge or rating. Published artwork is not a substitute for current asset rules. |
| [The Sculpt Society](https://apps.apple.com/us/app/the-sculpt-society/id1481275761) | The creator, clothing color, and photography form a recognizable identity. Real catalog screens support it. | Small, thin copy loses clarity at thumbnail size. Split devices are unsuitable as an automatic default. |
| [MUBI](https://apps.apple.com/us/app/mubi-stream-great-cinema/id626148774) | Film artwork does most of the visual work. Later slides use a consistent light surface and left-aligned headline. | Award covers and small review text should not become a general template. |
| [Headspace](https://apps.apple.com/us/app/headspace-sleep-meditation/id493145008) | Product colors, illustrations, and short messages form a consistent system. The dark sleep screen has a content reason. | Its mascot and palette belong to its brand. They are not a recipe for another customer. |
| [Find What Feels Good Yoga](https://apps.apple.com/us/app/find-what-feels-good-yoga/id1050813703) | Actual catalog, detail, and playback screens explain the service. | A splash image spends the first slot without explaining much. Raw captures can need a short, useful headline. |

These apps were selected for relevant content, fitness, and learning patterns. This list does not claim that all six are uScreen customers. Use their composition as evidence; do not reuse their artwork.

## What should be standard

Standardize composition, asset roles, and quality checks. Let the customer's real content and brand supply the visual identity.

- Consistent safe margins, headline placement, type, and device treatment.
- One useful message supported by visible app content.
- A clear focal point and sufficient text contrast.
- Repeated layouts when the messages have similar needs.
- Real photography or content art when it helps explain the service.
- Full-size and thumbnail review of every export, including every language.

Clean design can be bright, dark, photographic, or plain. Removing all color would replace one arbitrary default with another. White backgrounds, repeated layouts, and upright devices are valid options, not universal requirements.

## Three proposed team templates

These are proposed starting points, not Apple-mandated layouts or statistically proven winners.

### 1. App screen

Default for most customer slides. Use a short headline above one large app capture on a solid brand surface. Show enough UI to prove the message. Keep the key content away from the device crop.

Examples: MasterClass 2–4, Peloton 3–4, MUBI 2 and 4. Suitable for browsing, playback, saved content, programs, or community when those features are verified.

For a 1320 × 2868 canvas, start with 6–8% side margins and roughly 22–28% of the height reserved for headline space. Adjust for actual text and image. These values are our layout proposal, not measured industry standards. Do not shrink type or stretch a capture to force a fit.

### 2. Creator plus app

Use when a teacher or creator is central to the service. Combine approved photography, a short message, and a readable app view. The image crop must protect the face. The app view must show the product experience.

Examples: The Sculpt Society 2–4 and Peloton's instructor photography. Requires separate photo and app-capture fields, crop controls, and text-safe regions. The draft editor now provides a Creator with app preset with a separate photo field and crop controls. Review faces where the phone overlaps the photo.

### 3. Content library

Use when variety or curation is the main benefit. Combine real catalog artwork or a catalog capture with a short category message and visible app context. Give content the space it needs. Do not fill an arbitrary grid with generic icons.

Examples: MUBI 3, MasterClass 1, Headspace 2. Requires an approved content-image list and explicit crop limits. The draft editor now provides a Content library preset with two to four artwork fields and crop controls.

## Suggested sequence

For a five-image starting set:

1. Primary benefit, supported by the strongest app screen.
2. Discover the content or program.
3. Watch, listen, or use the core feature.
4. The teacher, a distinctive program, or another verified content benefit.
5. Another strong verified benefit, such as community or a program structure.

Change the order to match the customer's strongest evidence. Use fewer images when there are fewer useful claims. There is no required feature wall, logo closer, dark slide, or connected composition. The team's current preference excludes download slides unless the user explicitly requests one. Use the [ASO playbook](aso-screenshot-playbook.md) to connect the sequence to the visitor's needs and feature evidence.

## Official format requirements are separate

Apple says screenshots should depict the app in use and put strong features first. A listing can include up to ten screenshots. See [product page guidance](https://developer.apple.com/app-store/product-page/) and [accurate metadata](https://developer.apple.com/app-store/review/guidelines/#accurate-metadata).

Current [screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications) accept 1320 × 2868 for 6.9-inch iPhone portrait assets and 2064 × 2752 for 13-inch iPad portrait assets. Other accepted sizes and fallback rules are listed there. The template's extra exports are presets, not a claim that every listed size is always required.

Apple also provides templates for product page headers and search creative assets. Those are separate formats from the screenshot gallery. Its current asset guidance advises against Apple-designated recognition marks in artwork, even though some reviewed listings include them. Check [asset best practices and templates](https://developer.apple.com/app-store/asset-best-practices/) before delivery.

## Next implementation work

The first draft removes forced decorative effects, adds saved brand controls, clears stale demo positions, and checks missing export content. It establishes a usable base. It also implements the creator and content-library templates above, with separate asset fields and saved crops.

Measured text-overflow checks and per-language contact sheets are now included. Test the three compositions with two real customer brands and at least one non-English language before wider rollout. Keep optional effects subordinate to those results.

Use [product page optimization](https://developer.apple.com/app-store/product-page-optimization/) to test a clear first-image or message change. Judge conversion with test results; visual preference alone cannot establish an increase.

## Research method

The visual review used the phone screenshot section in each current US web listing. The older iTunes lookup screenshot list can differ by device and can contain older assets, so it was not used for the final comparison. Storefronts and experiments can show different sets. Recheck the source pages when using this research later.
