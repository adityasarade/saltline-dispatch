// The live sample.
//
// Everything Saltline measures about a plate used to arrive on Save, which
// meant the screen a visitor spends most of their time on - the editor -
// never answered back. This takes the same two readings against the editor's
// current canvas so the desk reacts while the work is happening.
//
// Three rules, and they are the whole reason this file is small.
//
// 1. No new measurement logic. The lead comes from lead-proof.ts through its
//    data-URL seam and the layout from press-read.ts's own classifier, so the
//    live card and the printed verdict cannot disagree about a threshold.
// 2. It is a *sample*, and the card says so. `getImage()` is a snapshot, not
//    the transactional export, and the reading that goes on the record is
//    still the one taken from the Save result.
// 3. Anything it cannot measure honestly, it declines to report. A source URL
//    instead of an export, a browser that will not release pixels, a decode
//    failure: all of them return null and the card disappears.

import { classifyLead, blobFromDataUrl, measureLead, type LeadVerdict } from './lead-proof.ts';
import { classifyPlay, measureGeometry, type PressPlay } from './press-read.ts';
import type { LeadRegion } from './lead-regions.ts';

/**
 * How often the editor is sampled, in milliseconds.
 *
 * Gated on `hasChanges()` and on the snapshot actually differing from the
 * last one measured, so an untouched plate costs one cheap call per tick and
 * nothing else. 800ms is slow enough that a 1536 x 1024 decode plus two
 * 256px rasterizations never queue up behind each other, and fast enough
 * that the card flips inside one stroke.
 */
export const LIVE_SAMPLE_INTERVAL = 800;

export type LiveRead = {
  verdict: LeadVerdict;
  /** Compact desk label for the lead state, deliberately shorter than print. */
  leadLabel: string;
  /** One clause of context, in the desk's voice. */
  leadNote: string;
  play: PressPlay;
  playLabel: string;
  aspect: number;
  subject: string | null;
};

const LIVE_LEAD: Record<LeadVerdict, { leadLabel: string; leadNote: string } | null> = {
  'on-lead': {
    leadLabel: 'ON THE LEAD',
    leadNote: 'The marks are sitting on what you locked.',
  },
  'worked-wide': {
    leadLabel: 'WORKING WIDE',
    leadNote: 'The whole frame is moving about as much as the lead is.',
  },
  'lead-untouched': {
    leadLabel: 'OFF THE LEAD',
    leadNote: 'Nothing has landed on what you locked yet.',
  },
  recropped: {
    leadLabel: 'FRAME RECUT',
    leadNote: 'A cut moves every pixel, so the desk will read the cut instead.',
  },
  // Nothing measurable came back, so the card says nothing at all.
  unmeasured: null,
};

const LIVE_PLAY: Record<PressPlay, string> = {
  banner: 'BANNER',
  lead: 'NIGHT LEAD',
  column: 'TALL COLUMN',
};

/**
 * Samples the editor's current canvas. Returns null whenever an honest
 * reading is not available.
 */
export async function sampleLive(
  plateUrl: string,
  dataUrl: string | null | undefined,
  region: LeadRegion | null,
): Promise<LiveRead | null> {
  const blob = await blobFromDataUrl(dataUrl);
  if (!blob) return null;

  const [geometry, measured] = await Promise.all([
    measureGeometry(blob),
    measureLead(plateUrl, blob, region),
  ]);

  if (!geometry) return null;

  const verdict = classifyLead(measured.insideChange, measured.outsideChange, measured.recropped);
  const lead = LIVE_LEAD[verdict];
  if (!lead) return null;

  const aspect = geometry.width / geometry.height;
  const play = classifyPlay(aspect);

  return {
    verdict,
    ...lead,
    play,
    playLabel: LIVE_PLAY[play],
    aspect,
    subject: region?.subject ?? null,
  };
}
