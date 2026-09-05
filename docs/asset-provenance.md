# Saltline asset provenance

Saltline uses an original fictional setting, fictional assignments, and original product copy. It does not use franchise characters, logos, screenshots, trailers, leaked material, anime characters, real-brand marks, or unlicensed assets.

## Canonical artwork

| Asset | Origin | License / use basis | Notes |
| --- | --- | --- | --- |
| `public/images/wake-tax.png` | Created for Saltline with OpenAI Image Generation on 3 September 2026 | Team-created production asset | Original Bellwether Pier, vessel, worker, and city setting. Canonical 1536 × 1024 same-origin editor source, not a call-card preview. Prompt excludes trademarks, franchise characters, logos, and text. |
| `public/images/room-08.png` | Created for Saltline with OpenAI Image Generation on 3 September 2026 | Team-created production asset | Original Morrow Court setting and anonymous characters. Canonical 1536 × 1024 same-origin editor source, not a call-card preview. Prompt excludes franchises, logos, and text. |
| `public/images/after-rain.png` | Created for Saltline with OpenAI Image Generation on 3 September 2026 | Team-created production asset | Original initial Cormorant Carnival setting, worker, and mask. Retained in the repository but not used in the current experience. |
| `public/images/after-rain-daybreak.png` | Created for Saltline with OpenAI Image Generation on 3 September 2026 | Team-created production asset | Current After the Rain field plate with an original post-storm motel, marina trailer, silver mask, and anonymous courier. Canonical 1536 × 1024 same-origin editor source, not a call-card preview. Prompt excludes franchises, logos, and text. |
| `public/images/cala-verda-hero.png` | Created for Saltline with OpenAI Image Generation on 4 September 2026 | Team-created production asset | Canonical landing source with an original post-storm Cala Verda marina, anonymous courier, generic scooter, waterfront toll booth, boat, ferry, and carnival. Runtime landing art uses responsive display derivatives. Prompt excludes franchises, logos, and text. |
| `public/images/undertow.png` | Created for Saltline with OpenAI Image Generation on 4 September 2026 | Team-created production asset | Original Vesper Quay field plate with an anonymous wet sleeve, unbranded phone, quay watcher, and tender. Canonical 1536 × 1024 same-origin editor source, not a call-card preview. Prompt excludes franchises, logos, and text. |
| `public/images/off-the-meter.png` | Created for Saltline with OpenAI Image Generation on 4 September 2026 | Team-created production asset | Original Northbelt Causeway field plate with a generic shuttle, coral ribbon, anonymous driver, and ferry route. Canonical 1536 × 1024 same-origin editor source, not a call-card preview. Prompt excludes franchises, logos, and text. |
| `public/og.png` | Created for Saltline with OpenAI Image Generation on 3 September 2026 | Team-created production asset | Original social preview built around the Saltline wordmark and fictional coastal pier. Prompt excludes franchises, logos, and text. |

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
| `docs/screenshots/*.webp` | Captured from the final local production build on 5 September 2026 | Team-created product documentation | Seven judge-facing states at 1280 × 720 and 390 × 844: landing, guide, calls, editor, publish, closing frame, and archive. |
| `public/saltline-dispatch.gif` | Rebuilt from the final local product captures on 5 September 2026 | Team-created product demonstration | Shows the five-screen journey and both overlays. The edited export shown in publish, closing, and archive is the same saved artifact. |
| UI textures and marks | Authored in `app/globals.css` | Team-created source | CSS paper grain, shapes, typography treatment, and wordmark are original code. Grain stays behind editor and saved-image pixels. |
| Unlayer React Image Editor | `@unlayer/react-image-editor` 1.0.2 | MIT licensed dependency | See the upstream repository license and notice. The application installs and uses the package without copying its source. |

## Contest note

Unlayer's FAQ asks participants to use self-created assets or assets for which they have rights or permission, and warns against leaked or unauthorized material. Saltline responds with an original coastal micro-experience and an explicit asset ledger. See the repository README for the full independence statement.
