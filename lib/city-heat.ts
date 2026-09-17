// CITY HEAT: what the city remembers about you between visits.
//
// Saltline used to reset on refresh. A judge who played twice got the same
// night twice. This module is the night desk's memory: the issue wall, the
// heat the desk has drawn, which leads and which measured moves the visitor
// keeps leaning on, and every time the paper has contradicted itself in
// print.
//
// Two rules hold this file together.
//
// 1. Everything here is pure. No clock, no crypto, no DOM. Ids and filing
//    times are supplied by the caller, so the same inputs always produce the
//    same state and the whole system is testable with `node --test`.
//    The only browser contact is through the small DeskStorage seam at the
//    bottom, which takes an injected storage object and swallows every
//    failure - a private window is a valid way to read a newspaper.
//
// 2. Heat is never an opinion about the edit. It is charged for facts the
//    desk already measured and already discloses: a dispatch was filed, the
//    same lead was locked again, the same measured move was used again, or
//    the paper printed both sides of the same case. The charge is itemised
//    and shown to the visitor in the standing sheet.
//
// Heat is deliberately not a wanted level, a star row, or a police meter.
// It is an ink gauge on a newspaper that is attracting the wrong kind of
// attention, and it escalates the way a newsroom does: a quiet wire, a
// switchboard that starts ringing, a law firm at the door, an edition the
// desk is told to hold.

import type { LeadProof } from './lead-proof.ts';
import type { PressRead } from './press-read.ts';

// ---------------------------------------------------------------------------
// Storage contract
// ---------------------------------------------------------------------------

/** The single versioned key. A schema change gets a new suffix, never a migration. */
export const DESK_KEY = 'saltline.desk.v1';

/** Bumped only alongside DESK_KEY. A mismatch is discarded, not repaired. */
export const DESK_VERSION = 1;

/** Records kept on the wall. Older ones fall off the bottom of the spike. */
export const MAX_PLATES = 24;

/**
 * How many saved exports keep their pixels in storage.
 *
 * A flattened 1536 x 1024 export is 250 KB to 2 MB as a base64 data URL and
 * the whole origin gets about 5 MB, so keeping every negative would blow the
 * quota on the fourth or fifth plate and take the metadata with it. The
 * archive box holds the four most recent negatives; every older record keeps
 * its full ledger line and says plainly that its plate is no longer on file.
 */
export const IMAGE_KEEP = 4;

// ---------------------------------------------------------------------------
// The record of one printed dispatch
// ---------------------------------------------------------------------------

export type PlateRecord = {
  id: string;
  assignmentId: string;
  angleId: string;
  /** The exact saved export, or null once it has fallen out of the archive box. */
  image: string | null;
  issue: string;
  createdAt: string;
  angleLabel: string;
  angleOutcome: string;
  angleStamp: string;
  closingLead: string;
  closingEmphasis: string;
  closingDeck: string;
  plateCode: string;
  byteSize: number;
  mimeType: string;
  width: number | null;
  height: number | null;
  press: PressRead;
  lead: LeadProof;
  /** Set when a later dispatch printed the opposing angle on the same case. */
  contradicted: boolean;
  /** Set when the desk was told to hold the edition and this plate was pulled. */
  spiked: boolean;
};

export type DeskState = {
  version: number;
  /** 0 and up. Uncapped; the top tier simply stays the top tier. */
  heat: number;
  /** Total dispatches filed across every visit, including ones off the wall. */
  filed: number;
  /** `${assignmentId}:${angleId}` to times locked. */
  leadUses: Record<string, number>;
  /** Measured-move key to times the desk has run it. See TECHNIQUES. */
  techniqueUses: Record<string, number>;
  /** Newest first. */
  plates: PlateRecord[];
  /** Ids of the cases the paper has contradicted itself on, oldest first. */
  contradictions: string[];
  /** The desk's own words about the most recent filing. Newest first. */
  notices: string[];
};

export function emptyDesk(): DeskState {
  return {
    version: DESK_VERSION,
    heat: 0,
    filed: 0,
    leadUses: {},
    techniqueUses: {},
    plates: [],
    contradictions: [],
    notices: [],
  };
}

// ---------------------------------------------------------------------------
// Measured moves
// ---------------------------------------------------------------------------

