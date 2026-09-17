// Run with: node --test tests/export-meta.test.mjs
// Requires Node 22.18+ or 23+ for native TypeScript import stripping.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  fallbackPlateCode,
  filedAt,
  formatBytes,
  imageExtension,
} from '../lib/export-meta.ts';

// --- fallbackPlateCode -----------------------------------------------------
// The plate code is the visitor's proof that the printed sheet carries their
// exact export. SHA-256 provides it when crypto.subtle is available; this
// FNV-1a fallback has to be just as stable, because a code that drifts between
// the reveal screen and the archive card would make the ledger a lie.

test('the fallback plate code is deterministic for identical exports', () => {
  const dataUrl = 'data:image/png;base64,AAAABBBBCCCCDDDD';
  assert.equal(fallbackPlateCode(dataUrl), fallbackPlateCode(dataUrl));
  assert.equal(fallbackPlateCode(''), fallbackPlateCode(''));
});

test('the fallback plate code separates different exports', () => {
  const a = fallbackPlateCode('data:image/png;base64,AAAABBBB');
  const b = fallbackPlateCode('data:image/png;base64,AAAABBBC');
  const c = fallbackPlateCode('data:image/jpeg;base64,AAAABBBB');
  assert.notEqual(a, b);
  assert.notEqual(a, c);
  assert.notEqual(b, c);
});

test('the fallback plate code notices a length change it cannot sample', () => {
  // Only the first and last 4096 characters are sampled, so the payload length
  // is mixed in as well. Two exports that share both ends must still differ.
  const head = 'H'.repeat(4096);
  const tail = 'T'.repeat(4096);
  const short = `${head}${'x'.repeat(10)}${tail}`;
  const long = `${head}${'x'.repeat(11)}${tail}`;
  assert.notEqual(fallbackPlateCode(short), fallbackPlateCode(long));
});

test('the fallback plate code is always eight uppercase hex digits', () => {
  for (const sample of ['', 'a', 'data:image/webp;base64,zzz', 'x'.repeat(20000)]) {
    assert.match(fallbackPlateCode(sample), /^[0-9A-F]{8}$/);
  }
});

// --- imageExtension --------------------------------------------------------
// The download filename has to match the bytes the editor actually returned.

test('the export extension follows the data URL mime type', () => {
  assert.equal(imageExtension('data:image/png;base64,AAAA'), 'png');
  assert.equal(imageExtension('data:image/webp;base64,AAAA'), 'webp');
});

test('a jpeg export is filed as .jpg, not .jpeg', () => {
  assert.equal(imageExtension('data:image/jpeg;base64,AAAA'), 'jpg');
  assert.equal(imageExtension('DATA:IMAGE/JPEG;base64,AAAA'), 'jpg');
});

test('an unreadable or unexpected data URL falls back to png', () => {
  assert.equal(imageExtension(''), 'png');
  assert.equal(imageExtension('data:image/gif;base64,AAAA'), 'png');
  assert.equal(imageExtension('data:image/svg+xml;base64,AAAA'), 'png');
  assert.equal(imageExtension('blob:http://localhost/abc'), 'png');
  assert.equal(imageExtension('data:image/png,AAAA'), 'png');
});

// --- formatBytes -----------------------------------------------------------
// The export ledger states the saved size. The unit has to change exactly at
// the boundary, so 1024 B never prints as "1024 B" next to "1 KB".

test('byte sizes are reported in bytes below one kilobyte', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1), '1 B');
  assert.equal(formatBytes(1023), '1023 B');
});

test('one kilobyte is the first KB reading', () => {
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1536), '2 KB');
  assert.equal(formatBytes(1024 * 1024 - 1), '1024 KB');
});

test('one megabyte is the first MB reading, at one decimal place', () => {
  assert.equal(formatBytes(1024 * 1024), '1.0 MB');
  assert.equal(formatBytes(Math.round(1.5 * 1024 * 1024)), '1.5 MB');
  assert.equal(formatBytes(12 * 1024 * 1024), '12.0 MB');
});

// --- filedAt ---------------------------------------------------------------
// Saltline runs on night-desk time. A dispatch is filed seven minutes after
// its call came in, and the night advances five minutes per plate already
// printed, so the keepsake front page never carries a daytime hour.

test('a dispatch is filed seven minutes after its call came in', () => {
  assert.equal(filedAt('02:13', 0), '02:20');
  assert.equal(filedAt('02:41', 0), '02:48');
});

test('every plate already printed pushes the night on five minutes', () => {
  assert.equal(filedAt('02:13', 1), '02:25');
  assert.equal(filedAt('02:13', 2), '02:30');
  assert.equal(filedAt('02:13', 5), '02:45');
});

test('all five field calls stay inside the small hours for a full run', () => {
  // The five call times in lib/assignments.ts, printed one after another.
  const calls = ['02:13', '02:19', '02:27', '02:34', '02:41'];
  const filed = calls.map((time, index) => filedAt(time, index));
  assert.deepEqual(filed, ['02:20', '02:31', '02:44', '02:56', '03:08']);
  for (const time of filed) {
    const minutes = Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
    assert.ok(minutes >= 120 && minutes < 240, `${time} is still the night desk`);
  }
});

test('the hour and minute are always two digits', () => {
  assert.equal(filedAt('23:55', 0), '00:02');
  assert.equal(filedAt('00:00', 0), '00:07');
  assert.equal(filedAt('09:04', 0), '09:11');
});

test('the night wraps past midnight instead of running to 24:00', () => {
  assert.equal(filedAt('23:50', 0), '23:57');
  assert.equal(filedAt('23:55', 1), '00:07');
  assert.equal(filedAt('23:50', 3), '00:12');
  // Past the wrap the clock keeps counting from midnight, never to 24:00.
  assert.equal(filedAt('23:53', 12), '01:00');
  assert.equal(filedAt('23:53', 60), '05:00');
});

test('the filed time is deterministic', () => {
  assert.equal(filedAt('02:27', 3), filedAt('02:27', 3));
});
