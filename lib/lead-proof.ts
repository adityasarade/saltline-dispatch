// Did the edit land on the lead?
//
// Angle Lock is a claim about one subject in the plate. This measures
// whether the visitor's saved export actually differs from the untouched
// plate *inside that subject's region*, and how that compares with the
// change everywhere else.
//
// What this does NOT do, and never claims to do: understand the edit. It
// does not know a caption from a crop mark, it cannot tell a good mark from
// a bad one, and it has no opinion about the subject. It compares pixels in
// a box against pixels in the same box and reports two percentages. Both
// percentages are shown to the visitor.
//
// Crop handling is deliberate and disclosed. The export is mapped back into
// the plate's frame with `contain` placement - fitted whole, centred, never
// cropped to fill - so a crop that removes the lead region shows up as a
// large change inside that region rather than silently comparing the wrong
// pixels. A crop is a real editorial act and the desk counts it as one.

import type { LeadRegion } from './lead-regions';

export type LeadVerdict = 'on-lead' | 'worked-wide' | 'lead-untouched' | 'recropped' | 'unmeasured';

export type LeadProof = {
  verdict: LeadVerdict;
  verdictLabel: string;
  verdictNote: string;
  /** Share of pixels inside the lead region that moved, 0-1. */
  insideChange: number | null;
  /** Share of pixels outside the lead region that moved, 0-1. */
  outsideChange: number | null;
  subject: string | null;
};

/**
 * Per-channel 0-255 distance a pixel must move to count as changed.
 *
 * Measured, not guessed. React Image Editor returns a re-encoded JPEG even
 * when nothing was drawn, so every pixel shifts a little and a naive diff
 * would report a change everywhere. Re-encoding the five plates at JPEG
 * quality 0.80-0.92 and sampling on this same 256px grid moved the
 * 99.5th-percentile pixel by 9-22 depending on the plate, with the noisiest
 * (Undertow, rain and reflections) the worst.
 *
 * At 24 that re-encode floor accounts for at most 0.33% of pixels, against
 * the 4% share below which the desk calls a region untouched - a margin of
 * more than ten times, while still catching a thin pencil stroke.
 */
export const CHANGE_THRESHOLD = 24;

/**
 * Share of a region's pixels that must move before the desk calls it worked.
 *
 * Also measured. On the smallest authored region a thin 8px pencil stroke
 * laid across the subject moves about 3% of it, while pure re-encode noise
 * moves 0.15%. At 1.5% a single deliberate stroke counts and the noise floor
 * is still ten times below the line.
 */
export const WORKED_SHARE = 0.015;

/**
 * How far the export's aspect ratio may drift from the plate's before the
 * lead measurement is abandoned.
 *
 * A crop moves every pixel in the frame, so inside and outside both saturate
 * (a measured crop reads 86% inside / 81% outside) and the comparison stops
 * meaning anything. Rather than report a confident number from a saturated
 * diff, the desk says plainly that it read the cut instead - which is exactly
 * what the press read already measures.
 */
export const ASPECT_TOLERANCE = 0.02;

const VERDICTS: Record<
  Exclude<LeadVerdict, 'unmeasured' | 'recropped'>,
  { verdictLabel: string; verdictNote: string }
> = {
  'on-lead': {
    verdictLabel: 'ON THE LEAD',
    verdictNote: 'Your marks land on the thing you locked. The desk runs it as proof.',
  },
  'worked-wide': {
    verdictLabel: 'WORKED WIDE',
    verdictNote: 'You changed more of the frame than the lead itself. The desk runs it, with a note.',
  },
  'lead-untouched': {
    verdictLabel: 'LEAD UNTOUCHED',
    verdictNote: 'You edited the plate, but not the thing you locked. The desk prints it anyway.',
  },
};

export function classifyLead(
  insideChange: number | null,
  outsideChange: number | null,
  recropped = false,
): LeadVerdict {
  if (recropped) return 'recropped';

  if (
    insideChange === null ||
    outsideChange === null ||
    !Number.isFinite(insideChange) ||
    !Number.isFinite(outsideChange)
  ) {
    return 'unmeasured';
  }

  if (insideChange < WORKED_SHARE) return 'lead-untouched';
  // Worked the lead harder than the rest of the frame, by a clear margin.
  if (insideChange >= outsideChange * 1.25) return 'on-lead';
  return 'worked-wide';
}

export function readLead(
  insideChange: number | null,
  outsideChange: number | null,
  subject: string | null,
  recropped = false,
): LeadProof {
  const verdict = classifyLead(insideChange, outsideChange, recropped);

  if (verdict === 'recropped') {
    return {
      verdict,
      verdictLabel: 'PLATE RECROPPED',
      verdictNote:
        'You recut the frame, so the desk read the cut rather than the marks. The press call below is that reading.',
      insideChange: null,
      outsideChange: null,
      subject,
    };
  }

  if (verdict === 'unmeasured') {
    return {
      verdict,
      verdictLabel: 'LEAD UNMEASURED',
      verdictNote: 'This browser would not release the saved pixels, so the desk ran it on your word.',
      insideChange: null,
      outsideChange: null,
      subject,
    };
  }

  return {
    verdict,
    ...VERDICTS[verdict],
    insideChange,
    outsideChange,
    subject,
  };
}

