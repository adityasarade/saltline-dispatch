'use client';

import { useEffect, useState } from 'react';
import type { ImageEditorRef } from '@unlayer/react-image-editor';
import { LIVE_SAMPLE_INTERVAL, sampleLive, type LiveRead } from '@/lib/live-read';
import type { LeadRegion } from '@/lib/lead-regions';

// ---------------------------------------------------------------------------
// The live desk readout.
//
// Polls the mounted editor's own `getImage()` and shows the two readings
// Saltline cares about - is the work landing on the locked lead, and what
// layout would this crop produce - while the visitor is still working.
//
// The poll is gated three ways so an untouched plate is never re-measured:
// the editor has to exist, `hasChanges()` has to be true, and the snapshot
// has to differ from the last one measured. Everything runs off a single
// interval that is torn down when the editor unmounts or the screen changes,
// and one in-flight sample is never allowed to overlap the next.
//
// It is a sample, not the record. The card says that in its own copy, which
// is the same standard the rest of the project holds itself to about its
// measurements.
//
// One measured limit of `getImage()`, disclosed in the card itself: a filter
// preset selected while the GRADE panel is still open is a live preview that
// `getImage()` does not include, so the card reports the pixels as they
// actually stand and corrects itself the moment the panel closes and the
// grade is committed. Measured against the same edit: panel open reads OFF
// THE LEAD, panel closed reads WORKING WIDE, and Save reports WORKED WIDE at
// 71.8% inside / 60.9% outside. Drawn marks commit immediately and have no
// such window.
// ---------------------------------------------------------------------------

type LiveReadCardProps = {
  editorRef: React.RefObject<ImageEditorRef | null>;
  /** The untouched plate the sample is compared against. */
  plateUrl: string;
  /** The locked lead's authored region, or null when nothing is locked. */
  region: LeadRegion | null;
  /** False while the editor is absent, booting, failed, or mid-publish. */
  active: boolean;
};

export function LiveReadCard({ editorRef, plateUrl, region, active }: LiveReadCardProps) {
  const [reading, setReading] = useState<LiveRead | null>(null);
  const regionKey = region ? `${region.x},${region.y},${region.width},${region.height}` : 'none';

  useEffect(() => {
    // Nothing to poll. Any reading left over stays hidden by the render
    // guard below and is corrected on the first tick after reactivation.
    if (!active) return;

    let cancelled = false;
    let inFlight = false;
    let lastSampled: string | null = null;

    const tick = async () => {
      if (cancelled || inFlight) return;

      const editor = editorRef.current?.editor;
      if (!editor) return;

      let snapshot: string | null = null;
      try {
        // The gate. An untouched plate costs one boolean per tick.
        if (!editor.hasChanges()) {
          lastSampled = null;
          setReading((current) => (current === null ? current : null));
          return;
        }
        snapshot = editor.getImage();
      } catch {
        // A crashed or destroyed instance is not an error state for the
        // visitor; the card simply stops claiming anything.
        setReading((current) => (current === null ? current : null));
        return;
      }

      if (!snapshot || snapshot === lastSampled) return;

      inFlight = true;
      try {
        const measured = await sampleLive(plateUrl, snapshot, region);
        if (cancelled) return;
        lastSampled = snapshot;
        setReading(measured);
      } catch {
        if (!cancelled) setReading(null);
      } finally {
        inFlight = false;
      }
    };

    const timer = window.setInterval(() => void tick(), LIVE_SAMPLE_INTERVAL);
    void tick();

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [active, editorRef, plateUrl, region, regionKey]);

  if (!active || !reading) return null;

  return (
    <div className={`live-read live-${reading.verdict}`} role="status" aria-live="polite" data-live-verdict={reading.verdict}>
      <span className="live-read-head">
        <i className="live-dot" aria-hidden="true" />
        Live sample / not the record
      </span>
      <p className="live-read-lead">
        <b data-live-lead>{reading.leadLabel}</b>
        {reading.leadNote}
      </p>
      <p className="live-read-play">
        Would run as <b data-live-play>{reading.playLabel}</b> at {reading.aspect.toFixed(2)}:1
      </p>
      <small>
        Sampled from the editor&apos;s own <b>getImage()</b> every {(LIVE_SAMPLE_INTERVAL / 1000).toFixed(1)}s. A grade
        you are still previewing lands in the sample when you close its panel. Save sets the record.
      </small>
    </div>
  );
}