// The desk cannot see which buttons were pressed - React Image Editor does
// not report that, and guessing would be exactly the kind of claim this
// project refuses to make elsewhere. So a "move" here is one of the three
// things Saltline already measures about the saved export and already prints
// in the ledger: how the plate was cut, how it was graded, and whether the
// marks landed on the locked lead. Reusing a move means the measurement came
// back the same, which is a fact, and the copy says so in those terms.

export const TECHNIQUES: Record<string, string> = {
  'cut:banner': 'the wide banner cut',
  'cut:lead': 'the full-frame lead',
  'cut:column': 'the tight column cut',
  'grade:night': 'pressing the plate dark',
  'grade:even': 'a straight press',
  'grade:bleached': 'pushing the plate for detail',
  'mark:on-lead': 'marks straight on the locked lead',
  'mark:worked-wide': 'working the whole frame',
  'mark:lead-untouched': 'leaving the locked lead alone',
  'mark:recropped': 'recutting the frame instead of marking it',
  'mark:unmeasured': 'an unmeasurable save',
};

export function techniqueLabel(key: string): string {
  return TECHNIQUES[key] ?? 'the same move';
}

/**
 * The three measured moves a filing used, derived only from readings the
 * visitor can already see in the export ledger.
 */
export function techniquesOf(press: PressRead, lead: LeadProof): string[] {
  return [`cut:${press.play}`, `grade:${press.tone}`, `mark:${lead.verdict}`];
}

// ---------------------------------------------------------------------------
// The charge
// ---------------------------------------------------------------------------

/** Every dispatch costs the desk something. */
export const BASE_CHARGE = 8;

/** Relocking a lead you already printed: 2nd time, 3rd time, and on. */
export function repeatLeadCharge(priorUses: number): number {
  return priorUses <= 0 ? 0 : 5 + (priorUses - 1) * 3;
}

/** Running the same measured move again: 2nd time, 3rd time, and on. */
export function repeatTechniqueCharge(priorUses: number): number {
  return priorUses <= 0 ? 0 : 3 + (priorUses - 1) * 2;
}

/**
 * Printing the opposing angle on a case you already printed.
 *
 * This is the sharpest thing the desk can charge for and it is unique to
 * Saltline: every case here has two defensible truths, so printing both is a
 * newspaper contradicting itself in print, under its own masthead, twice.
 */
export const CONTRADICTION_CHARGE = 18;

export type HeatCharge = {
  base: number;
  repeatLead: number;
  repeatTechnique: number;
  contradiction: number;
  total: number;
  /** Which measured moves were repeats, with the count before this filing. */
  repeats: Array<{ key: string; label: string; priorUses: number; charge: number }>;
  /** The lead was already printed this many times before this filing. */
  leadPriorUses: number;
  /** Ids of earlier plates on this case that carry the opposing angle. */
  contradicts: string[];
  /** The desk's own words, newest first. */
  notices: string[];
};

export type FilingInput = {
  assignmentId: string;
  angleId: string;
  /** For the contradiction line. */
  caseTitle: string;
  angleLabel: string;
  techniques: string[];
};

/**
 * Ids of plates already on the wall that printed a different angle on this
 * same case. Every case has exactly two defensible angles, so a different
 * angle on the same case is the opposing one.
 */
export function findContradictions(
  plates: PlateRecord[],
  assignmentId: string,
  angleId: string,
): string[] {
  return plates
    .filter((plate) => plate.assignmentId === assignmentId && plate.angleId !== angleId)
    .map((plate) => plate.id);
}

/**
 * What this filing costs, itemised. Pure: reads the state, changes nothing.
 */
