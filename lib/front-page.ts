// The downloadable front page.
//
// One 1600 x 2000 PNG composed with Canvas 2D. The visitor's exact saved
// export is drawn into it untouched; Saltline's paper, rules, masthead and
// stamp sit around those pixels and never over them.
//
// The page has three layouts, chosen by the press read (see press-read.ts):
// a banner across the top for a wide cut, a tall column beside the deck for
// a tight cut, and the standard night lead for everything between. The plate
// box is always computed from the export's real aspect ratio, so no layout
// letterboxes the visitor's work.

import type { PressPlay } from './press-read';

const WIDTH = 1600;
const HEIGHT = 2000;
const MARGIN = 88;
const COLUMN_WIDTH = WIDTH - MARGIN * 2; // 1424

const PAPER = '#e9e2d1';
const INK = '#171a18';
const CORAL = '#a63b2d';
const CORAL_FLAT = '#e4543f';
const PAPER_LIGHT = '#f0eadc';
const MUTED = '#5d6560';

export type FrontPageInput = {
  issue: string;
  createdAt: string;
  plateCode: string;
  place: string;
  angleStamp: string;
  closingLead: string;
  closingEmphasis: string;
  closingDeck: string;
  play: PressPlay;
  playLabel: string;
  toneLabel: string;
  ledgerLine: string;
};

type Rect = { x: number; y: number; width: number; height: number };

/**
 * A box of at most `maxWidth` x `maxHeight` that exactly matches the image's
 * aspect ratio, so the plate fills its frame instead of sitting in bars.
 */
function fitBox(image: HTMLImageElement, x: number, y: number, maxWidth: number, maxHeight: number): Rect {
  const aspect = image.naturalWidth / image.naturalHeight || 1.5;
  let width = maxWidth;
  let height = width / aspect;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspect;
  }

  return { x, y, width, height };
}

function drawPlate(context: CanvasRenderingContext2D, image: HTMLImageElement, rect: Rect) {
  context.fillStyle = '#121617';
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
  context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  context.strokeStyle = INK;
  context.lineWidth = 5;
  context.strokeRect(rect.x - 3, rect.y - 3, rect.width + 6, rect.height + 6);
}

/** Wraps text and returns the y baseline just past the last line drawn. */
function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.split(/\s+/);
  let line = '';
  let lineIndex = 0;
  let cursor = y;

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;

    if (context.measureText(nextLine).width > maxWidth && line) {
      context.fillText(line, x, cursor);
      lineIndex += 1;
      cursor += lineHeight;
      if (lineIndex >= maxLines) return cursor;
      line = word;
    } else {
      line = nextLine;
    }
  }

  if (line && lineIndex < maxLines) {
    context.fillText(line, x, cursor);
    cursor += lineHeight;
  }

  return cursor;
}

export async function renderFrontPage(
  input: FrontPageInput,
  image: HTMLImageElement,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas unavailable');

  // Paper and column rules.
  context.fillStyle = PAPER;
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.strokeStyle = 'rgba(23,26,24,.12)';
  context.lineWidth = 1;
  for (let x = 64; x < WIDTH; x += 32) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, HEIGHT);
    context.stroke();
  }

  // Masthead.
  context.fillStyle = INK;
  context.fillRect(0, 0, WIDTH, 210);
  context.fillStyle = PAPER_LIGHT;
  context.font = '900 82px Arial Black, Arial, sans-serif';
  context.fillText('SALTLINE', MARGIN, 122);
  context.font = '22px Arial, sans-serif';
  context.fillText('NIGHT EDITION / CALA VERDA', MARGIN + 4, 166);
  context.fillStyle = CORAL_FLAT;
  context.fillRect(1225, 0, 375, 210);
  context.fillStyle = INK;
  context.font = '900 28px Arial Black, Arial, sans-serif';
  context.fillText(input.issue, 1292, 92);
  context.font = '19px ui-monospace, monospace';
  context.fillText(input.createdAt, 1292, 132);

  // Slug line.
  context.fillStyle = CORAL;
  context.font = '700 22px Arial, sans-serif';
  context.fillText(`${input.place.toUpperCase()} / ${input.plateCode}`, MARGIN + 2, 292);

  // The footer band is fixed; every layout flows above it.
  const FOOTER_PRESS = 1772;
  const FOOTER_LEDGER = 1806;
  const FOOTER_RULE = 1950;

  const headline = (top: number, maxWidth: number) => {
    context.fillStyle = INK;
    context.font = '400 104px Georgia, Times New Roman, serif';
    const afterLead = drawWrappedText(context, input.closingLead, MARGIN, top, maxWidth, 108, 2);
    context.fillStyle = CORAL;
    context.font = 'italic 104px Georgia, Times New Roman, serif';
    return drawWrappedText(context, input.closingEmphasis, MARGIN, afterLead + 96, maxWidth, 108, 2);
  };

  const deck = (x: number, top: number, maxWidth: number, maxLines: number) => {
    context.fillStyle = INK;
    context.font = '400 27px Georgia, Times New Roman, serif';
    drawWrappedText(context, input.closingDeck, x, top, maxWidth, 37, maxLines);
  };

  if (input.play === 'banner') {
    // Wide cut: the plate runs across the top, headline beneath it.
    const rect = fitBox(image, MARGIN, 336, COLUMN_WIDTH, 620);
    drawPlate(context, image, rect);
    const afterHeadline = headline(rect.y + rect.height + 150, COLUMN_WIDTH);
    deck(MARGIN, Math.max(afterHeadline + 40, 1560), COLUMN_WIDTH, 3);
  } else if (input.play === 'column') {
    // Tight cut: tall plate on the left, deck set alongside it.
    const afterHeadline = headline(405, 1320);
    const rect = fitBox(image, MARGIN, Math.max(afterHeadline + 60, 765), 700, 950);
    drawPlate(context, image, rect);
    deck(MARGIN + 764, rect.y + 35, WIDTH - MARGIN - (MARGIN + 764), 12);
  } else {
    // Standard night lead.
    headline(405, 1320);
    const rect = fitBox(image, MARGIN, 765, COLUMN_WIDTH, 950);
    drawPlate(context, image, rect);
    deck(MARGIN, 1846, 1160, 3);
  }

  // Footer: press call, the disclosed measurement, stamp, and rule.
  context.fillStyle = INK;
  context.font = '700 20px Arial, sans-serif';
  context.fillText(`${input.angleStamp} / ${input.playLabel} / ${input.toneLabel}`, MARGIN, FOOTER_PRESS);
  context.fillStyle = MUTED;
  context.font = '16px ui-monospace, monospace';
  context.fillText(input.ledgerLine, MARGIN, FOOTER_LEDGER);

  context.strokeStyle = CORAL;
  context.lineWidth = 6;
  context.strokeRect(1290, 1765, 220, 142);
  context.save();
  context.translate(1400, 1835);
  context.rotate(-0.07);
  context.fillStyle = CORAL;
  context.textAlign = 'center';
  context.font = '900 22px Arial Black, Arial, sans-serif';
  context.fillText(input.angleStamp, 0, 0, 184);
  context.font = '17px ui-monospace, monospace';
  context.fillText(input.createdAt, 0, 34);
  context.restore();

  context.fillStyle = INK;
  context.font = '16px ui-monospace, monospace';
  context.fillText('YOUR EDIT. YOUR ANGLE. ON THE RECORD.', MARGIN, FOOTER_RULE);
  context.textAlign = 'right';
  context.fillText(input.plateCode, WIDTH - MARGIN, FOOTER_RULE);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('PNG export failed'))),
      'image/png',
    );
  });
}
