// Run with: node --test tests/city-heat.test.mjs
// Requires Node 22.18+ or 23+ for native TypeScript import stripping.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BASE_CHARGE,
  CONTRADICTION_CHARGE,
  DESK_KEY,
  DESK_VERSION,
  HEAT_TIERS,
  IMAGE_KEEP,
  MAX_PLATES,
  applyFiling,
  browserDeskStorage,
  chargeFiling,
  clearDesk,
  contradictionPairs,
  deskForStorage,
  emptyDesk,
  findContradictions,
  parseDesk,
  readDesk,
  repeatLeadCharge,
  repeatTechniqueCharge,
  serializeDesk,
  spikeTarget,
  standingSummary,
  techniqueLabel,
  techniquesOf,
  tierAt,
  tierProgress,
  writeDesk,
} from '../lib/city-heat.ts';
import { readPress } from '../lib/press-read.ts';
import { readLead } from '../lib/lead-proof.ts';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PRESS = readPress(1536, 1024, 0.16, 0.16);
const LEAD = readLead(0.3, 0.05, 'the pleasure launch');

function plate(overrides = {}) {
  return {
    id: 'wake-tax-1',
    assignmentId: 'wake-tax',
    angleId: 'expose-launch',
    image: 'data:image/png;base64,AAAA',
    issue: 'ISSUE 04.01',
    createdAt: '02:20',
    angleLabel: 'Expose the launch',
    angleOutcome: 'The ferry master clipped your plate to the manifest.',
    angleStamp: 'LAUNCH EXPOSED',
    closingLead: 'The wake reaches',
    closingEmphasis: 'the ledger first.',
    closingDeck: 'The club can rename the boat.',
    plateCode: 'SL-AABBCCDDEE',
    byteSize: 240_000,
    mimeType: 'image/png',
    width: 1536,
    height: 1024,
    press: PRESS,
    lead: LEAD,
    contradicted: false,
    spiked: false,
    ...overrides,
  };
}

function filing(overrides = {}) {
  return {
    assignmentId: 'wake-tax',
    angleId: 'expose-launch',
    caseTitle: 'Wake Tax',
    angleLabel: 'Expose the launch',
    techniques: techniquesOf(PRESS, LEAD),
    ...overrides,
  };
}

/** A localStorage stand-in, with an optional cap so the quota ladder is testable. */
function fakeStorage({ limit = Infinity, refuse = false } = {}) {
  const map = new Map();
  return {
    map,
    getItem(key) {
      if (refuse) throw new Error('site data blocked');
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      if (refuse) throw new Error('site data blocked');
      if (value.length > limit) throw new Error('QuotaExceededError');
      map.set(key, value);
    },
    removeItem(key) {
      if (refuse) throw new Error('site data blocked');
      map.delete(key);
    },
  };
}

// ---------------------------------------------------------------------------
// Tiers
// ---------------------------------------------------------------------------

test('a desk that has printed nothing sits in the quiet tier', () => {
  assert.equal(tierAt(0).id, 'quiet');
  assert.equal(tierAt(0).label, 'WIRE QUIET');
  assert.equal(emptyDesk().heat, 0);
  assert.equal(emptyDesk().version, DESK_VERSION);
});

test('there are four named tiers, each with its own visible copy', () => {
  assert.equal(HEAT_TIERS.length, 4);
  const ids = HEAT_TIERS.map((tier) => tier.id);
  assert.deepEqual(ids, ['quiet', 'noticed', 'lawyers', 'held']);

  const seen = new Set();
  for (const tier of HEAT_TIERS) {
    for (const field of ['label', 'masthead', 'deskLine', 'closingLine']) {
      assert.ok(tier[field].length > 0, `${tier.id} has no ${field}`);
      assert.ok(!seen.has(tier[field]), `${tier.id} reuses copy from an earlier tier`);
      seen.add(tier[field]);
    }
  }
});

