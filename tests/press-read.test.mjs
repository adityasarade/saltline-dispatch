// Run with: node --test tests/press-read.test.mjs
// Requires Node 22.18+ or 23+ for native TypeScript import stripping.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SOURCE_ASPECT,
  classifyPlay,
  classifyTone,
  pressLedgerLine,
  readPress,
} from '../lib/press-read.ts';

test('an untouched field plate runs as the night lead', () => {
  assert.equal(classifyPlay(SOURCE_ASPECT), 'lead');
  assert.equal(readPress(1536, 1024, 0.45, 0.45).play, 'lead');
});

test('a wide crop is promoted to a banner', () => {
  assert.equal(classifyPlay(1.7), 'banner');
  assert.equal(classifyPlay(2.4), 'banner');
  assert.equal(readPress(1536, 640, 0.5, 0.5).playLabel, 'RUN AS BANNER');
});

test('a 16:9 crop earns the banner, the untouched 3:2 plate does not', () => {
  // The two ratios a visitor is most likely to produce with the Crop tool.
  assert.equal(classifyPlay(1536 / 864), 'banner');
  assert.equal(classifyPlay(1536 / 1024), 'lead');
  assert.equal(classifyPlay(1536 / 1152), 'lead');
});

test('a tight crop is run as a column', () => {
  assert.equal(classifyPlay(1.2), 'column');
  assert.equal(classifyPlay(1), 'column');
  assert.equal(classifyPlay(0.7), 'column');
  assert.equal(readPress(900, 1200, 0.5, 0.5).playLabel, 'RUN AS COLUMN');
});

test('play classification is total and never throws on bad geometry', () => {
  for (const aspect of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(classifyPlay(aspect), 'lead');
  }
  assert.equal(readPress(null, null, null, 0.16).play, 'lead');
});

test('two different crops of the same plate produce different plays', () => {
  const wide = readPress(1536, 500, 0.5, 0.5);
  const tall = readPress(500, 1536, 0.5, 0.5);
  assert.notEqual(wide.play, tall.play);
  assert.notEqual(wide.playNote, tall.playNote);
});

test('tone follows exposure against the plate, not absolute brightness', () => {
  assert.equal(classifyTone(0.6), 'night');
  assert.equal(classifyTone(1), 'even');
  assert.equal(classifyTone(1.6), 'bleached');
  assert.equal(classifyTone(null), 'even');
  assert.equal(classifyTone(Number.NaN), 'even');
  assert.equal(classifyTone(0), 'even');
});

test('tone boundaries are stable', () => {
  assert.equal(classifyTone(0.82), 'even');
  assert.equal(classifyTone(0.8199), 'night');
  assert.equal(classifyTone(1.22), 'even');
  assert.equal(classifyTone(1.2201), 'bleached');
});

test('a dark night plate left alone reads as a straight press, not as dark', () => {
  // Off the Meter has a baseline of 0.1095. Saving it untouched must not
  // report PRESSED DARK - that would describe the artwork, not the edit.
  const untouched = readPress(1536, 1024, 0.1095, 0.1095);
  assert.equal(untouched.tone, 'even');
  assert.equal(untouched.toneLabel, 'STRAIGHT PRESS');

  const darkened = readPress(1536, 1024, 0.07, 0.1095);
  assert.equal(darkened.toneLabel, 'PRESSED DARK');

  const lifted = readPress(1536, 1024, 0.16, 0.1095);
  assert.equal(lifted.toneLabel, 'PUSHED FOR DETAIL');
});

test('exposure is reported as a ratio against the plate', () => {
  const read = readPress(1536, 1024, 0.22, 0.11);
  assert.equal(read.exposure, 2);
  assert.match(pressLedgerLine(read), /VS PLATE 2\.00×/);
});

test('the ledger line discloses every measurement it decided from', () => {
  const line = pressLedgerLine(readPress(1536, 1024, 0.41, 0.41));
  assert.match(line, /^MEASURED 1\.50:1 · LUMA 0\.41 · VS PLATE 1\.00× · STRAIGHT PRESS$/);
});

test('the ledger line is honest when pixels could not be read', () => {
  assert.match(pressLedgerLine(readPress(1536, 1024, null, 0.16)), /LUMA N\/A/);
});

test('the press read is deterministic for identical measurements', () => {
  assert.deepEqual(readPress(1200, 900, 0.33, 0.16), readPress(1200, 900, 0.33, 0.16));
});
