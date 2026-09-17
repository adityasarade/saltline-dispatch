/* eslint-disable @next/next/no-img-element -- editor exports are user-specific data URLs and must remain unoptimized. */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ImageEditorRef, ImageEditorSaveResult } from '@unlayer/react-image-editor';
import { pressLedgerLine, type PressRead } from '@/lib/press-read';
import { leadLedgerLine, measureLead, readLead, type LeadProof } from '@/lib/lead-proof';
import { leadRegion } from '@/lib/lead-regions';
import { ASSIGNMENTS } from '@/lib/assignments';
import { filedAt, formatBytes, imageExtension, inspectExport, loadCanvasImage } from '@/lib/export-meta';
import {
  EditorStage,
  createImageEditor,
  preloadImageEditor,
  resetImageEditorModule,
} from '@/components/saltline/editor-stage';
import { DeskSound } from '@/lib/desk-sound';
import { renderFrontPage } from '@/lib/front-page';

type Screen = 'desk' | 'calls' | 'edit' | 'reveal' | 'archive';

type Dispatch = {
  id: string;
  assignmentId: string;
  angleId: string;
  image: string;
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
};

const steps: Array<{ id: Screen; label: string; number: string }> = [
  { id: 'desk', label: 'Briefing', number: '01' },
  { id: 'calls', label: 'Pick a case', number: '02' },
  { id: 'edit', label: 'Edit evidence', number: '03' },
  { id: 'reveal', label: 'Publish', number: '04' },
  { id: 'archive', label: 'Archive', number: '05' },
];

