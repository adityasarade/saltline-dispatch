#!/usr/bin/env node
// Content integrity check for Saltline Dispatch.
//
// Run with: npm run check:content
//
// A missing plate is a broken image in front of a judge, and no unit test
// catches it because the data is valid TypeScript either way. This walks the
// authored content and asserts that every case is actually complete and
// every file it references exists on disk at the size the app expects.

import { access, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { ASSIGNMENTS } from '../lib/assignments.ts';
import { LEAD_REGIONS, leadRegion } from '../lib/lead-regions.ts';
import { CLASSIFIEDS, classifiedsFor } from '../lib/classifieds.ts';
import { HEAT_TIERS } from '../lib/city-heat.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The six tools Saltline enables in React Image Editor. A route that names
// anything else would point a visitor at a control that is not there.
const ENABLED_TOOLS = new Set(['Crop', 'Filter', 'Draw', 'Text', 'Shapes', 'Frame']);
const failures = [];
const notes = [];

function fail(message) {
  failures.push(message);
}

async function publicFileExists(urlPath) {
  const filePath = path.join(root, 'public', urlPath.replace(/^\//, ''));
  try {
    await access(filePath);
    return (await stat(filePath)).size;
  } catch {
    return null;
  }
}

if (!Array.isArray(ASSIGNMENTS) || ASSIGNMENTS.length === 0) {
  fail('ASSIGNMENTS is empty — the experience has no cases.');
}

const seenIds = new Set();
const issues = new Set();

for (const assignment of ASSIGNMENTS) {
  const id = assignment?.id ?? '(no id)';

  for (const field of ['id', 'issue', 'call', 'title', 'place', 'time', 'prompt', 'image', 'preview']) {
    if (!assignment?.[field]) fail(`${id}: missing "${field}".`);
  }

  if (seenIds.has(id)) fail(`${id}: duplicate case id.`);
  seenIds.add(id);

  // Every case belongs to the same night's edition, so they share an issue
  // number; the per-dispatch suffix is added at publish time.
  if (assignment.issue) issues.add(assignment.issue);

  // The in-world clock derives the publish time from this, so it has to parse.
  if (!/^\d{2}:\d{2}$/.test(assignment.time ?? '')) {
    fail(`${id}: time "${assignment.time}" is not HH:MM.`);
  }

  if (typeof assignment.baseLuminance !== 'number' || !(assignment.baseLuminance > 0 && assignment.baseLuminance < 1)) {
    fail(`${id}: baseLuminance must be a measured value between 0 and 1, got ${assignment.baseLuminance}.`);
  }

  // The canonical editor source must be present and must be the real plate,
  // not a derivative that slipped into the editor path.
  const imageSize = await publicFileExists(assignment.image);
  if (imageSize === null) {
    fail(`${id}: editor source ${assignment.image} is missing from public/.`);
  } else {
    if (!assignment.image.endsWith('.png')) {
      fail(`${id}: editor source ${assignment.image} is not a PNG — the editor must get the canonical plate.`);
    }
    if (imageSize < 500_000) {
      fail(`${id}: editor source ${assignment.image} is only ${imageSize} B, too small to be the full plate.`);
    }
    if (assignment.image.includes('/display/')) {
      fail(`${id}: editor source ${assignment.image} points into the display-derivative folder.`);
    }
  }

  const previewSize = await publicFileExists(assignment.preview);
  if (previewSize === null) {
    fail(`${id}: preview ${assignment.preview} is missing from public/.`);
  } else if (previewSize > 400_000) {
    fail(`${id}: preview ${assignment.preview} is ${previewSize} B — browsing surfaces should stay light.`);
  }

  const angles = assignment.angles ?? [];
  if (angles.length !== 2) {
    fail(`${id}: expected exactly 2 angles (two defensible truths), found ${angles.length}.`);
  }

  const angleIds = new Set();
  for (const angle of angles) {
    const angleId = angle?.id ?? '(no id)';

    for (const field of [
      'id',
      'label',
      'prompt',
      'outcome',
      'stamp',
      'closingLead',
      'closingEmphasis',
      'closingDeck',
    ]) {
      if (!angle?.[field]) fail(`${id}/${angleId}: missing "${field}".`);
    }

    if (angleIds.has(angleId)) fail(`${id}: duplicate angle id "${angleId}".`);
    angleIds.add(angleId);

    const moves = angle?.moves ?? [];
    if (moves.length !== 3) {
      fail(`${id}/${angleId}: expected a three-move editor route, found ${moves.length}.`);
    }
    for (const move of moves) {
      if (!move?.tool) fail(`${id}/${angleId}: a move has no tool.`);
      if (!move?.instruction) fail(`${id}/${angleId}: move "${move?.tool}" has no instruction.`);
      if (!ENABLED_TOOLS.has(move?.tool)) {
        fail(`${id}/${angleId}: move "${move?.tool}" is not one of the enabled editor tools.`);
      }
    }

    // Every lead must have somewhere in the plate to be proven.
    if (!leadRegion(id, angleId)) {
      fail(`${id}/${angleId}: no authored lead region — the press cannot measure this lead.`);
    }
  }

  if (angles.length === 2 && angles[0]?.outcome && angles[0].outcome === angles[1]?.outcome) {
    fail(`${id}: both angles share the same outcome — the choice does not change anything.`);
  }
}

// No orphan regions pointing at content that no longer exists.
for (const key of Object.keys(LEAD_REGIONS)) {
  const [assignmentId, angleId] = key.split(':');
  const assignment = ASSIGNMENTS.find((item) => item.id === assignmentId);
  if (!assignment) {
    fail(`lead region "${key}" refers to an unknown case.`);
  } else if (!(assignment.angles ?? []).some((angle) => angle.id === angleId)) {
    fail(`lead region "${key}" refers to an unknown angle.`);
  }
}

// --------------------------------------------------------------------------
// Franchise and real-brand similarity check.
//
// The competition's asset rule is that everything shipped is the entrant's
// own or licensed. Saltline's whole world is invented, and this is the
// automated proof: every line of authored copy - the five cases, the ten
// angles, the classifieds, the heat tiers and their notices - is swept for
// franchise names, franchise character names, franchise place names, leak
// vocabulary and the real-brand marks those satirical fronts are most likely
// to drift into. A hit fails the build rather than reaching a judge.
// --------------------------------------------------------------------------

const FORBIDDEN = [
  // Franchise and publisher marks.
  'rockstar', 'take-two', 'take two', 'grand theft', 'gta', 'red dead', 'max payne',
  // Franchise settings and places.
  'vice city', 'liberty city', 'san andreas', 'los santos', 'las venturas', 'san fierro',
  'leonida', 'vinewood', 'blaine county', 'paleto', 'sandy shores', 'grove street',
  // Franchise characters.
  'lucia caminos', 'jason duval', 'niko bellic', 'trevor philips', 'franklin clinton',
  'michael de santa', 'carl johnson', 'tommy vercetti', 'claude speed',
  // Franchise in-fiction brands, which a satirical back page could drift onto.
  'ammu-nation', 'ammunation', 'cluckin bell', 'sprunk', 'lifeinvader', 'bawsaq',
  'maibatsu', 'pisswasser', 'burger shot', 'los santos customs', 'weazel news',
  // Leak vocabulary.
  'leaked build', 'leaked footage', 'datamine',
  // Real brands the fictional fronts must not land on.
  'hertz', 'avis', 'marriott', 'hilton', 'western union', 'moneygram', 'fedex',
];

const COPY_SOURCES = [];

for (const assignment of ASSIGNMENTS) {
  for (const field of ['title', 'deck', 'prompt', 'outcome', 'place', 'call', 'issue']) {
    COPY_SOURCES.push([`case ${assignment.id}.${field}`, String(assignment[field] ?? '')]);
  }
  for (const angle of assignment.angles ?? []) {
    for (const field of ['label', 'prompt', 'outcome', 'stamp', 'closingLead', 'closingEmphasis', 'closingDeck']) {
      COPY_SOURCES.push([`angle ${assignment.id}/${angle.id}.${field}`, String(angle[field] ?? '')]);
    }
    for (const move of angle.moves ?? []) {
      COPY_SOURCES.push([`move ${assignment.id}/${angle.id}/${move.tool}`, String(move.instruction ?? '')]);
    }
  }
}

for (const ad of CLASSIFIEDS) {
  COPY_SOURCES.push([`classified "${ad.name}"`, `${ad.name} ${ad.copy} ${ad.rate}`]);
}

for (const tier of HEAT_TIERS) {
  COPY_SOURCES.push([
    `heat tier ${tier.id}`,
    `${tier.label} ${tier.masthead} ${tier.deskLine} ${tier.closingLine} ${tier.notice ? `${tier.notice.from} ${tier.notice.body}` : ''}`,
  ]);
}

for (const [where, copy] of COPY_SOURCES) {
  const haystack = copy.toLowerCase();
  for (const token of FORBIDDEN) {
    if (haystack.includes(token)) {
      fail(`${where} contains the forbidden term "${token}" — every name in Saltline must be original.`);
    }
  }
}

// The back page itself has to be complete and non-repeating.
if (CLASSIFIEDS.length < 6) {
  fail(`the classifieds need at least 6 entries to read as a back page, found ${CLASSIFIEDS.length}.`);
}

const adNames = new Set();
for (const ad of CLASSIFIEDS) {
  for (const field of ['name', 'copy', 'rate']) {
    if (!ad?.[field]) fail(`classified "${ad?.name ?? '(no name)'}": missing "${field}".`);
  }
  if (adNames.has(ad.name)) fail(`classified "${ad.name}": duplicate advertiser.`);
  adNames.add(ad.name);
  if ((ad.copy ?? '').length < 40) {
    fail(`classified "${ad.name}": copy is too short to carry a joke (${(ad.copy ?? '').length} characters).`);
  }
}

// The selection helper has to be deterministic and never repeat within a draw.
for (const seed of [0, 1, 2, 3, 7, 40, -5, Number.NaN]) {
  const drawn = classifiedsFor(seed, 3);
  if (drawn.length !== 3) fail(`classifiedsFor(${seed}) returned ${drawn.length} ads, expected 3.`);
  if (new Set(drawn.map((ad) => ad.name)).size !== drawn.length) {
    fail(`classifiedsFor(${seed}) repeated an advertiser inside one draw.`);
  }
  if (JSON.stringify(drawn) !== JSON.stringify(classifiedsFor(seed, 3))) {
    fail(`classifiedsFor(${seed}) is not deterministic.`);
  }
}

// Every heat tier needs the copy the interface renders for it.
for (const tier of HEAT_TIERS) {
  for (const field of ['id', 'label', 'masthead', 'deskLine', 'closingLine']) {
    if (!tier?.[field]) fail(`heat tier ${tier?.id ?? '(no id)'}: missing "${field}".`);
  }
}

// Media the README promises a judge.
for (const asset of [
  '/saltline-dispatch.gif',
  '/og.png',
  '/favicon.svg',
]) {
  if ((await publicFileExists(asset)) === null) fail(`README media ${asset} is missing from public/.`);
}

if (issues.size !== 1) {
  fail(`the five calls should all belong to one night's edition, found issues: ${[...issues].join(', ')}.`);
}

notes.push(
  `${ASSIGNMENTS.length} cases in ${[...issues][0]}, ${Object.keys(LEAD_REGIONS).length} leads, all plates, previews and README media present.`,
  `${CLASSIFIEDS.length} classifieds and ${HEAT_TIERS.length} heat tiers swept against ${FORBIDDEN.length} franchise and real-brand terms, no hits.`,
);

if (failures.length > 0) {
  console.error(`\nContent check FAILED — ${failures.length} problem${failures.length === 1 ? '' : 's'}:\n`);
  for (const message of failures) console.error(`  • ${message}`);
  console.error('');
  process.exit(1);
}

console.log(`Content check passed. ${notes.join(' ')}`);
