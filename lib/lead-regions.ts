// Where each lead actually lives in its plate.
//
// Locking an angle is a claim about one thing in the photograph. These are
// the authored bounding boxes for those things, in normalized coordinates
// against the untouched 1536 x 1024 plate, read off the artwork by hand.
//
// They exist so the desk can measure whether the visitor's edit landed on
// the subject they said they would prove, instead of only measuring the
// shape of the crop. Nothing here interprets the edit - see lead-proof.ts
// for exactly what is measured and what is claimed about it.

export type LeadRegion = {
  /** Left edge, 0-1 of plate width. */
  x: number;
  /** Top edge, 0-1 of plate height. */
  y: number;
  /** Width, 0-1 of plate width. */
  width: number;
  /** Height, 0-1 of plate height. */
  height: number;
  /** What the region contains, in the desk's own words. */
  subject: string;
};

/** Keyed by `${assignmentId}:${angleId}`. */
export const LEAD_REGIONS: Record<string, LeadRegion> = {
  'wake-tax:expose-launch': {
    x: 0.53,
    y: 0.47,
    width: 0.23,
    height: 0.21,
    subject: 'the pleasure launch and its broken wake',
  },
  'wake-tax:protect-crew': {
    x: 0.57,
    y: 0.28,
    width: 0.22,
    height: 0.22,
    subject: 'the ferry holding its lane',
  },
  'room-08:show-witness': {
    x: 0.59,
    y: 0.27,
    width: 0.27,
    height: 0.65,
    subject: 'the witness on the balcony',
  },
  'room-08:hide-witness': {
    x: 0.85,
    y: 0.32,
    width: 0.14,
    height: 0.35,
    subject: 'the reflection in the doorway',
  },
  'after-rain:publish-mask': {
    x: 0.15,
    y: 0.49,
    width: 0.2,
    height: 0.2,
    subject: 'the silver carnival mask',
  },
  'after-rain:follow-courier': {
    x: 0.65,
    y: 0.37,
    width: 0.15,
    height: 0.21,
    subject: 'the courier on the flooded road',
  },
  'undertow:print-handoff': {
    x: 0.23,
    y: 0.35,
    width: 0.27,
    height: 0.43,
    subject: 'the wet sleeve and the falling phone',
  },
  'undertow:follow-tender': {
    x: 0.44,
    y: 0.29,
    width: 0.32,
    height: 0.31,
    subject: 'the watcher and the tender together',
  },
  'off-the-meter:tag-driver': {
    x: 0.65,
    y: 0.3,
    width: 0.17,
    height: 0.29,
    subject: 'the driver against the ferry lights',
  },
  'off-the-meter:map-route': {
    x: 0.15,
    y: 0.27,
    width: 0.33,
    height: 0.29,
    subject: 'the empty shuttle and its running meter',
  },
};

export function leadRegion(assignmentId: string, angleId: string): LeadRegion | null {
  return LEAD_REGIONS[`${assignmentId}:${angleId}`] ?? null;
}