export default function Home() {
  const [screen, setScreen] = useState<Screen>('desk');
  const [furthestStep, setFurthestStep] = useState(0);
  const [selectedId, setSelectedId] = useState(ASSIGNMENTS[0].id);
  const [selectedAngleId, setSelectedAngleId] = useState<string | null>(null);
  const [isClosingFrameOpen, setIsClosingFrameOpen] = useState(false);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [activeDispatchId, setActiveDispatchId] = useState<string | null>(null);
  const [editorStatus, setEditorStatus] = useState('Loading the field plate…');
  const [editorAttempt, setEditorAttempt] = useState(0);
  const [EditorComponent, setEditorComponent] = useState(createImageEditor);
  const [editorFailed, setEditorFailed] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPressRunning, setIsPressRunning] = useState(false);
  const [discardAsk, setDiscardAsk] = useState<{ message: string; resolve: (keep: boolean) => void } | null>(null);
  const [deskNotice, setDeskNotice] = useState('');
  const [soundOn, setSoundOn] = useState(false);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const closingDialogRef = useRef<HTMLElement>(null);
  const screenRef = useRef<HTMLElement>(null);
  const previousScreen = useRef<Screen | null>(null);
  const prefetchedPlates = useRef(new Set<string>());
  const imageEditorRef = useRef<ImageEditorRef>(null);
  const publishingRef = useRef(false);
  const angleTransitionRef = useRef(false);
  const draftRevisionRef = useRef(0);
  const deskSound = useRef<DeskSound | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (previousScreen.current) screenRef.current?.focus({ preventScroll: true });
    previousScreen.current = screen;
  }, [screen]);

  useEffect(() => () => deskSound.current?.disable(), []);

  useEffect(() => {
    if (!deskNotice) return;
    const timer = window.setTimeout(() => setDeskNotice(''), 6000);
    return () => window.clearTimeout(timer);
  }, [deskNotice]);

  // An in-world replacement for window.confirm. The desk asks on newsprint
  // rather than handing the visitor a browser chrome dialog mid-story.
  function askDiscard(message: string) {
    return new Promise<boolean>((resolve) => {
      setDiscardAsk({ message, resolve });
    });
  }

  function answerDiscard(discard: boolean) {
    discardAsk?.resolve(discard);
    setDiscardAsk(null);
  }

  async function toggleSound() {
    if (soundOn) {
      deskSound.current?.disable();
      setSoundOn(false);
      return;
    }

    deskSound.current ??= new DeskSound();
    const ready = await deskSound.current.enable();
    setSoundOn(ready);
    if (ready) deskSound.current.cue('call');
  }

  useEffect(() => {
    if (!isClosingFrameOpen) return;
    closingDialogRef.current?.focus({ preventScroll: true });
  }, [isClosingFrameOpen]);

  useEffect(() => {
    if (!isClosingFrameOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isClosingFrameOpen]);

  useEffect(() => {
    if (screen !== 'edit' || !editorReady) return;

    const protectDraft = (event: BeforeUnloadEvent) => {
      if (!imageEditorRef.current?.editor?.hasChanges()) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', protectDraft);
    return () => window.removeEventListener('beforeunload', protectDraft);
  }, [editorReady, screen]);

  const selected = useMemo(
    () => ASSIGNMENTS.find((assignment) => assignment.id === selectedId) ?? ASSIGNMENTS[0],
    [selectedId],
  );

  const activeDispatch = useMemo(
    () => dispatches.find((dispatch) => dispatch.id === activeDispatchId) ?? null,
    [activeDispatchId, dispatches],
  );

  const selectedAngle = useMemo(
    () => selected.angles.find((angle) => angle.id === selectedAngleId) ?? null,
    [selected, selectedAngleId],
  );

  const activeAssignment = useMemo(() => {
    const assignmentId = activeDispatch?.assignmentId ?? selected.id;
    return ASSIGNMENTS.find((assignment) => assignment.id === assignmentId) ?? selected;
  }, [activeDispatch, selected]);

  function advanceProgress(step: number) {
    setFurthestStep((current) => Math.max(current, step));
  }

  function prefetchPlate(imageUrl: string) {
    if (prefetchedPlates.current.has(imageUrl)) return;

    prefetchedPlates.current.add(imageUrl);
    const image = new Image();
    image.decoding = 'async';
    image.onerror = () => prefetchedPlates.current.delete(imageUrl);
    image.src = imageUrl;
  }

  async function navigateTo(nextScreen: Screen) {
    if (nextScreen === 'reveal' && !activeDispatch) return;
    if (screen === 'edit' && nextScreen !== 'edit' && (publishingRef.current || angleTransitionRef.current)) {
      setEditorStatus('The image desk is finishing the current operation. Leave after it settles.');
      return;
    }
    if (screen === 'edit' && nextScreen !== 'edit' && imageEditorRef.current?.editor?.hasChanges()) {
      const shouldDiscard = await askDiscard('This field plate has unpublished marks. Discard them and leave the image desk?');
      if (!shouldDiscard) return;
    }
    if (screen === 'edit' && nextScreen !== 'edit') draftRevisionRef.current += 1;
    if (nextScreen === 'edit' && screen !== 'edit') {
      draftRevisionRef.current += 1;
      setActiveDispatchId(null);
      setSelectedAngleId(null);
      setEditorFailed(false);
      setEditorReady(false);
      setEditorStatus('Lock an angle to open the image desk.');
      preloadImageEditor();
      prefetchPlate(selected.image);
    }
    setIsClosingFrameOpen(false);
    setScreen(nextScreen);
  }

  function handleDialogKeyDown(event: React.KeyboardEvent<HTMLElement>, closeDialog: () => void) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'),
    ).filter((element) => element.getClientRects().length > 0);

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (document.activeElement === event.currentTarget) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return;
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function closeClosingFrame() {
    setIsClosingFrameOpen(false);
    window.requestAnimationFrame(() => {
      const nextTarget = document.querySelector<HTMLElement>('.archive-item')
        ?? document.querySelector<HTMLElement>('.archive-heading .ink-button');
      nextTarget?.focus();
    });
  }

  function beginAssignment(id: string) {
    const assignment = ASSIGNMENTS.find((item) => item.id === id) ?? ASSIGNMENTS[0];
    deskSound.current?.cue('call');
    draftRevisionRef.current += 1;
    setSelectedId(id);
    setSelectedAngleId(null);
    setActiveDispatchId(null);
    setEditorFailed(false);
    setEditorReady(false);
    setEditorStatus('Lock an angle to open the image desk.');
    preloadImageEditor();
    prefetchPlate(assignment.image);
    advanceProgress(2);
    setScreen('edit');
  }

  function browseFieldCalls() {
    advanceProgress(1);
    setScreen('calls');
  }

  function retryEditor() {
    if (publishingRef.current || angleTransitionRef.current) return;
    draftRevisionRef.current += 1;
    resetImageEditorModule();
    setEditorComponent(createImageEditor);
    setEditorFailed(false);
    setEditorReady(false);
    setEditorStatus('Reloading the field plate…');
    setEditorAttempt((attempt) => attempt + 1);
  }

  async function lockAngle(angleId: string) {
    const nextAngle = selected.angles.find((angle) => angle.id === angleId);
    if (!nextAngle || nextAngle.id === selectedAngle?.id || publishingRef.current || angleTransitionRef.current) return;

    const editor = imageEditorRef.current?.editor;
    if (selectedAngle && editor?.hasChanges()) {
      const shouldDiscard = await askDiscard('Changing the Angle Lock clears the marks on this plate. Discard those marks and relock the lead?');
      if (!shouldDiscard) return;
      angleTransitionRef.current = true;
      setEditorStatus('Clearing the old marks before the new lead is locked…');
      try {
        await editor.reset(selected.image);
      } catch {
        setEditorFailed(true);
        setEditorReady(false);
        setEditorStatus('The plate could not be reset safely. Retry the image desk before making another mark.');
        return;
      } finally {
        angleTransitionRef.current = false;
      }
      if (imageEditorRef.current?.editor !== editor) return;
    }

    draftRevisionRef.current += 1;
    setSelectedAngleId(nextAngle.id);
    setEditorFailed(false);
    setEditorStatus(`Angle locked: ${nextAngle.label}. Follow the three-move route, then Save.`);
  }

  async function leaveEditorAfterCancel() {
    if (publishingRef.current || angleTransitionRef.current) {
      setEditorStatus('The image desk is finishing the current operation. Cancel after it settles.');
      return;
    }
    if (imageEditorRef.current?.editor?.hasChanges()) {
      const shouldDiscard = await askDiscard('This field plate has unpublished marks. Discard them and return to the calls?');
      if (!shouldDiscard) return;
    }
    draftRevisionRef.current += 1;
    setSelectedAngleId(null);
    setActiveDispatchId(null);
    setEditorReady(false);
    setEditorFailed(false);
    setEditorStatus('Lock an angle to open the image desk.');
    setScreen('calls');
  }

  async function publishDispatch({ dataUrl, blob }: ImageEditorSaveResult) {
    const editor = imageEditorRef.current?.editor;
    if (publishingRef.current || angleTransitionRef.current) return;
    if (!editor || !selectedAngle) return;
    if (!dataUrl || !blob) {
      setEditorStatus('The editor returned an empty export. Save once more from the image desk.');
      return;
    }
    const draftRevision = draftRevisionRef.current;
    publishingRef.current = true;

    // Object tools commit their active layer immediately after invoking onSave.
    // Two frames lets that internal transaction reach the public history state.
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
    });

    if (draftRevisionRef.current !== draftRevision || imageEditorRef.current?.editor !== editor) {
      publishingRef.current = false;
      return;
    }

    if (!editor.hasChanges()) {
      publishingRef.current = false;
      setEditorStatus('The desk needs one visible editorial move before it can print. Use Crop, Filter, Draw, Text, Shapes, or Frame.');
      return;
    }

    setIsPublishing(true);
    setIsPressRunning(true);
    deskSound.current?.cue('press');
    setEditorStatus('Developing the exact Unlayer export…');
    try {
      // The press run covers the real measurement work. It is held to a
      // floor so the reveal always lands as a beat rather than a jump cut.
      const region = leadRegion(selected.id, selectedAngle.id);
      const [exportDetails, leadMeasurement] = await Promise.all([
        inspectExport(dataUrl, blob, selected.baseLuminance),
        measureLead(selected.image, blob, region),
        new Promise((resolve) => window.setTimeout(resolve, 900)),
      ]);
      if (draftRevisionRef.current !== draftRevision || imageEditorRef.current?.editor !== editor) {
        setEditorStatus('That draft was replaced before it reached the press. Save the current plate again.');
        return;
      }
      const extension = imageExtension(dataUrl);
      const dispatch: Dispatch = {
        id: `${selected.id}-${Date.now()}`,
        assignmentId: selected.id,
        angleId: selectedAngle.id,
        image: dataUrl,
        issue: `${selected.issue}.${String(dispatches.length + 1).padStart(2, '0')}`,
        createdAt: filedAt(selected.time, dispatches.length),
        angleLabel: selectedAngle.label,
        angleOutcome: selectedAngle.outcome,
        angleStamp: selectedAngle.stamp,
        closingLead: selectedAngle.closingLead,
        closingEmphasis: selectedAngle.closingEmphasis,
        closingDeck: selectedAngle.closingDeck,
        plateCode: exportDetails.plateCode,
        byteSize: blob.size,
        mimeType: blob.type || `image/${extension === 'jpg' ? 'jpeg' : extension}`,
        width: exportDetails.width,
        height: exportDetails.height,
        press: exportDetails.press,
        lead: readLead(
          leadMeasurement.insideChange,
          leadMeasurement.outsideChange,
          region?.subject ?? null,
          leadMeasurement.recropped,
        ),
      };

      setDispatches((current) => [dispatch, ...current]);
      setActiveDispatchId(dispatch.id);
      draftRevisionRef.current += 1;
      advanceProgress(3);
      setScreen('reveal');
      deskSound.current?.cue('stamp');
    } catch {
      setEditorStatus('The export returned, but the press ledger could not file it. Save once more.');
    } finally {
      publishingRef.current = false;
      setIsPublishing(false);
      setIsPressRunning(false);
    }
  }

  function openArchivedDispatch(dispatch: Dispatch) {
    setSelectedId(dispatch.assignmentId);
    setSelectedAngleId(dispatch.angleId);
    setActiveDispatchId(dispatch.id);
    setIsClosingFrameOpen(false);
    setScreen('reveal');
  }

  async function downloadDispatch() {
    if (!activeDispatch) return;
    // A large base64 data: URL is an unreliable <a download> target, so the
    // exact export is handed over as a Blob URL instead. The bytes are
    // untouched either way.
    const issueSlug = activeDispatch.issue.toLowerCase().replace(/[\s.]+/g, '-');
    const name = `saltline-${activeAssignment.id}-${issueSlug}.${imageExtension(activeDispatch.image)}`;

    try {
      const blob = await (await fetch(activeDispatch.image)).blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      setDeskNotice('That plate could not be handed over. Try the front-page download instead.');
    }
  }

  async function downloadFrontPage() {
    if (!activeDispatch) return;
    setIsPublishing(true);
    try {
      const image = await loadCanvasImage(activeDispatch.image);
      const blob = await renderFrontPage(
        {
          issue: activeDispatch.issue,
          createdAt: activeDispatch.createdAt,
          plateCode: activeDispatch.plateCode,
          place: activeAssignment.place,
          angleStamp: activeDispatch.angleStamp,
          closingLead: activeDispatch.closingLead,
          closingEmphasis: activeDispatch.closingEmphasis,
          closingDeck: activeDispatch.closingDeck,
          play: activeDispatch.press.play,
          playLabel: activeDispatch.press.playLabel,
          toneLabel: activeDispatch.press.toneLabel,
          ledgerLine: pressLedgerLine(activeDispatch.press),
        },
        image,
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `saltline-${activeAssignment.id}-${activeDispatch.issue.toLowerCase().replace(/[\s.]+/g, '-')}-front-page.png`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      setDeskNotice('The front page could not be developed. Your exact plate is still safe and can be downloaded.');
    } finally {
      setIsPublishing(false);
    }
  }

  const currentStep = steps.findIndex((step) => step.id === screen);

  return (
    <main className="saltline">
      <div className="paper-noise" aria-hidden="true" />
      <header className="topbar">
        <button className="wordmark" onClick={() => navigateTo('desk')} aria-label="Return to the Saltline night desk">
          <span className="wordmark-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>SALTLINE</span>
          <small>night edition</small>
        </button>
        <div className="topbar-meta" aria-label="Current edition information">
          <span>ISSUE 04</span>
          <span className="meta-dot" aria-hidden="true" />
          <span>COASTAL DESK</span>
          <span className="meta-dot" aria-hidden="true" />
          <span>NO ACCOUNTS. NO ALIBIS.</span>
        </div>
        <button
          className={`desk-sound ${soundOn ? 'is-on' : ''}`}
          onClick={() => void toggleSound()}
          aria-pressed={soundOn}
          title="Three short desk noises: a call landing, the press, and the stamp. No soundtrack."
        >
          <span className="desk-sound-bars" aria-hidden="true"><i /><i /><i /></span>
          <span>{soundOn ? 'DESK SOUND ON' : 'DESK SOUND OFF'}</span>
        </button>
        <button className="archive-count" onClick={() => navigateTo('archive')}>
          <span>ISSUE WALL</span>
          <b>{String(dispatches.length).padStart(2, '0')}</b>
        </button>
      </header>

      <nav className="process" aria-label="Saltline progress">
        {steps.map((step, index) => {
          const isAvailable = step.id === 'archive'
            || (index <= furthestStep && (step.id !== 'reveal' || Boolean(activeDispatch)));

          return (
            <button
              key={step.id}
              className={index === currentStep ? 'is-current' : index <= furthestStep ? 'is-done' : ''}
              onClick={() => {
                if (isAvailable) navigateTo(step.id);
              }}
              disabled={!isAvailable}
              aria-current={index === currentStep ? 'step' : undefined}
            >
              <span>{step.number}</span>
              {step.label}
            </button>
          );
        })}
      </nav>

      {screen === 'desk' && (
        <section ref={screenRef} className="desk-screen screen" aria-labelledby="desk-title" tabIndex={-1}>
          <div className="desk-copy">
            <p className="eyebrow">Cala Verda / live case desk / 02:13</p>
            <h1 id="desk-title">The city plays dumb.<br /><em>Make the proof loud.</em></h1>
            <p className="intro">Five late-night calls. Two defensible truths inside every field plate. Lock the lead, use React Image Editor to make it visible, and your exact saved image decides what Cala Verda wakes up believing.</p>
            <div className="run-card" aria-label="How to complete tonight's run">
              <span className="run-card-label">Desk rule / two truths, one print</span>
              <ol>
                <li><b>01</b><span>Pick one late-night case.</span></li>
                <li><b>02</b><span>Lock a story angle, then frame and mark the evidence.</span></li>
                <li><b>03</b><span>Save it. Your exact export and angle hit the issue wall.</span></li>
              </ol>
            </div>
            <div className="desk-actions">
              <button ref={startButtonRef} className="ink-button" onClick={browseFieldCalls}>Start tonight&apos;s run <span>→</span></button>
              <span className="edition-note">5 cases<br />1 print to make</span>
            </div>
          </div>
          <div className="desk-plate" aria-hidden="true">
            <img
              className="desk-hero-image"
              src="/images/display/cala-verda-hero-1536.webp"
              srcSet="/images/display/cala-verda-hero-768.webp 768w, /images/display/cala-verda-hero-1536.webp 1536w"
              sizes="(max-width: 950px) 100vw, 55vw"
              width="1536"
              height="1024"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              alt=""
            />
            <div className="hero-ink-wash" />
            <div className="plate-strip plate-strip-one">THE WATER REMEMBERS</div>
            <div className="plate-strip plate-strip-two">CALA VERDA / 02:13</div>
            <div className="plate-stamp">S<br />L</div>
          </div>
          <p className="desk-footer">Not a hero. A witness with an editor, a deadline, and one chance to make the city talk.</p>
        </section>
      )}

      {screen === 'calls' && (
        <section ref={screenRef} className="calls-screen screen" aria-labelledby="calls-title" tabIndex={-1}>
          <div className="calls-heading">
            <div>
              <p className="eyebrow">Step 02 / five field calls</p>
              <h1 id="calls-title">Choose the story<br />the city wants buried.</h1>
            </div>
            <p>Five original field plates. One goes through the editor, into print, and onto the city wall. Replay any call to tell a different version.</p>
          </div>
          <div className="call-list">
            {ASSIGNMENTS.map((assignment, index) => (
              <article
                className={`call-card accent-${assignment.accent}`}
                key={assignment.id}
              >
                <button
                  className="call-card-select"
                  onClick={() => beginAssignment(assignment.id)}
                  onPointerDown={() => prefetchPlate(assignment.image)}
                  aria-label={`Open ${assignment.title} in the evidence editor`}
                >
                  <span className="call-index">0{index + 1}</span>
                  <span className="call-time">{assignment.time}</span>
                  <span className="call-image">
                    <img
                      src={assignment.preview}
                      width="768"
                      height="512"
                      loading="lazy"
                      decoding="async"
                      alt=""
                    />
                  </span>
                  <span className="call-place">{assignment.call} / {assignment.place}</span>
                  <strong>{assignment.title}</strong>
                  <span className="call-deck">{assignment.deck}</span>
                  <span className="call-pick">Open evidence desk <b>↗</b></span>
                </button>
              </article>
            ))}
          </div>
          <p className="call-footer">Choose a card to open its field plate. There is no case-selection step after this one.</p>
        </section>
      )}

      {screen === 'edit' && (
        <section ref={screenRef} className="edit-screen screen" aria-labelledby="edit-title" tabIndex={-1}>
          <aside className="edit-brief">
            <button className="back-button" onClick={() => navigateTo('calls')}>← Field calls</button>
            <p className="eyebrow">Step 03 / {selected.call} / {selected.time}</p>
            <h1 id="edit-title">{selected.title}</h1>
            <p className="edit-place">{selected.place}</p>
            <p className={`edit-prompt ${selectedAngle ? 'is-locked' : ''}`}>“{selectedAngle?.prompt ?? selected.prompt}”</p>
            {selectedAngle ? (
              <>
                <div className="angle-lock-summary">
                  <span>ANGLE LOCK / {selectedAngle.label}</span>
                  <div className="angle-options" role="group" aria-label="Change the dispatch angle">
                    {selected.angles.map((angle) => (
                      <button key={angle.id} type="button" className={angle.id === selectedAngle.id ? 'is-selected' : ''} onClick={() => lockAngle(angle.id)} aria-pressed={angle.id === selectedAngle.id}>{angle.label}</button>
                    ))}
                  </div>
                </div>
                <ol className="editor-moves tool-route" aria-label={`${selectedAngle.label} suggested tool route`}>
                  {selectedAngle.moves.map((move, index) => (
                    <li key={`${move.tool}-${index}`}><b>0{index + 1}</b><span className="move-copy"><strong>{move.tool}</strong>{move.instruction}</span></li>
                  ))}
                </ol>
              </>
            ) : (
              <div className="angle-lock-note">
                <b>ANGLE LOCK REQUIRED</b>
                <p>Choose what this image proves. The lead changes the edit route, the printed stamp, and what happens next.</p>
              </div>
            )}
            <p className="editor-status" role="status">{editorStatus}</p>
            {editorFailed && <button className="retry-button" onClick={retryEditor}>Retry editor →</button>}
          </aside>
          <EditorStage
            EditorComponent={EditorComponent}
            assignment={selected}
            angle={selectedAngle}
            editorRef={imageEditorRef}
            editorAttempt={editorAttempt}
            editorReady={editorReady}
            editorFailed={editorFailed}
            isPublishing={isPublishing}
            onLockAngle={(angleId) => void lockAngle(angleId)}
            onEditorCrash={() => {
              setEditorFailed(true);
              setEditorReady(false);
              setEditorStatus('The image desk module was interrupted. Retry when the connection is ready.');
            }}
            onEditorLoad={() => {
              setEditorFailed(false);
              setEditorReady(true);
              setEditorStatus('Image desk connected. Make the locked lead visible, then Save.');
            }}
            onEditorLoadError={() => {
              setEditorFailed(true);
              setEditorReady(false);
              setEditorStatus('The field plate did not load. Retry the editor or return to the cases.');
            }}
            onEditorError={() => {
              setEditorFailed(true);
              setEditorReady(false);
              setEditorStatus('The image desk could not open. Retry the editor when the connection is ready.');
            }}
            onSave={(result) => void publishDispatch(result)}
            onCancel={leaveEditorAfterCancel}
          />
        </section>
      )}

      {screen === 'reveal' && activeDispatch && (
        <section ref={screenRef} className="reveal-screen screen" aria-labelledby="reveal-title" tabIndex={-1}>
          <div className="reveal-aside">
            <p className="eyebrow">Step 04 / published at {activeDispatch.createdAt}</p>
            <h1 id="reveal-title">Your edit is<br /><em>on the record.</em></h1>
            <p>{activeDispatch.angleOutcome}</p>
            <p className="reveal-angle">ANGLE LOCKED / {activeDispatch.angleLabel}</p>
            <p className={`lead-call lead-${activeDispatch.lead.verdict}`}>
              <b>{activeDispatch.lead.verdictLabel}</b>
              {activeDispatch.lead.subject ? <em>You locked {activeDispatch.lead.subject}.</em> : null}
              {activeDispatch.lead.verdictNote}
            </p>
            <p className="press-call"><b>{activeDispatch.press.playLabel}</b> {activeDispatch.press.playNote}</p>
            <div className="proof-pair" aria-label="Original field plate compared with the exact saved editor export">
              <figure>
                <img src={activeAssignment.preview} width="768" height="512" decoding="async" alt={`Original field plate for ${activeAssignment.title}`} />
                <figcaption>01 / FIELD SOURCE</figcaption>
              </figure>
              <span aria-hidden="true">→</span>
              <figure>
                <img src={activeDispatch.image} decoding="async" alt={`Small proof of the exact saved ${activeAssignment.title} export`} />
                <figcaption>02 / UNLAYER EXPORT</figcaption>
              </figure>
            </div>
            <p className="reveal-proof">The image at right is the exact flattened <b>dataUrl</b> returned by React Image Editor. Saltline&apos;s paper and stamp sit around it; they never replace or crop it.</p>
            <dl className="export-ledger">
              <div><dt>PLATE</dt><dd>{activeDispatch.plateCode}</dd></div>
              <div><dt>EXPORT</dt><dd>{activeDispatch.width && activeDispatch.height ? `${activeDispatch.width} × ${activeDispatch.height}` : 'FLATTENED'} / {activeDispatch.mimeType.replace('image/', '').toUpperCase()} / {formatBytes(activeDispatch.byteSize)}</dd></div>
              <div><dt>PRESS</dt><dd>{pressLedgerLine(activeDispatch.press)}</dd></div>
              <div><dt>LEAD</dt><dd>{leadLedgerLine(activeDispatch.lead)}</dd></div>
            </dl>
            <div className="reveal-actions">
              <button className="ink-button" onClick={() => { advanceProgress(4); setScreen('archive'); setIsClosingFrameOpen(true); }}>Close the edition <span>→</span></button>
              <button className="text-button" disabled={isPublishing} onClick={() => void downloadFrontPage()}>{isPublishing ? 'Developing front page…' : 'Download front page ↓'}</button>
              <button className="text-button" onClick={() => void downloadDispatch()}>Keep exact plate ↓</button>
            </div>
          </div>
          <article className={`printed-dispatch accent-${activeAssignment.accent}`}>
            <div className="dispatch-masthead"><span>SALTLINE / NIGHT EDITION / {activeDispatch.plateCode}</span><b>{activeDispatch.issue}</b></div>
            <div className="dispatch-image"><img src={activeDispatch.image} decoding="async" alt={`Edited dispatch for ${activeAssignment.title}`} /></div>
            <div className="dispatch-caption"><span>{activeAssignment.place}</span><span>{activeDispatch.angleStamp}. EXACT UNLAYER EXPORT ON FILE.</span></div>
            <div className="dispatch-stamp">{activeDispatch.angleStamp}<br />{activeDispatch.createdAt}</div>
          </article>
        </section>
      )}

      {screen === 'archive' && (
        <section ref={screenRef} className="archive-screen screen" aria-labelledby="archive-title" tabIndex={-1}>
          <div className="archive-heading">
            <div>
              <p className="eyebrow">Step 05 / night edition archive</p>
              <h1 id="archive-title">Your version has<br /><em>a place in the city.</em></h1>
            </div>
            <button className="ink-button" onClick={browseFieldCalls}>Run another case <span>→</span></button>
          </div>
          {dispatches.length ? (
            <div className="archive-wall">
              {dispatches.map((dispatch, index) => {
                const assignment = ASSIGNMENTS.find((item) => item.id === dispatch.assignmentId) ?? ASSIGNMENTS[0];
                return (
                  <button
                    key={dispatch.id}
                    className={`archive-item accent-${assignment.accent}`}
                    style={{ '--turn': `${index % 2 ? 1.8 : -1.5}deg` } as React.CSSProperties}
                    onClick={() => openArchivedDispatch(dispatch)}
                  >
                    <img src={dispatch.image} loading="lazy" decoding="async" alt={`Open saved ${assignment.title} dispatch`} />
                    <span>{dispatch.issue} / {assignment.title}</span>
                    <i>{dispatch.angleStamp} / {dispatch.createdAt}</i>
                    <small>{dispatch.angleOutcome}</small>
                    <b>{dispatch.plateCode}</b>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="empty-wall">
              <span>NO PLATES YET</span>
              <p>The wall starts empty. Take a field call, work the plate, and make the first mark that lasts.</p>
              <button className="text-button" onClick={browseFieldCalls}>Open field calls →</button>
            </div>
          )}
        </section>
      )}

      {deskNotice && (
        <div className="desk-notice" role="alert">
          <p>{deskNotice}</p>
          <button onClick={() => setDeskNotice('')} aria-label="Dismiss desk notice">CLOSE ×</button>
        </div>
      )}

      {discardAsk && (
        <div className="discard-ask" role="dialog" aria-modal="true" aria-labelledby="discard-title">
          <div className="discard-sheet">
            <p className="eyebrow">SALTLINE / NIGHT DESK</p>
            <h2 id="discard-title">Spike these marks?</h2>
            <p>{discardAsk.message}</p>
            <div className="discard-actions">
              <button className="ink-button" onClick={() => answerDiscard(true)} autoFocus>Spike the marks <span>→</span></button>
              <button className="text-button" onClick={() => answerDiscard(false)}>Keep working the plate</button>
            </div>
          </div>
        </div>
      )}

      {isPressRunning && (
        <div className="press-run" role="status" aria-live="polite">
          <div className="press-run-inner">
            <p>SALTLINE / NIGHT PRESS</p>
            <h2>Running your plate.</h2>
            <span>Measuring the exact Unlayer export and setting the page.</span>
          </div>
        </div>
      )}

      {isClosingFrameOpen && screen === 'archive' && activeDispatch && (
        <section
          ref={closingDialogRef}
          className="closing-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="closing-title"
          tabIndex={-1}
          onKeyDown={(event) => handleDialogKeyDown(event, closeClosingFrame)}
        >
          <article className="closing-sheet">
            <div className="closing-masthead"><span>ISSUE 04 / CLOSING FRAME / {activeDispatch.plateCode}</span><span>{activeDispatch.angleStamp}</span></div>
            <div className="closing-panels">
              <figure className="closing-image"><img src={activeDispatch.image} decoding="async" alt={`Saved closing frame for ${activeAssignment.title}`} /><figcaption>{activeAssignment.place} / {activeDispatch.createdAt}</figcaption></figure>
              <div className="closing-copy"><p className="eyebrow">The print is dry. The city is not.</p><h2 id="closing-title">{activeDispatch.closingLead}<br /><em>{activeDispatch.closingEmphasis}</em></h2><p>{activeDispatch.closingDeck}</p><div className="closing-sound">TIDE / TRAFFIC / PAPER</div></div>
            </div>
            <div className="closing-footer"><span>NOT A HERO. A WITNESS WITH A PRINT RUN.</span><button className="ink-button" onClick={closeClosingFrame}>File the night <span>→</span></button></div>
          </article>
        </section>
      )}
    </main>
  );
}