test('the tier floors ascend and the top two tiers escalate visibly', () => {
  for (let index = 1; index < HEAT_TIERS.length; index += 1) {
    assert.ok(HEAT_TIERS[index].floor > HEAT_TIERS[index - 1].floor, 'floors must ascend');
  }
  assert.equal(HEAT_TIERS[0].notice, null);
  assert.equal(HEAT_TIERS[1].notice, null);
  assert.ok(HEAT_TIERS[2].notice, 'the lawyers tier pins a notice to the wall');
  assert.ok(HEAT_TIERS[3].notice, 'the held tier pins a notice to the wall');
  assert.equal(HEAT_TIERS[2].holds, false);
  assert.equal(HEAT_TIERS[3].holds, true);
});

test('tier boundaries are exact on both sides of every floor', () => {
  for (let index = 1; index < HEAT_TIERS.length; index += 1) {
    const tier = HEAT_TIERS[index];
    const below = HEAT_TIERS[index - 1];
    assert.equal(tierAt(tier.floor).id, tier.id, `${tier.floor} should reach ${tier.id}`);
    assert.equal(tierAt(tier.floor - 1).id, below.id, `${tier.floor - 1} should still be ${below.id}`);
  }
});

test('tier classification never throws on impossible heat', () => {
  for (const heat of [-1, -9999, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assert.ok(tierAt(heat).id);
  }
  // Negative and non-finite heat both fall back to the quiet desk rather
  // than escalating on a number that cannot have been earned.
  assert.equal(tierAt(-40).id, 'quiet');
  assert.equal(tierAt(Number.NaN).id, 'quiet');
  assert.equal(tierAt(Number.POSITIVE_INFINITY).id, 'quiet');
  // A real, very large heat still reads as the top tier.
  assert.equal(tierAt(9_999_999).id, 'held');
});

test('the gauge fills across a tier and pins at the top one', () => {
  assert.equal(tierProgress(0), 0);
  assert.equal(tierProgress(HEAT_TIERS[1].floor), 0);
  assert.ok(tierProgress(HEAT_TIERS[1].floor - 1) > 0.9);
  assert.equal(tierProgress(HEAT_TIERS[3].floor + 500), 1);
  assert.equal(tierProgress(Number.NaN), 0);
});

// ---------------------------------------------------------------------------
// Charging
// ---------------------------------------------------------------------------

test('a first dispatch costs only the base charge', () => {
  const charge = chargeFiling(emptyDesk(), filing());
  assert.equal(charge.base, BASE_CHARGE);
  assert.equal(charge.repeatLead, 0);
  assert.equal(charge.repeatTechnique, 0);
  assert.equal(charge.contradiction, 0);
  assert.equal(charge.total, BASE_CHARGE);
  assert.deepEqual(charge.repeats, []);
});

test('leaning on the same move costs more every time', () => {
  assert.equal(repeatTechniqueCharge(0), 0);
  assert.equal(repeatTechniqueCharge(1), 3);
  assert.equal(repeatTechniqueCharge(2), 5);
  assert.equal(repeatTechniqueCharge(3), 7);
  // Strictly increasing, so a third plate off one trick always costs more
  // than the second did.
  for (let uses = 1; uses < 8; uses += 1) {
    assert.ok(repeatTechniqueCharge(uses + 1) > repeatTechniqueCharge(uses));
  }
});

test('relocking a lead you already printed costs more every time', () => {
  assert.equal(repeatLeadCharge(0), 0);
  assert.equal(repeatLeadCharge(1), 5);
  assert.equal(repeatLeadCharge(2), 8);
  for (let uses = 1; uses < 8; uses += 1) {
    assert.ok(repeatLeadCharge(uses + 1) > repeatLeadCharge(uses));
  }
});

test('a repeated measured move is named in the desk\'s own voice', () => {
  const state = {
    ...emptyDesk(),
    techniqueUses: { 'cut:lead': 2, 'grade:even': 2, 'mark:on-lead': 2 },
  };
  const charge = chargeFiling(state, filing());

  assert.equal(charge.repeatTechnique, 5 * 3);
  assert.equal(charge.repeats.length, 3);
  assert.ok(charge.notices.some((line) => /run three plates off/.test(line)));
  assert.ok(charge.notices.some((line) => /Someone has noticed\./.test(line)));
});

test('every measured move the app can produce has a label', () => {
  for (const play of ['banner', 'lead', 'column']) {
    assert.notEqual(techniqueLabel(`cut:${play}`), 'the same move');
  }
  for (const tone of ['night', 'even', 'bleached']) {
    assert.notEqual(techniqueLabel(`grade:${tone}`), 'the same move');
  }
  for (const verdict of ['on-lead', 'worked-wide', 'lead-untouched', 'recropped', 'unmeasured']) {
    assert.notEqual(techniqueLabel(`mark:${verdict}`), 'the same move');
  }
  // An unknown key degrades to a generic phrase instead of printing undefined.
  assert.equal(techniqueLabel('cut:sideways'), 'the same move');
});

test('the measured moves come only from readings the visitor is already shown', () => {
  const wide = techniquesOf(readPress(1536, 640, 0.5, 0.5), readLead(0.01, 0.4, 'the ferry'));
  assert.deepEqual(wide, ['cut:banner', 'grade:even', 'mark:lead-untouched']);

  const tight = techniquesOf(readPress(900, 1200, 0.06, 0.16), readLead(null, null, 'the ferry', true));
  assert.deepEqual(tight, ['cut:column', 'grade:night', 'mark:recropped']);
});

// ---------------------------------------------------------------------------
// Contradiction
// ---------------------------------------------------------------------------

test('printing the opposing angle on the same case is detected', () => {
  const wall = [plate({ id: 'a', angleId: 'expose-launch' })];
  assert.deepEqual(findContradictions(wall, 'wake-tax', 'protect-crew'), ['a']);
});

test('reprinting the same angle on the same case is not a contradiction', () => {
  const wall = [plate({ id: 'a', angleId: 'expose-launch' })];
  assert.deepEqual(findContradictions(wall, 'wake-tax', 'expose-launch'), []);
});

test('an angle on a different case is not a contradiction', () => {
  const wall = [plate({ id: 'a', assignmentId: 'room-08', angleId: 'show-witness' })];
  assert.deepEqual(findContradictions(wall, 'wake-tax', 'protect-crew'), []);
});

test('a contradiction is charged, flagged on both plates, and named', () => {
  const first = applyFiling(emptyDesk(), plate({ id: 'a' }), filing());
  assert.equal(first.state.plates[0].contradicted, false);
  assert.deepEqual(first.state.contradictions, []);

  const second = applyFiling(
    first.state,
    plate({ id: 'b', angleId: 'protect-crew', angleLabel: 'Protect the ferry crew' }),
    filing({ angleId: 'protect-crew', angleLabel: 'Protect the ferry crew' }),
  );

  assert.equal(second.charge.contradiction, CONTRADICTION_CHARGE);
  assert.deepEqual(second.charge.contradicts, ['a']);
  // Both sides carry the flag: the wall shows the paper arguing with itself.
  assert.equal(second.state.plates[0].contradicted, true);
  assert.equal(second.state.plates[1].contradicted, true);
  assert.deepEqual(second.state.contradictions, ['wake-tax']);
  assert.ok(second.state.notices.some((line) => /printed both angles on Wake Tax/.test(line)));
});

test('the contradiction charge dwarfs a repeat, because it is the sharper failure', () => {
  assert.ok(CONTRADICTION_CHARGE > repeatTechniqueCharge(3) + repeatLeadCharge(1));
});

test('a contradicted case is listed once, with both of its angles named', () => {
  const wall = [
    plate({ id: 'b', angleId: 'protect-crew', angleLabel: 'Protect the ferry crew' }),
    plate({ id: 'a', angleId: 'expose-launch' }),
    plate({ id: 'c', assignmentId: 'room-08', angleId: 'show-witness' }),
  ];
  const pairs = contradictionPairs(wall);
  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].assignmentId, 'wake-tax');
  assert.deepEqual(pairs[0].angles.map((angle) => angle.id), ['b', 'a']);
});