/**
 * The one-line receipt shown beside the printed plate, under a "LEAD" label,
 * so it does not repeat the word itself.
 */
export function leadLedgerLine(proof: LeadProof): string {
  if (proof.verdict === 'recropped') return 'NOT MEASURED · PLATE RECROPPED';
  if (proof.insideChange === null || proof.outsideChange === null) return 'NOT MEASURED';
  const inside = (proof.insideChange * 100).toFixed(1);
  const outside = (proof.outsideChange * 100).toFixed(1);
  return `${inside}% CHANGED · REST OF FRAME ${outside}% · ${proof.verdictLabel}`;
}

type Sampled = { data: Uint8ClampedArray; size: number };

/**
 * Draws an image into a fixed square at a known placement and returns its
 * pixels. `contain` keeps the whole export visible inside the plate's frame,
 * so a cropped export is compared against the plate it came from rather than
 * against arbitrary pixels.
 */
function sample(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  size: number,
): Sampled | null {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;

  // Out-of-frame area reads as a change, which is the point: a crop that
  // drops the lead should not score as "untouched".
  context.fillStyle = '#000000';
  context.fillRect(0, 0, size, size);

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    context.drawImage(source, 0, 0, size, size);
  } else {
    const scale = Math.min(size / sourceWidth, size / sourceHeight);
    const width = sourceWidth * scale;
    const height = sourceHeight * scale;
    context.drawImage(source, (size - width) / 2, (size - height) / 2, width, height);
  }

  try {
    return { data: context.getImageData(0, 0, size, size).data, size };
  } catch {
    return null;
  }
}

/**
 * Measures the saved export against its untouched plate.
 *
 * Both images are rasterized to the same square grid. The plate fills the
 * grid; the export is contained within it, so an uncropped export lands on
 * the same pixels and a cropped one is honestly letterboxed.
 */
export async function measureLead(
  plateUrl: string,
  exportBlob: Blob,
  region: LeadRegion | null,
): Promise<{ insideChange: number | null; outsideChange: number | null; recropped: boolean }> {
  const empty = { insideChange: null, outsideChange: null, recropped: false };
  if (!region || typeof document === 'undefined' || !('createImageBitmap' in globalThis)) return empty;

  let plate: ImageBitmap | null = null;
  let saved: ImageBitmap | null = null;

  try {
    const plateResponse = await fetch(plateUrl);
    if (!plateResponse.ok) return empty;
    [plate, saved] = await Promise.all([
      createImageBitmap(await plateResponse.blob()),
      createImageBitmap(exportBlob),
    ]);

    // A recut frame saturates the diff, so refuse to report a number rather
    // than dress a meaningless one up as proof.
    const plateAspect = plate.width / plate.height;
    const savedAspect = saved.width / saved.height;
    if (Math.abs(savedAspect - plateAspect) / plateAspect > ASPECT_TOLERANCE) {
      return { insideChange: null, outsideChange: null, recropped: true };
    }

    const size = 256;

    // The plate is drawn contained too, so an unedited export of identical
    // proportions lands exactly on top of it.
    const before = sample(plate, plate.width, plate.height, size);
    const after = sample(saved, saved.width, saved.height, size);
    if (!before || !after) return empty;

    const left = Math.round(region.x * size);
    const top = Math.round(region.y * size);
    const right = Math.min(size, Math.round((region.x + region.width) * size));
    const bottom = Math.min(size, Math.round((region.y + region.height) * size));

    // When the export's proportions differ from the plate's, the contained
    // export occupies a smaller box, while the region still maps to the same
    // place in the plate's frame - which is the question being asked.
    let insideMoved = 0;
    let insideTotal = 0;
    let outsideMoved = 0;
    let outsideTotal = 0;

    for (let y = 0; y < size; y += 1) {
      const inRow = y >= top && y < bottom;
      for (let x = 0; x < size; x += 1) {
        const index = (y * size + x) * 4;
        const moved =
          Math.abs(before.data[index] - after.data[index]) > CHANGE_THRESHOLD ||
          Math.abs(before.data[index + 1] - after.data[index + 1]) > CHANGE_THRESHOLD ||
          Math.abs(before.data[index + 2] - after.data[index + 2]) > CHANGE_THRESHOLD;

        if (inRow && x >= left && x < right) {
          insideTotal += 1;
          if (moved) insideMoved += 1;
        } else {
          outsideTotal += 1;
          if (moved) outsideMoved += 1;
        }
      }
    }

    if (insideTotal === 0 || outsideTotal === 0) return empty;

    return {
      insideChange: insideMoved / insideTotal,
      outsideChange: outsideMoved / outsideTotal,
      recropped: false,
    };
  } catch {
    return empty;
  } finally {
    plate?.close();
    saved?.close();
  }
}