export function chargeFiling(state: DeskState, input: FilingInput): HeatCharge {
  const leadKey = `${input.assignmentId}:${input.angleId}`;
  const leadPriorUses = state.leadUses[leadKey] ?? 0;
  const repeatLead = repeatLeadCharge(leadPriorUses);

  const repeats: HeatCharge['repeats'] = [];
  let repeatTechnique = 0;

  for (const key of input.techniques) {
    const priorUses = state.techniqueUses[key] ?? 0;
    const charge = repeatTechniqueCharge(priorUses);
    if (charge > 0) {
      repeatTechnique += charge;
      repeats.push({ key, label: techniqueLabel(key), priorUses, charge });
    }
  }

  const contradicts = findContradictions(state.plates, input.assignmentId, input.angleId);
  const contradiction = contradicts.length > 0 ? CONTRADICTION_CHARGE : 0;

  const notices: string[] = [];

  if (contradiction > 0) {
    notices.push(
      `The paper has now printed both sides of ${input.caseTitle}. Tonight's edition contradicts itself, over the same masthead, in the same hour.`,
    );
  }

  if (repeats.length > 0) {
    const worst = repeats.reduce((a, b) => (b.priorUses > a.priorUses ? b : a));
    const runs = worst.priorUses + 1;
    notices.push(
      `The desk has run ${countWord(runs)} ${runs === 1 ? 'plate' : 'plates'} off ${worst.label}. Someone has noticed.`,
    );
  }

  if (repeatLead > 0) {
    notices.push(
      `${input.angleLabel} is on the wall ${countWord(leadPriorUses)} ${leadPriorUses === 1 ? 'time' : 'times'} already. A lead that keeps coming back reads like an agenda.`,
    );
  }

  return {
    base: BASE_CHARGE,
    repeatLead,
    repeatTechnique,
    contradiction,
    total: BASE_CHARGE + repeatLead + repeatTechnique + contradiction,
    repeats,
    leadPriorUses,
    contradicts,
    notices,
  };
}

const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

function countWord(value: number): string {
  return COUNT_WORDS[value] ?? String(value);
}

// ---------------------------------------------------------------------------
// Tiers
// ---------------------------------------------------------------------------

export type HeatTierId = 'quiet' | 'noticed' | 'lawyers' | 'held';

export type HeatTier = {
  id: HeatTierId;
  /** Lowest heat that reaches this tier. */
  floor: number;
  /** Name in the topbar and the standing sheet. */
  label: string;
  /** Replaces the static masthead strip. */
  masthead: string;
  /** One line in the desk's voice, shown on the briefing and the wall. */
  deskLine: string;
  /** Appended to the closing frame. */
  closingLine: string;
  /** Pinned to the issue wall from the lawyers tier up. */
  notice: { from: string; body: string } | null;
  /** True once the desk is told to hold the edition and a plate gets spiked. */
  holds: boolean;
};

export const HEAT_TIERS: HeatTier[] = [
  {
    id: 'quiet',
    floor: 0,
    label: 'WIRE QUIET',
    masthead: 'NO ACCOUNTS. NO ALIBIS.',
    deskLine: 'The wire is quiet. Nobody downstairs has finished reading tonight yet.',
    closingLine: 'Nobody has called about it. That is not the same as nobody reading it.',
    notice: null,
    holds: false,
  },
  {
    id: 'noticed',
    floor: 22,
    label: 'SWITCHBOARD WARM',
    masthead: 'SWITCHBOARD: TWO CALLS, NO NAMES.',
    deskLine:
      'The switchboard rang twice and hung up twice. The night porter says a car has been idling across from the loading door since the second ring.',
    closingLine: 'Somewhere in Cala Verda, somebody is reading this edition line by line.',
    notice: null,
    holds: false,
  },
  {
    id: 'lawyers',
    floor: 48,
    label: 'LETTERS ARRIVING',
    masthead: 'THREE LETTERS BEFORE DAWN. NONE OF THEM FRIENDLY.',
    deskLine:
      'Three letters came up in the service lift before dawn. The desk has read one of them and pinned it to the wall so the rest of us know what we are printing into.',
    closingLine: 'The letters will keep coming. The edition went out anyway.',
    notice: {
      from: 'HALLOW, PRINE & DESCHAMP — HARBOUR COUNSEL, CALA VERDA',
      body:
        'NOTICE TO THE PUBLISHER. Our clients hold that tonight’s plates were obtained in a manner they intend to characterise later. You are invited to withdraw the edition, retain every negative, and expect us at the loading door at a civil hour. This notice is itself not for publication. It is pinned here anyway.',
    },
    holds: false,
  },
  {
    id: 'held',
    floor: 78,
    label: 'EDITION HELD',
    masthead: 'HOLD THE EDITION. THE ORDER CAME FROM UPSTAIRS.',
    deskLine:
      'The edition is being held. An order came down from a floor nobody on this desk has ever visited, and one plate has already been pulled off the wall and spiked.',
    closingLine: 'The press is stopped. What you already printed is still out there, and it still has your cut on it.',
    notice: {
      from: 'OFFICE OF THE PUBLISHER — INTERNAL, NOT FOR THE FLOOR',
      body:
        'HOLD THE EDITION. No further plates go to the stone tonight. The desk will surrender its running order, and the spiked plate stays spiked. Whoever is still filing at this hour: stop, or stop being on the masthead.',
    },
    holds: true,
  },
];