// ---------------------------------------------------------------------------
// Filing and escalation
// ---------------------------------------------------------------------------

test('filing pins the plate, charges the heat, and counts the lead', () => {
  const result = applyFiling(emptyDesk(), plate(), filing());
  assert.equal(result.state.plates.length, 1);
  assert.equal(result.state.filed, 1);
  assert.equal(result.state.heat, BASE_CHARGE);
  assert.equal(result.state.leadUses['wake-tax:expose-launch'], 1);
  assert.equal(result.state.techniqueUses['cut:lead'], 1);
  assert.equal(result.tier.id, 'quiet');
  assert.equal(result.previousTier.id, 'quiet');
  assert.equal(result.spiked, null);
});

test('applyFiling never mutates the state it was handed', () => {
  const before = emptyDesk();
  const snapshot = JSON.stringify(before);
  applyFiling(before, plate(), filing());
  assert.equal(JSON.stringify(before), snapshot);
});

test('repeating the same work walks the desk up through the tiers', () => {
  let state = emptyDesk();
  const reached = [];

  for (let index = 0; index < 5; index += 1) {
    const result = applyFiling(state, plate({ id: `p${index}` }), filing());
    state = result.state;
    reached.push(result.tier.id);
  }

  // Same case, same angle, same measured moves, five times over: the charge
  // has to climb, and the visible tier has to climb with it.
  assert.deepEqual(reached, ['quiet', 'noticed', 'lawyers', 'held', 'held']);
  assert.ok(state.heat >= HEAT_TIERS[3].floor);
});

