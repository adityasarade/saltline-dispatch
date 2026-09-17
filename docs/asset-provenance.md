# Saltline asset provenance

Saltline uses an original fictional setting, fictional assignments, and original product copy. It does not use franchise characters, logos, screenshots, trailers, leaked material, anime characters, real-brand marks, or unlicensed assets.

## Canonical artwork

| Asset | Origin | License / use basis | Notes |
| --- | --- | --- | --- |
| `public/images/wake-tax.png` | Created for Saltline with OpenAI Image Generation on 3 September 2026 | Team-created production asset | Original Bellwether Pier, vessel, worker, and city setting. Canonical 1536 × 1024 same-origin editor source, not a call-card preview. Prompt excludes trademarks, franchise characters, logos, and text. |
| `public/images/room-08.png` | Created for Saltline with OpenAI Image Generation on 3 September 2026 | Team-created production asset | Original Morrow Court setting and anonymous characters. Canonical 1536 × 1024 same-origin editor source, not a call-card preview. Prompt excludes franchises, logos, and text. |
| `public/images/after-rain-daybreak.png` | Created for Saltline with OpenAI Image Generation on 3 September 2026 | Team-created production asset | Current After the Rain field plate with an original post-storm motel, marina trailer, silver mask, and anonymous courier. Canonical 1536 × 1024 same-origin editor source, not a call-card preview. Prompt excludes franchises, logos, and text. |
| `public/images/cala-verda-hero.png` | Created for Saltline with OpenAI Image Generation on 4 September 2026 | Team-created production asset | Canonical landing source with an original post-storm Cala Verda marina, anonymous courier, generic scooter, waterfront toll booth, boat, ferry, and carnival. Runtime landing art uses responsive display derivatives. Prompt excludes franchises, logos, and text. |
| `public/images/undertow.png` | Created for Saltline with OpenAI Image Generation on 4 September 2026 | Team-created production asset | Original Vesper Quay field plate with an anonymous wet sleeve, unbranded phone, quay watcher, and tender. Canonical 1536 × 1024 same-origin editor source, not a call-card preview. Prompt excludes franchises, logos, and text. |
| `public/images/off-the-meter.png` | Created for Saltline with OpenAI Image Generation on 4 September 2026 | Team-created production asset | Original Northbelt Causeway field plate with a generic shuttle, coral ribbon, anonymous driver, and ferry route. Canonical 1536 × 1024 same-origin editor source, not a call-card preview. Prompt excludes franchises, logos, and text. |
| `public/og.png` | Created for Saltline with OpenAI Image Generation on 3 September 2026 | Team-created production asset | Original social preview built around the Saltline wordmark and a fictional coastal pier. It intentionally carries the project's own typographic wordmark; it uses no franchise, brand, or third-party marks. |

## Display derivatives

The following display-only files were resized and WebP-encoded from the corresponding canonical artwork on 5 September 2026 with `cwebp` 1.6.0, method 6. The two hero variants use quality 90. The five call previews use quality 84. They are never supplied to React Image Editor.

| Asset | Source | Dimensions | Encoded size | Use basis and runtime role |
| --- | --- | ---: | ---: | --- |
| `public/images/display/cala-verda-hero-768.webp` | `cala-verda-hero.png` | 768 × 512 | 160,582 B | Derived from team-created artwork. Small responsive landing source. |
| `public/images/display/cala-verda-hero-1536.webp` | `cala-verda-hero.png` | 1536 × 1024 | 583,562 B | Derived from team-created artwork. Large responsive landing source. |
| `public/images/display/wake-tax-768.webp` | `wake-tax.png` | 768 × 512 | 83,830 B | Derived from team-created artwork. Display-only call card, reveal comparison, and editor loading preview. |
| `public/images/display/room-08-768.webp` | `room-08.png` | 768 × 512 | 60,286 B | Derived from team-created artwork. Display-only call card, reveal comparison, and editor loading preview. |
| `public/images/display/after-rain-daybreak-768.webp` | `after-rain-daybreak.png` | 768 × 512 | 101,788 B | Derived from team-created artwork. Display-only call card, reveal comparison, and editor loading preview. |
| `public/images/display/undertow-768.webp` | `undertow.png` | 768 × 512 | 98,780 B | Derived from team-created artwork. Display-only call card, reveal comparison, and editor loading preview. |
| `public/images/display/off-the-meter-768.webp` | `off-the-meter.png` | 768 × 512 | 86,908 B | Derived from team-created artwork. Display-only call card, reveal comparison, and editor loading preview. |

## Product documentation and interface

| Asset | Origin | License / use basis | Notes |
| --- | --- | --- | --- |
| `docs/screenshots/*.webp` | Captured from the local production build on 17 September 2026 with Playwright, then encoded with `cwebp` 1.6.0 at quality 86, method 6 | Team-created product documentation | Eight judge-facing states at 1280 × 720 and 390 × 844: landing, five field calls, explicit Angle Lock, the editor carrying a real draw mark, the night press run, publish, closing frame, and archive. Every call preview is fully decoded in the capture. |
| `public/saltline-dispatch.gif` | Recorded as video from one continuous run of the local production build on 17 September 2026, then encoded with `ffmpeg` and `gifsicle` 1.96 | Team-created product demonstration | 20 seconds at 780 px, 8 fps. One unbroken take: the locked plate in React Image Editor, a coral draw stroke being traced across the wake, the editor's own Save, the night press run, and the printed dispatch that results. The export shown in publish and closing is the same saved artifact. |
| Desk sound | Synthesized at runtime in `lib/desk-sound.ts` | Team-created source | Three short diegetic cues - a call landing, the press feeding a sheet, a stamp coming down - generated with WebAudio oscillators and noise buffers. The project ships no audio files, samples, or recordings, so no third-party audio licence applies. Off by default and opened only from a user gesture. |
| UI textures and marks | Authored in `app/globals.css` | Team-created source | CSS paper grain, shapes, typography treatment, and wordmark are original code. Grain stays behind editor and saved-image pixels. |
| Barlow Condensed (weights 400, 700, 900, latin subset) | Designed by Jeremy Tribby. Retrieved from Google Fonts at build time by `next/font/google` and self-hosted from the deployment origin. | SIL Open Font License 1.1 | The uppercase interface face: labels, eyebrows, buttons, the process rail, the stamps and the export ledger. Declared once in `app/layout.tsx` and consumed through the `--sans` token in `app/globals.css`. The OFL permits bundling and redistribution with the work; the font is shipped unmodified and not renamed, and no reserved font name is used. No runtime request is made to Google. Upstream: <https://github.com/jpt/barlow>, licence text: <https://openfontlicense.org>. |
| Georgia, Arial Black, Arial, and `ui-monospace` | None is bundled | System fonts, referenced by name only | Georgia carries the display headlines and the serif body copy. The downloadable front page is drawn with Canvas 2D in `lib/front-page.ts`, which names `Arial Black`, `Arial`, `Georgia`, and `ui-monospace` as strings because a `next/font` family is not reliably resolvable by name from a canvas context. No font files for any of these are distributed with this repository, so no third-party font licence applies to them. |
| Unlayer React Image Editor | `@unlayer/react-image-editor` 1.0.2 | MIT licensed dependency | See the upstream repository license and notice. The application installs and uses the package without copying its source. |

## Contest note

Unlayer's FAQ asks participants to use self-created assets or assets for which they have rights or permission, and warns against leaked or unauthorized material. Saltline responds with an original coastal micro-experience and an explicit asset ledger. See the repository README for the full independence statement.
