// Run with: node --test tests/lead-proof.test.mjs
// Requires Node 22.18+ or 23+ for native TypeScript import stripping.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ASPECT_TOLERANCE,
  CHANGE_THRESHOLD,
  WORKED_SHARE,
  classifyLead,
  leadLedgerLine,
  readLead,
} from '../lib/lead-proof.ts';
import { LEAD_REGIONS, leadRegion } from '../lib/lead-regions.ts';

test('marks concentrated on the lead read as on-lead', () => {
  assert.equal(classifyLead(0.3, 0.05), 'on-lead');
  assert.equal(readLead(0.3, 0.05, 'the mask').verdictLabel, 'ON THE LEAD');
});

test('an edit that misses the lead reads as untouched, however big it was', () => {
  // Half the frame changed, but none of it inside the region.
  assert.equal(classifyLead(0.0, 0.5), 'lead-untouched');
  assert.equal(classifyLead(0.014, 0.5), 'lead-untouched');
});

test('a single thin stroke laid on the lead counts as proof', () => {
  // Measured in the browser: an 8px stroke across the smallest authored
  // region moves 3.0% of it, against a 0.15% re-encode floor.
  assert.equal(classifyLead(0.03, 0.0008), 'on-lead');
});

test('a recut frame is reported as recropped, never as a lead verdict', () => {
  assert.equal(classifyLead(0.86, 0.81, true), 'recropped');
  // A recrop wins even when the numbers would have read as proof.
  assert.equal(classifyLead(0.9, 0.01, true), 'recropped');

  const proof = readLead(null, null, 'the mask', true);
  assert.equal(proof.verdictLabel, 'PLATE RECROPPED');
  assert.equal(proof.insideChange, null);
  assert.match(proof.verdictNote, /read the cut rather than the marks/);
  assert.equal(leadLedgerLine(proof), 'NOT MEASURED · PLATE RECROPPED');
});

test('the aspect tolerance is tight enough to catch a real crop', () => {
  // A 16:9 cut of a 3:2 plate drifts about 19%, far past the tolerance.
  const drift = Math.abs(16 / 9 - 3 / 2) / (3 / 2);
  assert.ok(drift > ASPECT_TOLERANCE);
  assert.ok(ASPECT_TOLERANCE > 0 && ASPECT_TOLERANCE < 0.05);
});

test('a whole-frame change reads as worked wide, not as proof', () => {
  // A global filter moves everything roughly equally.
  assert.equal(classifyLead(0.9, 0.9), 'worked-wide');
  assert.equal(classifyLead(0.5, 0.6), 'worked-wide');
});

test('the on-lead margin requires beating the rest of the frame clearly', () => {
  assert.equal(classifyLead(0.25, 0.2), 'on-lead'); // exactly 1.25x
  assert.equal(classifyLead(0.24, 0.2), 'worked-wide'); // just under
});

test('the worked-share floor is the untouched boundary', () => {
  assert.equal(classifyLead(WORKED_SHARE, 0.001), 'on-lead');
  assert.equal(classifyLead(WORKED_SHARE - 0.0001, 0.001), 'lead-untouched');
  // Clear of the measured 0.15% re-encode noise inside a region.
  assert.ok(WORKED_SHARE > 0.0015 * 5);
});

test('an unmeasurable save is reported as unmeasured, never as a failure', () => {
  for (const [inside, outside] of [
    [null, null],
    [null, 0.2],
    [0.2, null],
    [Number.NaN, 0.2],
    [0.2, Number.NaN],
  ]) {
    assert.equal(classifyLead(inside, outside), 'unmeasured');
  }

  const proof = readLead(null, null, 'the ferry');
  assert.equal(proof.verdictLabel, 'LEAD UNMEASURED');
  assert.equal(proof.insideChange, null);
  assert.match(proof.verdictNote, /ran it on your word/);
});

test('the change threshold clears the measured JPEG re-encode floor', () => {
  // Re-encoding the plates at quality 0.80-0.92 moved the 99.5th-percentile
  // pixel by at most 22 on the same 256px grid this module samples on.
  assert.ok(CHANGE_THRESHOLD > 22);
});

test('the ledger discloses both percentages and the verdict', () => {
  // Rendered under a "LEAD" label, so the line does not repeat the word.
  const line = leadLedgerLine(readLead(0.312, 0.041, 'the mask'));
  assert.equal(line, '31.2% CHANGED · REST OF FRAME 4.1% · ON THE LEAD');
});

test('the ledger stays honest when nothing could be measured', () => {
  assert.equal(leadLedgerLine(readLead(null, null, 'the mask')), 'NOT MEASURED');
});

test('the proof carries the subject through for the desk to name', () => {
  assert.equal(readLead(0.3, 0.05, 'the silver carnival mask').subject, 'the silver carnival mask');
});

test('every case and angle in the experience has an authored lead region', () => {
  const expected = [
    'wake-tax:expose-launch',
    'wake-tax:protect-crew',
    'room-08:show-witness',
    'room-08:hide-witness',
    'after-rain:publish-mask',
    'after-rain:follow-courier',
    'undertow:print-handoff',
    'undertow:follow-tender',
    'off-the-meter:tag-driver',
    'off-the-meter:map-route',
  ];

  assert.equal(Object.keys(LEAD_REGIONS).length, expected.length);
  for (const key of expected) {
    const [assignmentId, angleId] = key.split(':');
    const region = leadRegion(assignmentId, angleId);
    assert.ok(region, `missing region for ${key}`);
    assert.ok(region.subject.length > 0, `${key} has no subject`);
  }
});

test('every lead region sits inside the plate and is big enough to hit', () => {
  for (const [key, region] of Object.entries(LEAD_REGIONS)) {
    assert.ok(region.x >= 0 && region.x <= 1, `${key} x out of range`);
    assert.ok(region.y >= 0 && region.y <= 1, `${key} y out of range`);
    assert.ok(region.x + region.width <= 1.0001, `${key} overflows the right edge`);
    assert.ok(region.y + region.height <= 1.0001, `${key} overflows the bottom edge`);
    // Large enough that a single brush stroke can move more than the 1.5%
    // floor, small enough that it is a claim about one subject in the
    // photograph rather than about the whole frame.
    const area = region.width * region.height;
    assert.ok(area > 0.01, `${key} is too small to aim at (${area.toFixed(4)})`);
    assert.ok(area < 0.35, `${key} is most of the frame (${area.toFixed(4)})`);
  }
});

test('an unknown case or angle returns no region rather than throwing', () => {
  assert.equal(leadRegion('nope', 'nope'), null);
  assert.equal(leadRegion('wake-tax', 'not-an-angle'), null);
});
