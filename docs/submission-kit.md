# Saltline Dispatch submission kit

Prepared on 14 September 2026 for Unlayer's Build With React Image Editor Challenge.

The competition build is publicly deployed on Vercel and available to anonymous visitors.

Updated 23 September: an image-first mobile opening, clearer role and time commitment, a recommended first case, selective editor guidance, accessible Save/Cancel controls, and a front-page-first reveal. Detailed measurements remain available under “How your edit changed the story.” The X copy below is the current launch copy.

## Final launch order

1. Verify the Vercel live URL in a signed-out browser on desktop and mobile.
2. Star the [Unlayer React Image Editor repository](https://github.com/unlayer/react-image-editor) from the submitting GitHub account.
3. Publish one of the prepared social posts below. Attach `public/saltline-dispatch.gif` or `docs/screenshots/publish-1280x720.webp`.
4. Copy the social post URL.
5. Complete the [official submission form](https://docs.google.com/forms/d/e/1FAIpQLScfzk0EYvIZb9AuqI3A33H8dIk8WdlWPFNDz5S7TsaPrlVzVw/viewform?usp=send_form) with the answers below.
6. Save the form receipt, public live URL, repository URL, and social post URL.

Deadline: 24 September 2026 at 23:59 UTC, which is 25 September 2026 at 05:29 IST.

## Official form answers

### What is your project name?

Saltline Dispatch: the 2:13 AM edition

### What is your email address?

Use the email address you want Unlayer to contact about the entry. The Google account currently viewing the form is not automatically included in the response, so enter the preferred address explicitly.

### What is the GitHub repository used for your submission?

https://github.com/adityasarade/saltline-dispatch

### What is the live link to your project?

https://saltline-dispatch.vercel.app

### Social post link

Paste the final X post URL here. The field is optional in the current form, but the announcement includes sharing with #BuiltWithImageEditor as a participation step, so include your published X post.

### Tell us about your GTA VI experience

Saltline Dispatch is an original five-screen coastal-crime editorial micro-experience set in the fictional city of Cala Verda. It is framed as a graveyard-shift stringer side activity we would want to encounter inside a high-stakes coastal world. Five late-night field calls each contain two defensible truths. The player chooses a case, explicitly locks one story angle, and uses Unlayer's React Image Editor to make that lead visible through a focused three-tool route.

The image editor is the central story mechanic. An untouched image cannot publish, and there is no alternate publish control or mock result. The exact `dataUrl` returned by the editor's Save action becomes the printed reveal, angle-specific closing frame, issue-wall artifact, replay, and downloadable plate. Each of the ten Angle Lock outcomes changes the brief, suggested tools, consequence, stamp, and closing line.

The edit itself also changes the printed page, not just the copy around it. Each of the ten leads has an authored region in the plate — the mask, the witness, the launch, the driver — and on Save the desk measures how much of that region actually moved against how much of the rest of the frame moved, so it can tell the player whether their marks landed on the subject they claimed. Both percentages are disclosed, and a recrop is reported as a recrop rather than dressed up as proof. On Save, Saltline measures the export's aspect ratio and its exposure relative to the plate the player started from, then lays out the front page from those disclosed numbers: a wide cut is promoted to a banner, a tight cut is run as a tall column, and a plate graded away from its own baseline is filed as a darker or brighter press. The finished reveal is now a full miniature front page rather than a framed image, and the matching downloadable 1600 × 2000 PNG carries the chosen lead, headline, press reading, exact plate receipt, and current City Heat. Two players who lock the same angle on the same case still get different pages if they cut or grade the plate differently. Saltline never claims to interpret the content of an edit - it measures geometry and brightness, discloses both, and sets the page accordingly.

All five editable field plates are original, same-origin 1536 × 1024 images. Lightweight WebP derivatives are used only for the landing and call-selection surfaces, while the full-resolution originals remain available to the editor. The project uses no franchise assets, copied interface styling, accounts, API keys, analytics, paid services, or backend.

### I confirm that

Check all three required boxes:

- My project uses the React image editor as a core part of the implementation.
- The GitHub repository is public.
- The repository includes a README explaining the full GTA VI experience.

### Where can people find you?

https://github.com/adityasarade

https://x.com/aditya_sarade14

### Anything else you'd like us to know?

Saltline is built around a strict artifact-integrity rule: the saved Unlayer export is never reconstructed, restyled, or replaced. The same returned image pixels and plate code persist through reveal, closing frame, issue wall, replay, and download.

Two things are worth trying twice. A **live sample** card beside the canvas polls the editor's own `getImage()` while you work — gated on `hasChanges()` — and flips between *on the lead* and *off the lead* depending on where your marks actually land, then names the front-page layout your current crop would produce; the authoritative reading is still taken on Save, and the card says so. And **CITY HEAT** keeps the issue wall and the desk's standing between visits under one versioned browser key, so a second visit continues the same night: reusing a lead or a measured move costs more each time, four named tiers change the masthead, the briefing, the wall and the closing frame, and printing the other angle on a case you already printed is flagged as unreconciled coverage — stamped on both plates, named in a ledger, and the most expensive thing you can do.

The public repository includes the full source, performance measurements, asset provenance, responsive screenshots, and a demonstration GIF. Every visual and story element, including the satirical Cala Verda classifieds on the back page, was created for this project, and an automated content check sweeps all authored copy against franchise and real-brand terms.

## X launch post

two true stories can fit inside the same image. only one gets page one.

built saltline dispatch for @unlayer’s #BuiltWithImageEditor challenge. pick the angle, edit the evidence, and print a front page the city remembers.

https://saltline-dispatch.vercel.app

Recommended attachment: `public/saltline-dispatch.gif`.

Post on X, then paste the published post URL into your prefilled submission form. Review and submit the form yourself; drafts are not entries. No LinkedIn post is needed.

## Short showcase blurb

Five calls. Two truths inside every field plate. One irreversible print. Saltline Dispatch turns Unlayer's React Image Editor into the publishing desk of an original coastal-crime night edition, where the exact saved export determines what Cala Verda wakes up believing.

## Social attachment alt text

An animated walkthrough of Saltline Dispatch showing a midnight coastal newspaper desk, five illustrated field calls, the Angle Lock story choice, the Unlayer image editor, a printed evidence reveal, and the final issue-wall archive.

## Final pre-submit check

- The live link opens without authentication in a signed-out browser.
- The public repository opens and the README GIF loads.
- The editor opens from any of the five calls.
- A visible edit can be saved and reaches reveal, closing frame, and archive.
- The published social post contains `#BuiltWithImageEditor` and working links.
- The form email is the preferred contact address.
- All three confirmation boxes are selected.
- The response is submitted before the deadline and its receipt is preserved.
