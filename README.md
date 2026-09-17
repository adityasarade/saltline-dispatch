# Saltline Dispatch: the 2:13 AM edition

> Every night leaves a mark. Make it printable.

It is 2:13 AM in Cala Verda and you are the only reporter still awake. Five calls come in. Every field plate you get back can prove two different things, and both of them are true.

You pick which truth the city wakes up believing. Lock an editorial angle, work the plate in React Image Editor until that lead is visible, and hit Save. Whatever you saved is what goes to print - and the shape you cut it to decides how the front page runs it.

Built for Unlayer's Build With React Image Editor Challenge.

[Live preview](https://saltline-dispatch.vercel.app) · [Public source](https://github.com/adityasarade/saltline-dispatch)

> The competition build is publicly deployed on Vercel. The repository is public.

![Saltline Dispatch journey](public/saltline-dispatch.gif)

## For judges: the 60-second route

1. Select **Start tonight's run** and open any of the five field calls.
2. At **Angle Lock**, choose which of two defensible truths the field plate should prove.
3. Mark the subject your angle named — draw on it, caption it, crop to it — then use the editor's own **Save (✓)** control. An untouched Save is refused.
4. Read the **lead call** and the **press call** in the reveal. The desk has measured whether your marks landed on the thing you locked, and what shape you cut the plate to. Both readings are shown with the numbers they came from.
5. Download the front page. Its layout is chosen by your crop: a wide cut runs as a banner, a tight cut as a tall column. Then continue through the closing frame and open the issue wall.

**If you only have thirty seconds:** lock an angle, scribble once directly on the subject it names, and Save. Then do the same case again and scribble on the sky instead. Same case, same angle, two different printed verdicts — from your pixels, not from a menu.

The key judging moment is Angle Lock → editor → printed reveal. The editor is the story mechanic and the saved export is the artifact, not a utility bolted to the side of one.

## The 3 to 5 minute loop

1. **Landing desk:** Select **Start tonight's run** to reach all five field calls immediately. The three-step rule card on the landing page carries the orientation without an extra modal.
2. **Field calls:** Choose exactly one of five original calls: Wake Tax, Room 08, After the Rain, Undertow, or Off the Meter. The desk phone answers as the case opens.
3. **Angle Lock and editor:** Every call offers two editorial leads. No angle is silently selected. Lock one, then use its custom three-tool route to work the original 1536 × 1024 same-origin field plate with crop, filters, draw, text, shapes, or frames. General-purpose stickers are deliberately disabled.
4. **Publish:** Select the editor's own **Save (✓)** control. Its returned `dataUrl` is the only publish path. The night press run covers the real measurement work, then hands back a press read: your crop and brightness decide whether the page runs your plate as a banner, a lead, or a column.
5. **Reveal, closing frame, and archive:** The exact flattened `dataUrl` appears in the publish reveal, the downloadable 1600 × 2000 front page, the angle-specific closing-frame overlay, and the session archive. Saltline's paper, stamp, and caption sit outside the exported pixels. The raw-plate download uses that same export and its returned image format.

The five screens are landing desk, field calls, editor, publish, and archive. The closing frame is an overlay inside that flow. Removing React Image Editor removes the visitor-authored dispatch and breaks the central loop.

## Original coastal-crime direction

Cala Verda is a boomtown of marina money, roadside motels, carnival glare, ferry lanes, and disposable alibis. Saltline borrows only the challenge's broad tension between coastal spectacle and after-hours consequence. Its cases, places, copy, interface, and visual system are original. It does not recreate franchise scenes or use franchise characters, logos, maps, screenshots, trailers, leaked material, audio, or copied interface styling.

## Why React Image Editor is core

Saltline uses [`@unlayer/react-image-editor`](https://github.com/unlayer/react-image-editor) 1.0.2 as the in-world publishing desk. Every assignment begins with a same-origin original field plate. The visitor can crop, filter, draw, add text, place shapes, and frame the image. Angle Lock gives that freeform editing a story purpose: each of ten possible leads changes the brief, suggested tools, outcome, stamp, and final closing line.

The editor's `onSave` result is the source of truth. An untouched Save is rejected through the editor instance's `hasChanges()` state, so the visitor must make an editor-detected move. The interface asks for that move to be clearly visible. The returned `dataUrl` is stored directly in local React state and rendered as the reveal, closing frame, archive item, raw download, and front-page artifact. There is no alternate upload, mock artifact, or publish bypass. Saved-image pixels are shown with `object-fit: contain` and without CSS filters, grain overlays, captions, or stamps on top of them.

The same Save callback also uses Unlayer's returned `blob` to report honest export dimensions, MIME type, and encoded size. A short SHA-256-derived plate code, with a deterministic local fallback where Web Crypto is unavailable, makes the artifact's identity legible across reveal, closing frame, and archive without changing its pixels. Starting a new draft clears the active published artifact, and replaying the archive uses a dedicated path, so a previous dispatch can never masquerade as the new one.

The feature configuration stays stable because changing editor features remounts the editor and discards work. The AI Assistant is not used, so the experience needs no API key, account, backend, or paid service.

### The lead proof: did your marks land on what you claimed?

Locking an angle is a claim about **one subject in the photograph** — the pleasure launch, the witness on the balcony, the silver mask, the driver against the ferry lights. On Save, the desk checks whether your marks actually landed on it.

Each of the ten leads has a hand-authored region, read off the artwork and stored in [`lib/lead-regions.ts`](lib/lead-regions.ts). The saved export is compared against the untouched plate on a 256px grid, and two numbers come back: the share of pixels that moved **inside** that region, and the share that moved **everywhere else**.

| Result | What it means |
| --- | --- |
| **ON THE LEAD** | More than 1.5% of the region moved, and it moved more than the rest of the frame by a clear margin. The desk runs it as proof. |
| **WORKED WIDE** | The region moved, but so did everything else about equally — a global filter, say. The desk runs it, with a note. |
| **LEAD UNTOUCHED** | You edited the plate, but not the thing you locked. It still prints; the desk just says so. |
| **PLATE RECROPPED** | You recut the frame. A crop moves every pixel, so the comparison saturates and the desk refuses to report a number — it reads the cut instead. See the press read above. |

Both percentages appear in the export ledger next to the printed plate. Two visitors who lock the *same* angle on the *same* case get different verdicts if one marks the subject and the other marks the sky.

**The thresholds are measured, not guessed.** React Image Editor returns a re-encoded JPEG even when nothing was drawn, so a naive diff would report change everywhere. Re-encoding the five plates at quality 0.80–0.92 moves the 99.5th-percentile pixel by 9–22, which is why a pixel must move by more than 24 to count; that leaves the re-encode floor at 0.33% of pixels against a 1.5% decision line. A thin 8px stroke laid across the smallest region moves 3.0% of it. An earlier 4% threshold rejected exactly that stroke, which is how the number ended up where it is.

**What this deliberately does not do:** it does not understand your edit. It cannot tell a caption from a crop mark, it has no opinion about whether your mark is any good, and it knows nothing about the subject beyond a rectangle. It compares pixels in a box against pixels in the same box, reports both percentages, and says which way it read them. The logic is pure and covered by 16 tests in [`tests/lead-proof.test.mjs`](tests/lead-proof.test.mjs).

### The press read: your crop changes the page

Locking an angle decides what the story says. The edit itself decides how the story runs.

On Save, Saltline measures two things about your actual export and prints what they imply, the way a real night desk would:

| Measurement | What the desk does with it |
| --- | --- |
| **Aspect ratio** of the saved export | A wide cut (≥ 1.70:1, which includes a 16:9 crop) is promoted to a **banner** across the top of the page, headline underneath. A tight cut (≤ 1.20:1) is run as a tall **column** with the deck set alongside it. Anything between — including the untouched 1.50:1 plate — runs as the **night lead**. |
| **Exposure** against the plate you started from | The export's mean luminance divided by that plate's own measured baseline. Below 0.82× is filed as **PRESSED DARK**, above 1.22× as **PUSHED FOR DETAIL**, otherwise **STRAIGHT PRESS**. |

Exposure is deliberately *relative*. Every Cala Verda plate is a night scene with a baseline luminance between 0.11 and 0.37, so an absolute brightness threshold would only ever restate that the artwork is dark. Measuring against the plate you were handed means the press note reports what **you** did to it.

All three numbers — ratio, luminance, and exposure — are shown to you in the export ledger beside the printed plate, and the press call is stamped on the downloadable front page. Two visitors who lock the same angle on the same case get genuinely different pages if they cut or grade the plate differently, and the reason is disclosed rather than implied.

Saltline deliberately does **not** claim to understand your edit. It does not read your subject, your intent, or the quality of your work. It measures geometry and exposure, says so, and lays out the page accordingly. The logic is a set of pure functions in [`lib/press-read.ts`](lib/press-read.ts), covered by 13 tests in [`tests/press-read.test.mjs`](tests/press-read.test.mjs).

### Desk sound

The night desk has three short noises and no soundtrack: a call landing when you open a case, the press feeding a sheet when you Save, and a stamp coming down when the dispatch is filed. They are synthesized with WebAudio in [`lib/desk-sound.ts`](lib/desk-sound.ts), so the project ships no audio files and needs no audio licence. Sound is off until you turn it on from the topbar.

## Performance and image delivery

Each original 1536 × 1024 PNG stays as the untouched same-origin source handed to React Image Editor, so editable quality is never reduced. Every display-only surface - the landing hero and the five call previews - uses a measured WebP derivative instead, which takes the landing from 3.4 MB of PNG to about 0.8 MB total transfer.

Per-asset encodings, sizes, and encoder settings are in [asset provenance](docs/asset-provenance.md).

## Screenshots

![Saltline landing desk at 1280 by 720](docs/screenshots/landing-1280x720.webp)

| Five field calls | Explicit Angle Lock |
| --- | --- |
| ![Five Saltline field calls at 1280 by 720](docs/screenshots/field-calls-1280x720.webp) | ![Saltline Angle Lock gate at 1280 by 720](docs/screenshots/angle-lock-1280x720.webp) |

| React Image Editor, mid-edit | The night press run |
| --- | --- |
| ![The Saltline evidence editor with a coral draw stroke traced across the wake, at 1280 by 720](docs/screenshots/editor-1280x720.webp) | ![The Saltline night press run covering the export measurement, at 1280 by 720](docs/screenshots/press-run-1280x720.webp) |

| Exact saved reveal and press read | Session archive |
| --- | --- |
| ![The published Saltline dispatch showing the exact saved export, the press read, and the export ledger, at 1280 by 720](docs/screenshots/publish-1280x720.webp) | ![Saltline session archive at 390 by 844](docs/screenshots/archive-390x844.webp) |

The closing frame at phone width:

![Saltline closing frame at 390 by 844](docs/screenshots/closing-390x844.webp)

## Run locally

Requires Node.js 22.13.0 or newer.

```bash
npm ci
npm run dev
```

Open the local URL printed by the development server. React Image Editor loads its runtime from Unlayer's CDN, so the editing step requires network access.

## Verify locally

```bash
npm run lint
npm run test
npm run check:content
npm run build
npm run build:vercel
```

`npm run test` runs 45 unit tests with Node's built-in runner and needs Node 22.18+ for TypeScript import stripping. They cover the press-read play and tone classifiers, the lead-proof verdicts and their measured thresholds, the in-world clock including its wrap past midnight, and the export-metadata helpers — boundaries, determinism and the disclosed ledger lines included.

`npm run check:content` walks the authored content and fails the build if any case is incomplete: a missing plate or preview, an angle without a three-move route, a route naming a tool that is not enabled, a lead without an authored region, or a display derivative that has leaked into the editor path. A broken image in front of a judge is the one failure no unit test catches.

Everything else was **verified by hand** in a real browser, not automated: cold loads at 390 × 844 and 1280 × 720, horizontal overflow, direct landing-to-calls navigation, explicit Angle Lock, untouched-Save rejection, real edits through all six enabled tools, editor loading and recovery states, exact reveal-to-front-page-to-closing-to-archive identity, stale-artifact prevention, and archive replay.

## Vercel deployment

The public competition build runs at [saltline-dispatch.vercel.app](https://saltline-dispatch.vercel.app). `vercel.json` selects the native Next.js production build through `npm run build:vercel`. The existing Vinext build remains available for local and private fallback compatibility.

## Stack

- React 19, TypeScript, and Next.js 16 on Vercel
- Vinext and OpenAI Sites compatibility retained for local and private fallback builds
- Unlayer React Image Editor 1.0.2
- Barlow Condensed (SIL OFL 1.1) self-hosted through `next/font/google` for the uppercase desk furniture, with Georgia for the display serif
- Local React state for the current session archive
- Same-origin 1536 × 1024 PNG editor sources
- Responsive WebP derivatives for display-only surfaces

## Originality and assets

Saltline is an unofficial, independent contest entry. It is not affiliated with or endorsed by any game publisher. It uses no franchise characters, logos, screenshots, trailers, leaked material, anime characters, real-brand marks, or unlicensed assets.

All assignment artwork and interface marks were created for this project. See [asset provenance](docs/asset-provenance.md).

## Repository notes

- The complete source needed to run the project is public.
- The React Image Editor implementation is visible in [components/saltline/editor-stage.tsx](components/saltline/editor-stage.tsx): the code-split module load, the enabled tool dock, the error boundary, the Angle Lock gate, the loading plate, and the `<ImageEditor>` mount with every callback it uses.
- The five cases, their ten angles and all narrative copy are data in [lib/assignments.ts](lib/assignments.ts), so the story can be read without reading the app.
- What the desk can say about a saved export — the plate code, the extension, the size, and the in-world filing time — is a set of pure functions in [lib/export-meta.ts](lib/export-meta.ts), covered by [tests/export-meta.test.mjs](tests/export-meta.test.mjs).
- [app/page.tsx](app/page.tsx) is the screen flow and state machine only.
- [app/globals.css](app/globals.css) is grouped in the order a visitor meets it, one declaration per line, with one block per breakpoint.
- Canonical field plates remain in `public/images` for same-origin canvas compatibility.
- Display derivatives live in `public/images/display` and are never passed to the editor.
- The project deliberately keeps five assignments and five screens. The closing frame is an overlay inside that flow.
- There is no account system, backend, analytics, external API, or generated-story dependency.
- The evidence-based requirement matrix and final entrant actions are in [the competition audit](docs/competition-audit.md).

## Challenge links

- [Unlayer React Image Editor](https://github.com/unlayer/react-image-editor)
- [React Image Editor docs](https://docs.unlayer.com/builder/latest/images/image-editor)
- [Build With React Image Editor Challenge FAQ](https://unlayer.notion.site/Build-With-Image-Editor-Challenge-FAQ-3cf0ceb4c8e180309d91cd730811ebd1?pvs=73)
- [Official challenge submission form](https://docs.google.com/forms/d/e/1FAIpQLScfzk0EYvIZb9AuqI3A33H8dIk8WdlWPFNDz5S7TsaPrlVzVw/viewform?usp=send_form)
- [Submission kit with form answers and launch posts](docs/submission-kit.md)
