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
);

if (failures.length > 0) {
  console.error(`\nContent check FAILED — ${failures.length} problem${failures.length === 1 ? '' : 's'}:\n`);
  for (const message of failures) console.error(`  • ${message}`);
  console.error('');
  process.exit(1);
}

console.log(`Content check passed. ${notes.join(' ')}`);