export function tierAt(heat: number): HeatTier {
  const safe = Number.isFinite(heat) ? Math.max(0, heat) : 0;
  let tier = HEAT_TIERS[0];
  for (const candidate of HEAT_TIERS) {
    if (safe >= candidate.floor) tier = candidate;
  }
  return tier;
}

/**
 * How far through the current tier the heat has travelled, 0-1. Drives the
 * width of the ink gauge on the wall and nothing else.
 */
export function tierProgress(heat: number): number {
  const safe = Number.isFinite(heat) ? Math.max(0, heat) : 0;
  const index = HEAT_TIERS.findIndex((tier) => tier.id === tierAt(safe).id);
  const tier = HEAT_TIERS[index];
  const next = HEAT_TIERS[index + 1];
  if (!next) return 1;
  const span = next.floor - tier.floor;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (safe - tier.floor) / span));
}

// ---------------------------------------------------------------------------
// Applying a filing
// ---------------------------------------------------------------------------

/**
 * The plate the desk pulls when it is told to hold the edition: the oldest
 * record still standing. Deterministic, so a reload spikes the same one.
 */
export function spikeTarget(plates: PlateRecord[]): string | null {
  for (let index = plates.length - 1; index >= 0; index -= 1) {
    if (!plates[index].spiked) return plates[index].id;
  }
  return null;
}

export type FilingResult = {
  state: DeskState;
  charge: HeatCharge;
  /** The tier before this filing, so the app can announce a crossing. */
  previousTier: HeatTier;
  tier: HeatTier;
  /** Id of the plate the hold order pulled, if any. */
  spiked: string | null;
};

/**
 * Files one dispatch: pins it to the wall, charges the heat, flags both
 * sides of a contradiction, and spikes a plate if the desk has been told to
 * hold the edition. Returns a new state; the input is not touched.
 */
export function applyFiling(state: DeskState, record: PlateRecord, input: FilingInput): FilingResult {
  const charge = chargeFiling(state, input);
  const previousTier = tierAt(state.heat);
  const heat = Math.max(0, state.heat + charge.total);
  const tier = tierAt(heat);
  const contradicted = new Set(charge.contradicts);

  const leadKey = `${input.assignmentId}:${input.angleId}`;
  const leadUses = { ...state.leadUses, [leadKey]: (state.leadUses[leadKey] ?? 0) + 1 };
  const techniqueUses = { ...state.techniqueUses };
  for (const key of input.techniques) {
    techniqueUses[key] = (techniqueUses[key] ?? 0) + 1;
  }

  const plates: PlateRecord[] = [
    { ...record, contradicted: contradicted.size > 0, spiked: false },
    ...state.plates.map((plate) =>
      contradicted.has(plate.id) ? { ...plate, contradicted: true } : plate,
    ),
  ].slice(0, MAX_PLATES);

  let spiked: string | null = null;
  if (tier.holds) {
    // Never spike the plate the visitor is looking at right now; the desk
    // pulls something already on the wall.
    spiked = spikeTarget(plates.slice(1));
    if (spiked) {
      const id = spiked;
      for (let index = 0; index < plates.length; index += 1) {
        if (plates[index].id === id) plates[index] = { ...plates[index], spiked: true };
      }
    }
  }

  const contradictions = contradicted.size > 0 && !state.contradictions.includes(input.assignmentId)
    ? [...state.contradictions, input.assignmentId]
    : state.contradictions;

  const notices = [...charge.notices];
  if (spiked) {
    notices.unshift('A plate has been pulled off the wall and spiked. The desk did not ask which one you wanted to keep.');
  }
  if (previousTier.id !== tier.id) {
    notices.unshift(tier.deskLine);
  }

  return {
    state: {
      version: DESK_VERSION,
      heat,
      filed: state.filed + 1,
      leadUses,
      techniqueUses,
      plates,
      contradictions,
      notices: notices.slice(0, 6),
    },
    charge,
    previousTier,
    tier,
    spiked,
  };
}

