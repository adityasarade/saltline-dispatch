# Saltline competition audit

Audit date: 14 September 2026

This is a requirement-by-requirement audit of Saltline Dispatch against Unlayer's official Build With React Image Editor Challenge materials. It uses the [official challenge FAQ](https://unlayer.notion.site/Build-With-Image-Editor-Challenge-FAQ-3cf0ceb4c8e180309d91cd730811ebd1?pvs=73), [official announcement](https://x.com/unlayer/status/2095499044072149504), [React Image Editor repository](https://github.com/unlayer/react-image-editor), [editor documentation](https://docs.unlayer.com/builder/latest/images/image-editor), and the [official submission form](https://docs.google.com/forms/d/e/1FAIpQLScfzk0EYvIZb9AuqI3A33H8dIk8WdlWPFNDz5S7TsaPrlVzVw/viewform?usp=send_form).

The announced deadline is 24 September 2026 at 23:59 UTC, which is 25 September 2026 at 05:29 IST. The official judging criteria are creativity, visual execution, meaningful use of the editor, experience, and overall execution.

## Qualification matrix

| Official requirement | Saltline evidence | Status |
| --- | --- | --- |
| Create an original GTA VI-inspired experience a user would want to encounter | The challenge premise is translated into Cala Verda, an original coastal-crime night desk with five fictional cases, two editorial truths per plate, and no franchise assets or copied styling. | Ready |
| Use React Image Editor as a core part of the experience | `@unlayer/react-image-editor` is the only image desk. Its Save result creates the reveal, closing frame, archive artifact, and download. Removing it breaks the main loop. | Ready |
| Let the visitor edit or customize a visual | Six focused tools remain enabled: Crop, Filter, Draw, Text, Shapes, and Frame. Every angle supplies a three-tool reporting route. | Ready |
| Provide a complete public GitHub repository | The public repository contains the application, lockfile, README, provenance ledger, screenshots, and demonstration GIF. | Ready |
| Explain the full experience in the README | The README names the official inspiration requirement, explains the five-screen journey, documents exact Save data flow, and discloses originality boundaries. | Ready |
| Use assets created, owned, or used with permission | Every visual has a recorded origin and use basis in `docs/asset-provenance.md`. No leaked or unauthorized material is used. | Ready |
| Deploy a publicly accessible live site | The production build is publicly available at `https://saltline-dispatch.vercel.app`. Anonymous requests return 200. | Ready |
| Support the React Image Editor repository | The project links and credits the upstream repository. Because the FAQ does not define “support,” the safest entrant action is to star the upstream repository from the submitting GitHub account. | Entrant action pending |
| Submit the official form before the deadline | The form is currently open. It requires project name, email, public GitHub URL, live URL, project/editor explanation, and confirmation checkboxes. | Entrant action pending |

## Judge-facing audit

| Criterion | Strongest evidence | Residual risk |
| --- | --- | --- |
| Creativity | “Two truths, one print” turns image editing into an editorial choice with ten distinct narrative outcomes. | The landing rule card and editor gate must make Angle Lock legible without a tutorial detour. |
| Visual execution | Original paper-and-ink art direction, five coherent field plates, full-bleed desk, physical print reveal, closing frame, and issue wall. | Third-party editor chrome remains visibly Unlayer, which is intentional proof of integration. |
| Meaningful editor use | No preselected angle, no untouched publish, no alternate publish control, and the exact returned `dataUrl` survives every payoff state. | The editor runtime is CDN-delivered, so the live editing step still depends on network access. |
| Experience | Direct case access, explicit Angle Lock, one clear first move with the full route secondary, a live sample beside the canvas, protected dirty drafts, measured loader, angle-specific consequence, a replayable issue wall, and CITY HEAT carrying the wall and the desk's standing across visits with contradiction as its sharpest consequence. | A 3 to 5 minute interaction is longer than a static demo, so the README GIF must communicate the loop quickly, and it has not yet been re-recorded to include CITY HEAT. |
| Overall execution | Responsive display derivatives, same-origin full-resolution sources, accessible dimensions, loading and failure states, export metadata, public source, provenance, and a public Vercel deployment. | Final social post and form submission remain entrant actions. |