test('crossing into a tier puts that tier\'s line in the notices', () => {
  let state = { ...emptyDesk(), heat: HEAT_TIERS[1].floor - BASE_CHARGE };
  const result = applyFiling(state, plate(), filing());
  assert.equal(result.previousTier.id, 'quiet');
  assert.equal(result.tier.id, 'noticed');
  assert.equal(result.state.notices[0], HEAT_TIERS[1].deskLine);
});

test('the hold order spikes the oldest standing plate, not the new one', () => {
  const state = {
    ...emptyDesk(),
    heat: HEAT_TIERS[3].floor,
    filed: 2,
    plates: [plate({ id: 'newer', createdAt: '02:25' }), plate({ id: 'oldest', createdAt: '02:20' })],
  };

  const result = applyFiling(state, plate({ id: 'fresh' }), filing());
  assert.equal(result.tier.id, 'held');
  assert.equal(result.spiked, 'oldest');
  assert.equal(result.state.plates.find((item) => item.id === 'oldest').spiked, true);
  assert.equal(result.state.plates.find((item) => item.id === 'fresh').spiked, false);
  assert.ok(result.state.notices.some((line) => /pulled off the wall and spiked/.test(line)));
});

test('the spike target is deterministic and skips what is already spiked', () => {
  const wall = [plate({ id: 'c' }), plate({ id: 'b' }), plate({ id: 'a', spiked: true })];
  assert.equal(spikeTarget(wall), 'b');
  assert.equal(spikeTarget(wall), 'b');
  assert.equal(spikeTarget([]), null);
  assert.equal(spikeTarget([plate({ id: 'a', spiked: true })]), null);
});

test('the same filings in the same order always give the same desk', () => {
  const run = () => {
    let state = emptyDesk();
    for (const [index, angleId] of ['expose-launch', 'protect-crew', 'expose-launch'].entries()) {
      state = applyFiling(state, plate({ id: `p${index}`, angleId }), filing({ angleId })).state;
    }
    return state;
  };

  assert.deepEqual(run(), run());
  assert.equal(JSON.stringify(run()), JSON.stringify(run()));
});

test('the wall is capped, and the oldest records fall off it', () => {
  let state = emptyDesk();
  for (let index = 0; index < MAX_PLATES + 6; index += 1) {
    state = applyFiling(state, plate({ id: `p${index}` }), filing()).state;
  }
  assert.equal(state.plates.length, MAX_PLATES);
  assert.equal(state.plates[0].id, `p${MAX_PLATES + 5}`);
  // The count of everything ever filed survives the cap.
  assert.equal(state.filed, MAX_PLATES + 6);
});