/** Cases the paper has printed both sides of, with both records named. */
export function contradictionPairs(plates: PlateRecord[]): Array<{
  assignmentId: string;
  angles: Array<{ id: string; angleLabel: string; issue: string; createdAt: string }>;
}> {
  const byCase = new Map<string, PlateRecord[]>();
  for (const plate of plates) {
    const bucket = byCase.get(plate.assignmentId);
    if (bucket) bucket.push(plate);
    else byCase.set(plate.assignmentId, [plate]);
  }

  const pairs: Array<{ assignmentId: string; angles: Array<{ id: string; angleLabel: string; issue: string; createdAt: string }> }> = [];
  for (const [assignmentId, records] of byCase) {
    const angleIds = new Set(records.map((record) => record.angleId));
    if (angleIds.size < 2) continue;
    pairs.push({
      assignmentId,
      angles: records.map((record) => ({
        id: record.id,
        angleLabel: record.angleLabel,
        issue: record.issue,
        createdAt: record.createdAt,
      })),
    });
  }

  return pairs;
}

/** The desk's standing, in its own words, for the standing sheet. */
export function standingSummary(state: DeskState): string {
  if (state.filed === 0) {
    return 'Nothing has gone to print yet. The city has no reason to know your name.';
  }

  const contradictions = state.contradictions.length;
  const plates = `${countWord(state.filed)} ${state.filed === 1 ? 'plate' : 'plates'}`;

  if (contradictions > 0) {
    return `${capitalise(plates)} filed, and on ${countWord(contradictions)} ${contradictions === 1 ? 'case' : 'cases'} this paper has printed both sides. That is the part the city will quote back at you.`;
  }

  return `${capitalise(plates)} filed tonight, one truth each. The desk is holding a consistent line, which is its own kind of exposure.`;
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// ---------------------------------------------------------------------------
// Serialising
// ---------------------------------------------------------------------------

function asRecordOfCounts(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, number> = {};
  for (const [key, count] of Object.entries(value as Record<string, unknown>)) {
    if (typeof count === 'number' && Number.isFinite(count) && count > 0) {
      out[key] = Math.floor(count);
    }
  }
  return out;
}

function asPlate(value: unknown): PlateRecord | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const required = ['id', 'assignmentId', 'angleId', 'issue', 'createdAt', 'angleLabel', 'plateCode'] as const;
  for (const field of required) {
    if (typeof raw[field] !== 'string' || !raw[field]) return null;
  }
  if (!raw.press || typeof raw.press !== 'object') return null;
  if (!raw.lead || typeof raw.lead !== 'object') return null;

  const image = typeof raw.image === 'string' && raw.image.startsWith('data:image/') ? raw.image : null;

  return {
    id: raw.id as string,
    assignmentId: raw.assignmentId as string,
    angleId: raw.angleId as string,
    image,
    issue: raw.issue as string,
    createdAt: raw.createdAt as string,
    angleLabel: raw.angleLabel as string,
    angleOutcome: typeof raw.angleOutcome === 'string' ? raw.angleOutcome : '',
    angleStamp: typeof raw.angleStamp === 'string' ? raw.angleStamp : '',
    closingLead: typeof raw.closingLead === 'string' ? raw.closingLead : '',
    closingEmphasis: typeof raw.closingEmphasis === 'string' ? raw.closingEmphasis : '',
    closingDeck: typeof raw.closingDeck === 'string' ? raw.closingDeck : '',
    plateCode: raw.plateCode as string,
    byteSize: typeof raw.byteSize === 'number' && Number.isFinite(raw.byteSize) ? raw.byteSize : 0,
    mimeType: typeof raw.mimeType === 'string' ? raw.mimeType : 'image/png',
    width: typeof raw.width === 'number' && Number.isFinite(raw.width) ? raw.width : null,
    height: typeof raw.height === 'number' && Number.isFinite(raw.height) ? raw.height : null,
    press: raw.press as PressRead,
    lead: raw.lead as LeadProof,
    contradicted: raw.contradicted === true,
    spiked: raw.spiked === true,
  };
}

