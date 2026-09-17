# Status — Saltline Dispatch

**State:** Working tree ahead of the deployed build. CITY HEAT, the live editor readout, a UX pass and the back page are implemented and verified locally; nothing is committed, pushed or deployed.

Canonical URL: **https://saltline-dispatch.vercel.app** (serving commit `12d483d`, without the work below) · Source: **https://github.com/adityasarade/saltline-dispatch**

## Verified 17 September 2026 (IST)

Automated: `npm run lint`, `npx tsc --noEmit`, `npm test` (**87 tests**), `npm run check:content`, `npm run build` (Vinext) and `npm run build:vercel` (the deploying Next build) all pass.

Against a locally served production `next build`, driven with Playwright 1.62.1 from clean browser contexts — **56 of 56 checks passed, zero console errors and zero page errors across the whole run**:

- The full route works: landing → five field calls → Angle Lock → React Image Editor → a real draw stroke → the editor's own Save → the night press run → the publish reveal → the closing frame → the issue wall.
- **The issue wall and the city heat survive a reload.** One versioned `localStorage` key, `saltline.desk.v1`, 722 KB for a single plate. After a reload the wall count, the heat tier, the filed count and the plate itself are all still there, and the briefing greets a returning visitor instead of restarting the night.
- **Contradiction is detected and flagged.** Printing "Expose the launch" and then "Protect the ferry crew" on Wake Tax charged **+18**, named it in the desk's voice (*"The paper has now printed both sides of Wake Tax"*), listed the case with both angles and both filing times in a THE PAPER AGAINST ITSELF ledger, and stamped **CONTRADICTED IN PRINT** on both plates.
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

- **The deployed build does not include any of this.** The working tree is not committed and the live URL still serves `12d483d`.
- The archive box keeps the **four most recent negatives**. Older records keep their full ledger line and show `NEGATIVE NOT ON FILE` instead of pixels, because a flattened export is 250 KB to 2 MB as a base64 data URL against roughly 5 MB of origin quota. The write ladder gives up negatives one at a time before it gives up a record.
- The `EDITION HELD` tier does **not** block publishing. It warns in the editor bar, pins a hold order, and spikes another plate on every further filing. Locking a judge out of the editor at the top tier would be a dead end, so the paper prints anyway and pays for it — which is also what the tier's own copy says.
- React Image Editor loads its runtime from Unlayer's CDN, so the editing step needs network access. There is a visible retry path with a terminal state, but this build does not work offline.
- The lead measurement is abandoned, and says so, when the plate is recropped: a crop moves every pixel and saturates the comparison. The live card says the same thing while you work.
- The animated `public/saltline-dispatch.gif` and the earlier stills predate CITY HEAT. Three new stills were captured for the new surfaces; the GIF has not been re-recorded.

**External boundary:** starring the upstream repository, publishing a social post, and submitting the official form require the entrant account. No implementation can guarantee a subjective judging result.

**Next gate:** review the working tree, commit and deploy, re-record the journey GIF, then star the React Image Editor repository, optionally publish the prepared social post, and submit the official form before **24 September 2026 at 23:59 UTC (25 September, 05:29 IST)**.
