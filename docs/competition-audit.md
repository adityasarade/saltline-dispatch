# Saltline competition audit

Audit date: 6 September 2026

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
| Deploy a publicly accessible live site | The current production deployment is intentionally owner-only. Anonymous requests return 401. | **Blocked pending owner approval** |
| Support the React Image Editor repository | The project links and credits the upstream repository. Because the FAQ does not define “support,” the safest entrant action is to star the upstream repository from the submitting GitHub account. | Entrant action pending |
| Submit the official form before the deadline | The form is currently open. It requires project name, email, public GitHub URL, live URL, project/editor explanation, and confirmation checkboxes. | Entrant action pending |

## Judge-facing audit

| Criterion | Strongest evidence | Residual risk |
| --- | --- | --- |
| Creativity | “Two truths, one print” turns image editing into an editorial choice with ten distinct narrative outcomes. | A judge who skips the first-shift guide must still understand Angle Lock immediately. The editor gate now handles this. |
| Visual execution | Original paper-and-ink art direction, five coherent field plates, full-bleed desk, physical print reveal, closing frame, and issue wall. | Third-party editor chrome remains visibly Unlayer, which is intentional proof of integration. |
| Meaningful editor use | No preselected angle, no untouched publish, no alternate publish control, and the exact returned `dataUrl` survives every payoff state. | The editor runtime is CDN-delivered, so the live editing step still depends on network access. |
| Experience | Recommended first call, explicit Angle Lock, three-tool routes, protected dirty drafts, measured loader, angle-specific consequence, and replayable archive. | A 3 to 5 minute interaction is longer than a static demo, so the README GIF must communicate the loop quickly. |
| Overall execution | Responsive display derivatives, same-origin full-resolution sources, accessible dimensions, loading and failure states, export metadata, public source, and provenance. | Public deployment and final form submission remain external launch actions. |

## Integrity invariants

1. The product keeps exactly five screens: landing desk, field calls, editor, publish, and archive.
2. The first-shift guide and closing frame remain overlays inside that flow.
3. Exactly five field calls exist.
4. No Angle Lock is selected silently.
5. An untouched editor Save cannot print.
6. The Unlayer `dataUrl` is the only publish artifact.
7. The exact same `dataUrl` is used in reveal, comparison proof, closing frame, archive, and download.
8. Starting a new draft clears the active prior dispatch, while archive replay deliberately restores one.
9. Full-resolution same-origin PNG files remain the editor inputs. Display WebPs never enter the canvas.
10. Saltline adds no account, API key, analytics, paid service, or unnecessary backend.

## Final entrant checklist

- [x] Commit and push the verified final source, documentation, screenshots, GIF, and provenance ledger.
- [x] Deploy that exact commit with the existing owner-only access setting.
- [ ] Approve public access for the existing live deployment, then verify the live URL anonymously.
- [ ] Star the [React Image Editor repository](https://github.com/unlayer/react-image-editor) from the submitting GitHub account.
- [x] Verify the public repository default branch includes the final commit, README, GIF, screenshots, and provenance ledger.
- [ ] Submit the [official challenge form](https://docs.google.com/forms/d/e/1FAIpQLScfzk0EYvIZb9AuqI3A33H8dIk8WdlWPFNDz5S7TsaPrlVzVw/viewform?usp=send_form) before 24 September 2026 at 23:59 UTC.
- [ ] Preserve the form receipt and final live URL.

No implementation can guarantee a subjective competition result, but closing every unchecked launch action gives Saltline a complete, evidence-backed entry with a strong interpretation of every published judging criterion.

## Submission-ready explanation

Saltline Dispatch is a five-screen coastal-crime editorial micro-experience set in the original city of Cala Verda, framed as the graveyard-shift stringer side activity we would want to encounter inside the challenge's high-stakes coastal world. Five late-night field calls each contain two defensible truths. The visitor follows an instinct, chooses a case, explicitly locks one story angle, and uses Unlayer's React Image Editor to make that lead visible through a focused tool route. An untouched image cannot publish. The editor's saved `dataUrl` directly becomes the printed reveal, angle-specific closing frame, issue-wall artifact, and downloadable plate. There is no mock result or alternate publish path. Every field image is original, same-origin, and retained at 1536 × 1024 for editing; lighter WebP derivatives are used only for browsing surfaces.