/**
 * Reads a stored desk. Returns null for anything that is not a desk of this
 * exact version - absent, empty, truncated, an array, a number, a future
 * schema. A corrupt night is discarded, never patched into a half state.
 */
export function parseDesk(raw: string | null | undefined): DeskState | null {
  if (typeof raw !== 'string' || raw.length === 0) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const value = parsed as Record<string, unknown>;
  if (value.version !== DESK_VERSION) return null;

  const plates = Array.isArray(value.plates)
    ? value.plates.map(asPlate).filter((plate): plate is PlateRecord => plate !== null).slice(0, MAX_PLATES)
    : [];

  const heat = typeof value.heat === 'number' && Number.isFinite(value.heat) ? Math.max(0, Math.floor(value.heat)) : 0;
  const filed = typeof value.filed === 'number' && Number.isFinite(value.filed) ? Math.max(0, Math.floor(value.filed)) : plates.length;

  const contradictions = Array.isArray(value.contradictions)
    ? value.contradictions.filter((id): id is string => typeof id === 'string')
    : [];

  const notices = Array.isArray(value.notices)
    ? value.notices.filter((line): line is string => typeof line === 'string').slice(0, 6)
    : [];

  return {
    version: DESK_VERSION,
    heat,
    filed: Math.max(filed, plates.length),
    leadUses: asRecordOfCounts(value.leadUses),
    techniqueUses: asRecordOfCounts(value.techniqueUses),
    plates,
    contradictions,
    notices,
  };
}

/**
 * The state as it will be stored, with `keepImages` of the newest negatives
 * still carrying their pixels. Pure, so the quota ladder in writeDesk is a
 * loop over this rather than a special case.
 */
export function deskForStorage(state: DeskState, keepImages = IMAGE_KEEP): DeskState {
  return {
    ...state,
    plates: state.plates.slice(0, MAX_PLATES).map((plate, index) => ({
      ...plate,
      image: index < keepImages ? plate.image : null,
    })),
  };
}

export function serializeDesk(state: DeskState, keepImages = IMAGE_KEEP): string {
  return JSON.stringify(deskForStorage(state, keepImages));
}

// ---------------------------------------------------------------------------
// The storage seam
// ---------------------------------------------------------------------------

export type DeskStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

/**
 * The browser's localStorage, or null when it cannot be touched at all.
 *
 * Reading `window.localStorage` is itself a throwing operation in a locked
 * down browser, which is why this is a function with a try/catch rather than
 * a reference, and why every caller treats null as an ordinary answer.
 */
export function browserDeskStorage(): DeskStorage | null {
  try {
    if (typeof window === 'undefined') return null;
    const storage = window.localStorage;
    if (!storage) return null;
    // Blocked site data can present an object that throws only on use.
    const probe = `${DESK_KEY}.probe`;
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

/** The stored desk, or a fresh one. Never throws. */
export function readDesk(storage: DeskStorage | null): DeskState {
  if (!storage) return emptyDesk();
  try {
    return parseDesk(storage.getItem(DESK_KEY)) ?? emptyDesk();
  } catch {
    return emptyDesk();
  }
}

export type WriteOutcome = 'stored' | 'trimmed' | 'metadata-only' | 'unavailable';

/**
 * Persists the desk, giving up negatives before it gives up the record.
 *
 * The ladder is: everything, then fewer negatives, then none. A quota error
 * on a 2 MB export must not cost the visitor their issue wall, and a browser
 * that refuses storage outright is answered with 'unavailable' rather than an
 * exception - the session simply lives in memory for the rest of the night.
 */
export function writeDesk(state: DeskState, storage: DeskStorage | null): WriteOutcome {
  if (!storage) return 'unavailable';

  const ladder = [IMAGE_KEEP, 2, 1, 0];
  for (let step = 0; step < ladder.length; step += 1) {
    const keep = ladder[step];
    try {
      storage.setItem(DESK_KEY, serializeDesk(state, keep));
      if (keep === 0) return state.plates.length > 0 ? 'metadata-only' : 'stored';
      return step === 0 ? 'stored' : 'trimmed';
    } catch {
      // Try again with fewer negatives in the box.
    }
  }

  return 'unavailable';
}

/** Pulps the stored night. Returns false only if the browser refused. */
export function clearDesk(storage: DeskStorage | null): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(DESK_KEY);
    return true;
  } catch {
    return false;
  }
}
