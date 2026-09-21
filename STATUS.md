# Status — Saltline Dispatch

**State:** CITY HEAT, the live editor readout, the back page, and the final clarity pass are implemented, tested, and published at the canonical URL.

Canonical URL: **https://saltline-dispatch.vercel.app** · Source: **https://github.com/adityasarade/saltline-dispatch**

## Final pass — 20 September 2026 (IST)

- The five-at-once case cards keep their dramatic single-row layout at 1280 × 720, but summaries are now 13px instead of 10px and the cards have enough height to remain readable without clipping.
- Printing the other angle of a case is no longer called a factual contradiction when both leads may be true. The editor warns first; the reveal itemises the charge; the issue wall and standing sheet call it **unreconciled coverage** while retaining the versioned storage schema.
- The local production flow was rechecked from a clean browser: first plate → editor Save → reveal → closing frame → second angle → warning → Save → +18 heat notice → both flagged archive plates → reload with the two filings intact.
- `npm test` passes all 87 tests, `npm run lint` passes, `npm run check:content` passes, and `npm run build:vercel` passes.

## Front-page pass — 21 September 2026 (IST)

- The publish payoff is now a complete miniature front page with masthead, headline, exact saved plate, story deck, selected angle, plate receipt, City Heat, and edition folio—not a framed image with a stamp.
- The 1600 × 2000 PNG mirrors that richer hierarchy. Crop geometry still chooses banner, lead, or column treatment; the exact Unlayer export is drawn once, unfiltered and unobstructed.
- The keepsake action states its native dimensions before download, while the raw exact-plate download remains available separately.

## Verified 17 September 2026 (IST)

Automated: `npm run lint`, `npx tsc --noEmit`, `npm test` (**87 tests**), `npm run check:content`, `npm run build` (Vinext) and `npm run build:vercel` (the deploying Next build) all pass.

Against a locally served production `next build`, driven with Playwright 1.62.1 from clean browser contexts — **56 of 56 checks passed, zero console errors and zero page errors across the whole run**:

- The full route works: landing → five field calls → Angle Lock → React Image Editor → a real draw stroke → the editor's own Save → the night press run → the publish reveal → the closing frame → the issue wall.
- **The issue wall and the city heat survive a reload.** One versioned `localStorage` key, `saltline.desk.v1`, 722 KB for a single plate. After a reload the wall count, the heat tier, the filed count and the plate itself are all still there, and the briefing greets a returning visitor instead of restarting the night.
- **Two-angle coverage is detected and flagged.** Printing "Expose the launch" and then "Protect the ferry crew" on Wake Tax charges **+18**, names both angles and filing times in the issue-wall ledger, and stamps **UNRECONCILED IN PRINT** on both plates. The 20 September pass clarified that this is an unexplained change in editorial lead, not necessarily contradictory facts.
- **Heat escalates visibly.** Measured across five filings: `WIRE QUIET` → `SWITCHBOARD WARM` (22) → `LETTERS ARRIVING` (48) → `EDITION HELD` (78). The masthead strip copy changed at each crossing, the wall's desk line changed, a legal notice from a fictional harbour counsel was pinned at the third tier, the hold order and a **spiked plate** appeared at the fourth, and the closing frame carried the tier's own line.
- **The live readout flips.** Same case, same locked angle: a stroke in the sky read `OFF THE LEAD`; strokes on the pleasure launch flipped the same card to `ON THE LEAD`. The card also names the layout the current crop would produce and discloses that it is a sample, with Save still setting the record.
- **Private mode is safe.** With `window.localStorage` stubbed to throw on access, the app loads, the heat strip renders, a dispatch still publishes, the in-memory wall works, and the standing sheet says plainly that tonight lives in this tab only.
- **The known `getImage()` trap is handled.** No live card is shown before any edit, because a source URL is refused rather than measured as an export.
- **No horizontal overflow at 390 × 844** on the briefing, field calls, Angle Lock gate, editor step, publish reveal, issue wall (with the heat panel, the notice, the contradiction ledger and the classifieds), the standing sheet and the closing frame — measured excluding elements an ancestor legitimately clips or scrolls.
- **The editor step now fits a 1280 × 720 viewport exactly** (`scrollHeight` 720 of 720, down from 727) with the live card fully visible at 694 px. `START TONIGHT'S RUN` sits at 580 px of 720 and the editor canvas is three clicks from a cold load.
- **The CDN-failure path terminates.** Three failed loads now stop offering another retry, state the cause (the runtime comes from Unlayer's CDN) and offer a route out; previously it retried forever with no terminal message.
- The lead proof and press read still discriminate as before: marks on the subject versus marks on the sky produce different printed verdicts, and a 16:9 crop still promotes the plate to a banner.
- An untouched Save is still refused. The publish path remains the editor's returned `dataUrl` and nothing else.
- A worst-case 2.9 MB stored payload measured 5.8 ms to serialise and 6.9 ms to write.

## Known gaps, stated plainly

- The 20 September interface copy differs from the earlier issue-wall screenshot and journey GIF; those captures remain historical references until re-recorded.
- The archive box keeps the **four most recent negatives**. Older records keep their full ledger line and show `NEGATIVE NOT ON FILE` instead of pixels, because a flattened export is 250 KB to 2 MB as a base64 data URL against roughly 5 MB of origin quota. The write ladder gives up negatives one at a time before it gives up a record.
- The `EDITION HELD` tier does **not** block publishing. It warns in the editor bar, pins a hold order, and spikes another plate on every further filing. Locking a judge out of the editor at the top tier would be a dead end, so the paper prints anyway and pays for it — which is also what the tier's own copy says.
- React Image Editor loads its runtime from Unlayer's CDN, so the editing step needs network access. There is a visible retry path with a terminal state, but this build does not work offline.
- The lead measurement is abandoned, and says so, when the plate is recropped: a crop moves every pixel and saturates the comparison. The live card says the same thing while you work.
- The animated `public/saltline-dispatch.gif` and the earlier stills predate CITY HEAT. Three new stills were captured for the new surfaces; the GIF has not been re-recorded.

**External boundary:** the upstream repository is already starred. The entrant must still submit the official form for this entry; no implementation can guarantee a subjective judging result.

**Next gate:** submit the official form before **24 September 2026 at 23:59 UTC (25 September, 05:29 IST)**. Draft answers are in `docs/submission-kit.md`.
