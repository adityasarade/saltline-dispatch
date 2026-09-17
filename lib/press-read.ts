// The press read.
//
// Saltline never guesses what a visitor meant by an edit. It measures the
// saved export and prints what the measurement implies, the way a real night
// desk decides how to run a plate: a wide crop gets a banner, a tight crop
// gets a column, a dark plate gets a heavier press note.
//
// Everything here is derived from two disclosed numbers - the export's aspect
// ratio, and its mean luminance measured against the untouched plate's own
// baseline - and both are shown to the visitor in the export ledger. No
// inference is made about subject, quality, or intent.
//
// Tone is deliberately relative. Every Cala Verda plate is a night scene with
// a baseline luminance between 0.11 and 0.37, so an absolute threshold would
// only ever restate that the artwork is dark. Comparing against the plate the
// visitor started from means the tone reports what the visitor actually did.

export type PressPlay = 'banner' | 'lead' | 'column';
export type PressTone = 'night' | 'even' | 'bleached';

export type PressRead = {
  play: PressPlay;
  playLabel: string;
  playNote: string;
  tone: PressTone;
  toneLabel: string;
  aspect: number;
  luminance: number | null;
  /** Export luminance divided by the untouched plate's baseline. */
  exposure: number | null;
};

/** The untouched field plates are all 1536 x 1024. */
export const SOURCE_ASPECT = 1536 / 1024;

const PLAYS: Record<PressPlay, { playLabel: string; playNote: string }> = {
  banner: {
    playLabel: 'RUN AS BANNER',
    playNote: 'You cut it wide, so the desk runs it across the top of the page.',
  },
  lead: {
    playLabel: 'RUN AS LEAD',
    playNote: 'You kept the full field of view, so it runs as the night lead.',
  },
  column: {
    playLabel: 'RUN AS COLUMN',
    playNote: 'You cut in close, so the desk runs it tall and lets the deck carry the rest.',
  },
};

const TONES: Record<PressTone, string> = {
  night: 'PRESSED DARK',
  even: 'STRAIGHT PRESS',
  bleached: 'PUSHED FOR DETAIL',
};

// Bands are calibrated against the crop ratios the editor actually offers.
// The untouched plate is 1.50:1 and must read as a straight lead; 16:9
// (1.78:1) is the commonest wide cut and has to earn the banner.
export const BANNER_ASPECT = 1.7;
export const COLUMN_ASPECT = 1.2;

export function classifyPlay(aspect: number): PressPlay {
  if (!Number.isFinite(aspect) || aspect <= 0) return 'lead';
  if (aspect >= BANNER_ASPECT) return 'banner';
  if (aspect <= COLUMN_ASPECT) return 'column';
  return 'lead';
}

// Relative exposure bands. A visitor has to move the plate meaningfully off
// its own baseline before the desk changes its press note.
export const DARKER_EXPOSURE = 0.82;
export const BRIGHTER_EXPOSURE = 1.22;

export function classifyTone(exposure: number | null): PressTone {
  if (exposure === null || !Number.isFinite(exposure) || exposure <= 0) return 'even';
  if (exposure < DARKER_EXPOSURE) return 'night';
  if (exposure > BRIGHTER_EXPOSURE) return 'bleached';
  return 'even';
}

export function readPress(
  width: number | null,
  height: number | null,
  luminance: number | null,
  baseLuminance: number,
): PressRead {
  const aspect = width && height ? width / height : SOURCE_ASPECT;
  const exposure = luminance !== null && baseLuminance > 0 ? luminance / baseLuminance : null;
  const play = classifyPlay(aspect);
  const tone = classifyTone(exposure);

  return {
    play,
    ...PLAYS[play],
    tone,
    toneLabel: TONES[tone],
    aspect,
    luminance,
    exposure,
  };
}

/** The one-line measurement receipt shown beside the printed plate. */
export function pressLedgerLine(read: PressRead): string {
  const ratio = `${read.aspect.toFixed(2)}:1`;
  const luma = read.luminance === null ? 'LUMA N/A' : `LUMA ${read.luminance.toFixed(2)}`;
  const exposure = read.exposure === null ? 'VS PLATE N/A' : `VS PLATE ${read.exposure.toFixed(2)}×`;
  return `MEASURED ${ratio} · ${luma} · ${exposure} · ${read.toneLabel}`;
}

/**
 * Mean relative luminance of a decoded export, sampled on a small offscreen
 * canvas so the measurement costs the same for any export size. Returns null
 * when the browser will not give us pixels, in which case the press falls
 * back to a straight run.
 */
export async function measureLuminance(blob: Blob): Promise<number | null> {
  if (typeof document === 'undefined' || !('createImageBitmap' in globalThis)) return null;

  let bitmap: ImageBitmap | null = null;

  try {
    bitmap = await createImageBitmap(blob);
    const size = 48;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;

    context.drawImage(bitmap, 0, 0, size, size);
    const { data } = context.getImageData(0, 0, size, size);
    let total = 0;
    let counted = 0;

    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3] / 255;
      if (alpha === 0) continue;
      // Rec. 709 relative luminance, weighted by coverage.
      const value = (0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2]) / 255;
      total += value * alpha;
      counted += alpha;
    }

    return counted === 0 ? null : total / counted;
  } catch {
    return null;
  } finally {
    bitmap?.close();
  }
}