## Integrity invariants

1. The product keeps exactly five screens: landing desk, field calls, editor, publish, and issue wall. The closing frame and the desk standing sheet are overlays inside that flow.
2. The closing frame remains an overlay inside that flow; the primary route has no tutorial modal.
3. Exactly five field calls exist.
4. No Angle Lock is selected silently.
5. An untouched editor Save cannot print.
6. The Unlayer `dataUrl` is the only publish artifact.
7. The exact same `dataUrl` is used in reveal, comparison proof, front page, closing frame, archive, and download.
8. Starting a new draft clears the active prior dispatch, while archive replay deliberately restores one.
9. Full-resolution same-origin PNG files remain the editor inputs. Display WebPs never enter the canvas.
10. Saltline adds no account, API key, analytics, paid service, or unnecessary backend.

## Final entrant checklist

- [x] Commit and push the 14 September product pass and updated documentation.
- [x] Deploy the upgraded competition build publicly on Vercel and verify the live URL anonymously.
- [ ] Star the [React Image Editor repository](https://github.com/unlayer/react-image-editor) from the submitting GitHub account.
- [x] Verify the public repository default branch includes the final commit, README, GIF, screenshots, and provenance ledger.
- [ ] Optional but recommended: publish the prepared X or LinkedIn launch post with `#BuiltWithImageEditor`, then add its URL to the form.
- [ ] Submit the [official challenge form](https://docs.google.com/forms/d/e/1FAIpQLScfzk0EYvIZb9AuqI3A33H8dIk8WdlWPFNDz5S7TsaPrlVzVw/viewform?usp=send_form) before 24 September 2026 at 23:59 UTC.
- [ ] Preserve the form receipt and final live URL.

No implementation can guarantee a subjective competition result, but closing every unchecked launch action gives Saltline a complete, evidence-backed entry with a strong interpretation of every published judging criterion.

## Final technical verification — 7 September 2026

- Local `HEAD`, local `origin/main`, and the current remote `main` branch all resolve to `9bd28261822d8120b868ee407d06e3caee661725`.
- The raw public README is byte-identical to the verified local README.
- Anonymous requests to `https://saltline-dispatch.vercel.app/` return HTTP 200.
- The live document metadata and `https://saltline-dispatch.vercel.app/og.png` are reachable.
- `npm run lint`, the Vinext production build, and the Vercel/Next.js production build all pass.
- No deployment, repository star, social post, or form submission was performed as part of this verification.

## Independent competitive pass — 14 September 2026

The public sample remains crowded with wanted posters, character cards, casefiles, and evidence-board workflows. Saltline's strongest separation is editorial consequence: two defensible truths exist in the same plate, the user must lock a lead, and the exact saved pixels determine the published record. The primary weakness was onboarding repetition—the landing already explained the loop, then a two-page first-shift modal explained it again. The main route now goes directly from the landing desk to all five calls.

The reveal now offers a 1600 × 2000 newspaper front page that preserves the exact Unlayer export without cropping and combines it with the selected angle, case, plate code, outcome copy, and edition metadata. This creates a more distinctive keepsake while retaining the raw exact-plate download.

Browser acceptance on desktop and 390 × 844 covered the shortened route, Angle Lock, untouched-Save rejection, a real editor change, exact saved reveal, and native-size front-page generation. Lint plus both production build paths pass. No implementation can guarantee a subjective prize result.

## Submission-ready explanation

Saltline Dispatch is a five-screen coastal-crime editorial micro-experience set in the original city of Cala Verda, framed as the graveyard-shift stringer side activity we would want to encounter inside the challenge's high-stakes coastal world. Five late-night field calls each contain two defensible truths. The visitor chooses a case, explicitly locks one story angle, and uses Unlayer's React Image Editor to make that lead visible through a focused tool route. An untouched image cannot publish. The editor's saved `dataUrl` directly becomes the printed reveal, angle-specific closing frame, issue-wall artifact, and downloadable plate. There is no mock result or alternate publish path. Every field image is original, same-origin, and retained at 1536 × 1024 for editing; lighter WebP derivatives are used only for browsing surfaces.