test('the standing reads differently before, during and after a contradiction', () => {
  assert.match(standingSummary(emptyDesk()), /no reason to know your name/);

  const consistent = applyFiling(emptyDesk(), plate(), filing()).state;
  assert.match(standingSummary(consistent), /one truth each/);

  const contradicted = applyFiling(
    consistent,
    plate({ id: 'b', angleId: 'protect-crew' }),
    filing({ angleId: 'protect-crew' }),
  ).state;
  assert.match(standingSummary(contradicted), /two angles without explaining the change/);
});

// ---------------------------------------------------------------------------
// Serialising, and surviving bad stored data
// ---------------------------------------------------------------------------

test('a stored desk round-trips', () => {
  const state = applyFiling(emptyDesk(), plate(), filing()).state;
  const restored = parseDesk(serializeDesk(state));
  assert.deepEqual(restored, deskForStorage(state));
  assert.equal(restored.heat, state.heat);
  assert.equal(restored.plates[0].image, 'data:image/png;base64,AAAA');
});

test('only the newest negatives keep their pixels', () => {
  let state = emptyDesk();
  for (let index = 0; index < IMAGE_KEEP + 3; index += 1) {
    state = applyFiling(state, plate({ id: `p${index}` }), filing()).state;
  }

  const stored = deskForStorage(state);
  assert.equal(stored.plates.length, IMAGE_KEEP + 3);
  for (const [index, record] of stored.plates.entries()) {
    assert.equal(record.image === null, index >= IMAGE_KEEP, `plate ${index} image retention`);
    // The record itself always survives, pixels or no pixels.
    assert.ok(record.plateCode.length > 0);
  }
  // Trimming the negatives must not touch the live state.
  assert.equal(state.plates[IMAGE_KEEP].image, 'data:image/png;base64,AAAA');
});

test('absent, empty and corrupt stored data all read as no stored desk', () => {
  for (const raw of [
    null,
    undefined,
    '',
    '   ',
    '{',
    '[]',
    'null',
    'undefined',
    '42',
    '"a string"',
    '{"version":1',
    '{}',
    '{"version":"1"}',
    '{"version":0}',
  ]) {
    const parsed = parseDesk(raw);
    assert.ok(parsed === null, `${JSON.stringify(raw)} should not parse as a desk`);
  }
});

test('a desk written by a future schema is discarded, not migrated', () => {
  assert.equal(parseDesk(JSON.stringify({ version: DESK_VERSION + 1, heat: 90, plates: [] })), null);
});

test('a desk with junk fields is repaired to something safe', () => {
  const parsed = parseDesk(
    JSON.stringify({
      version: DESK_VERSION,
      heat: -50,
      filed: 'lots',
      leadUses: { 'wake-tax:expose-launch': 'two', 'room-08:show-witness': 3, bad: -1 },
      techniqueUses: 'nope',
      plates: [plate(), { id: 'broken' }, null, 7, plate({ id: 'ok2', press: null })],
      contradictions: ['wake-tax', 9, null],
      notices: ['a line', 12],
    }),
  );

  assert.ok(parsed);
  assert.equal(parsed.heat, 0);
  assert.deepEqual(parsed.leadUses, { 'room-08:show-witness': 3 });
  assert.deepEqual(parsed.techniqueUses, {});
  assert.equal(parsed.plates.length, 1);
  assert.deepEqual(parsed.contradictions, ['wake-tax']);
  assert.deepEqual(parsed.notices, ['a line']);
  // filed can never understate what is actually on the wall.
  assert.equal(parsed.filed, 1);
});

