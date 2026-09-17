# Status — Saltline Dispatch

**State:** Shipped. Public source and the live build are in sync; entrant-account actions remain.

Canonical URL: **https://saltline-dispatch.vercel.app** · Source: **https://github.com/adityasarade/saltline-dispatch**

## Verified 17 September 2026 (IST)

Automated: `npm run lint`, `npx tsc --noEmit`, `npm test` (45 tests), `npm run check:content`, `npm run build` (Vinext) and `npm run build:vercel` (the deploying Next build) all pass.

Against the live production build, from a clean browser context with no cookies or stored state:

- The full route works: landing → five field calls → Angle Lock → React Image Editor → a real draw stroke → the editor's own Save → the night press run → the publish reveal → the closing frame → the issue wall. Zero page errors, zero console errors.
- **The lead proof discriminates.** The same case and the same locked angle produce genuinely different printed verdicts depending only on where the visitor drew: a stroke on the silver mask reported `ON THE LEAD` at 3.0% inside / 0.0% outside, and an identical stroke in the sky reported `LEAD UNTOUCHED` at 0.1% / 0.2%. Both percentages are shown in the export ledger.
- **The press read discriminates.** A 16:9 crop promoted the plate to `RUN AS BANNER` at 1.78:1; an untouched 3:2 plate ran as the night lead; a Technicolor grade reported 0.61× exposure against the plate's own baseline as `PRESSED DARK`.
- The downloadable 1600 × 2000 front page renders correctly in all three layouts — banner, lead and column — with no letterboxing and no overlapping text.
- An untouched Save is still refused. The publish path remains the editor's returned `dataUrl` and nothing else.
- Landing transfer measured at 0.86 MB over 14 requests, including three self-hosted Barlow Condensed faces.
- No horizontal overflow at 390 × 844 on the landing, calls or Angle Lock screens, and the five-step progress rail now scrolls on a phone instead of hiding four of its steps.
- Every link in this repository's README resolves (HTTP 200), checked individually.

## Known gaps, stated plainly

- The issue wall lives in the tab. A refresh starts a new night; dispatches do not persist between sessions.
- The editor does not react while the visitor is mid-edit — the lead and press readings arrive on Save.
- React Image Editor loads its runtime from Unlayer's CDN, so the editing step needs network access. There is a visible retry path, but this build does not work offline.
- The lead measurement is abandoned, and says so, when the plate is recropped: a crop moves every pixel and saturates the comparison.

**External boundary:** starring the upstream repository, publishing a social post, and submitting the official form require the entrant account. No implementation can guarantee a subjective judging result.

**Next gate:** star the React Image Editor repository, optionally publish the prepared social post, submit the official form and save its receipt before **24 September 2026 at 23:59 UTC (25 September, 05:29 IST)**.