test('a stored image that is not a data URL is dropped, never rendered', () => {
  // The known trap: the editor hands back the source URL for a remote plate.
  const parsed = parseDesk(
    JSON.stringify({ version: DESK_VERSION, heat: 8, plates: [plate({ image: '/images/wake-tax.png' })] }),
  );
  assert.equal(parsed.plates[0].image, null);
  assert.equal(parsed.plates[0].plateCode, 'SL-AABBCCDDEE');
});

// ---------------------------------------------------------------------------
// The storage seam
// ---------------------------------------------------------------------------

test('a desk survives a write and a read through storage', () => {
  const storage = fakeStorage();
  const state = applyFiling(emptyDesk(), plate(), filing()).state;
  assert.equal(writeDesk(state, storage), 'stored');
  assert.equal(storage.map.size, 1);
  assert.ok(storage.map.has(DESK_KEY));
  assert.equal(readDesk(storage).heat, state.heat);
});

test('no stored desk reads as a fresh one rather than an error', () => {
  assert.deepEqual(readDesk(fakeStorage()), emptyDesk());
  assert.deepEqual(readDesk(null), emptyDesk());
});

test('a private window degrades to an in-memory session', () => {
  // Every accessor throws, the way a blocked-site-data browser behaves.
  const blocked = fakeStorage({ refuse: true });
  assert.deepEqual(readDesk(blocked), emptyDesk());
  assert.equal(writeDesk(emptyDesk(), blocked), 'unavailable');
  assert.equal(clearDesk(blocked), false);

  // And so does having no storage object at all.
  assert.equal(writeDesk(emptyDesk(), null), 'unavailable');
  assert.equal(clearDesk(null), false);
  assert.deepEqual(readDesk(null), emptyDesk());
});

test('a full quota costs negatives before it costs the record', () => {
  let state = emptyDesk();
  const big = `data:image/png;base64,${'A'.repeat(4000)}`;
  for (let index = 0; index < 4; index += 1) {
    state = applyFiling(state, plate({ id: `p${index}`, image: big }), filing()).state;
  }

  // Room for the metadata and one negative, but not four.
  const limit = serializeDesk(state, 1).length;
  const storage = fakeStorage({ limit });
  assert.equal(writeDesk(state, storage), 'trimmed');

  const restored = readDesk(storage);
  assert.equal(restored.plates.length, 4, 'every record survives');
  assert.equal(restored.heat, state.heat);
  assert.equal(restored.plates[0].image, big);
  assert.equal(restored.plates[3].image, null);
});

test('a quota too small for any negative still keeps the whole wall', () => {
  const state = applyFiling(emptyDesk(), plate({ image: `data:image/png;base64,${'A'.repeat(9000)}` }), filing()).state;
  const storage = fakeStorage({ limit: serializeDesk(state, 0).length });
  assert.equal(writeDesk(state, storage), 'metadata-only');

  const restored = readDesk(storage);
  assert.equal(restored.plates.length, 1);
  assert.equal(restored.plates[0].image, null);
  assert.equal(restored.plates[0].plateCode, 'SL-AABBCCDDEE');
});

test('a quota too small for even the metadata is reported, not thrown', () => {
  const state = applyFiling(emptyDesk(), plate(), filing()).state;
  assert.equal(writeDesk(state, fakeStorage({ limit: 10 })), 'unavailable');
});

test('clearing storage starts a clean edition', () => {
  const storage = fakeStorage();
  writeDesk(applyFiling(emptyDesk(), plate(), filing()).state, storage);
  assert.equal(clearDesk(storage), true);
  assert.equal(storage.map.size, 0);
  assert.deepEqual(readDesk(storage), emptyDesk());
});

test('the browser storage probe answers null off the browser instead of throwing', () => {
  // node --test has no window, which is exactly the SSR case.
  assert.equal(browserDeskStorage(), null);
});

test('the persisted key is single and versioned', () => {
  assert.equal(DESK_KEY, 'saltline.desk.v1');
  assert.match(DESK_KEY, /\.v\d+$/);
  const storage = fakeStorage();
  writeDesk(applyFiling(emptyDesk(), plate(), filing()).state, storage);
  assert.deepEqual([...storage.map.keys()], [DESK_KEY]);
});
