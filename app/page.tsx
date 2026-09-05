/* eslint-disable @next/next/no-img-element -- editor exports are user-specific data URLs and must remain unoptimized. */
'use client';

import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';

type Screen = 'desk' | 'calls' | 'edit' | 'reveal' | 'archive';
type Instinct = 'person' | 'object';

type Angle = {
  id: string;
  label: string;
  prompt: string;
  outcome: string;
  stamp: string;
};

type Assignment = {
  id: string;
  issue: string;
  call: string;
  time: string;
  place: string;
  title: string;
  deck: string;
  prompt: string;
  outcome: string;
  image: string;
  preview: string;
  accent: 'coral' | 'teal' | 'gold';
  angles: Angle[];
};

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
};

const ASSIGNMENTS: Assignment[] = [
  {
    id: 'wake-tax',
    issue: 'ISSUE 04',
    call: 'CALL 01',
    time: '02:13',
    place: 'Bellwether Pier',
    title: 'Wake Tax',
    deck: 'Nacre Bay Boat Club says its pleasure launch never cut the ferry lane. The whole pier watched it sprint past the toll buoy.',
    prompt: 'Keep the ferry. Lose the alibi. Make the water look guilty.',
    outcome: 'The ferry master clipped your plate to the manifest before sunrise. Two hours later, the boat was moored under a borrowed name.',
    image: '/images/wake-tax.png',
    preview: '/images/display/wake-tax-768.webp',
    accent: 'coral',
    angles: [
      { id: 'expose-launch', label: 'Expose the launch', prompt: 'Center the pleasure launch. Let the ferry lane tell on it.', outcome: 'The ferry master clipped your plate to the manifest before sunrise. Two hours later, the boat was moored under a borrowed name.', stamp: 'LAUNCH EXPOSED' },
      { id: 'protect-crew', label: 'Protect the ferry crew', prompt: 'Keep the ferry in frame. Make the boat club carry the blame.', outcome: 'The crew made the first crossing untouched. By breakfast, the boat club had sent three lawyers and one silent apology.', stamp: 'CREW PROTECTED' },
    ],
  },
  {
    id: 'room-08',
    issue: 'ISSUE 04',
    call: 'CALL 02',
    time: '02:19',
    place: 'Morrow Court',
    title: 'Room 08',
    deck: 'A white coupe waited outside Paradise Slabs Motor Court. The balcony light blinked once. The pool kept the rest of the story.',
    prompt: 'Hold the witness. Cut the noise. Leave one question open.',
    outcome: 'By breakfast the manager had changed the key cards. The person behind the door left a damp matchbook on the desk with no room number.',
    image: '/images/room-08.png',
    preview: '/images/display/room-08-768.webp',
    accent: 'teal',
    angles: [
      { id: 'show-witness', label: 'Show the witness', prompt: 'Hold the balcony. Let the witness stay visible through the noise.', outcome: 'By breakfast the manager had changed the key cards. The person behind the door left a damp matchbook on the desk with no room number.', stamp: 'WITNESS SHOWN' },
      { id: 'hide-witness', label: 'Hide the witness', prompt: 'Cut the balcony loose. Put the reflection, not the person, on the record.', outcome: 'The coupe disappeared before dawn. The pool reflection remained, sharp enough for the night desk and nobody else.', stamp: 'WITNESS HELD' },
    ],
  },
  {
    id: 'after-rain',
    issue: 'ISSUE 04',
    call: 'CALL 03',
    time: '02:27',
    place: 'Cormorant Carnival',
    title: 'After the Rain',
    deck: 'Floodwater returns a silver mask that the Cala Cielo Carnival claims was never missing. Every witness has a different story.',
    prompt: 'Find the object. Follow the reflection. Do not clean it up.',
    outcome: 'The mask made the morning edition, then vanished from the evidence bag. A brass ticket appeared where it had been, stamped for a ride that has not existed in twelve years.',
    image: '/images/after-rain-daybreak.png',
    preview: '/images/display/after-rain-daybreak-768.webp',
    accent: 'gold',
    angles: [
      { id: 'publish-mask', label: 'Publish the mask', prompt: 'Find the mask. Let the morning city see what the carnival denied.', outcome: 'The mask made the morning edition, then vanished from the evidence bag. A brass ticket appeared where it had been, stamped for a ride that has not existed in twelve years.', stamp: 'MASK PUBLISHED' },
      { id: 'follow-courier', label: 'Follow the courier', prompt: 'Follow the courier through the reflection. Keep the mask as a warning, not the headline.', outcome: 'The courier crossed the service bridge at dawn. The carnival kept its mask, but the route was now on the record.', stamp: 'COURIER FOLLOWED' },
    ],
  },
  {
    id: 'undertow',
    issue: 'ISSUE 04',
    call: 'CALL 04',
    time: '02:34',
    place: 'Vesper Quay',
    title: 'Undertow',
    deck: 'A phone went into the tide behind a closed quay kiosk. Somebody stayed to watch it sink. Somebody else took the tender home.',
    prompt: 'Find the hand-off. Let the tide erase nothing.',
    outcome: 'At high tide the phone was gone, but the wet sleeve made the morning print. The tender owner stopped returning calls at 08:01.',
    image: '/images/undertow.png',
    preview: '/images/display/undertow-768.webp',
    accent: 'teal',
    angles: [
      { id: 'print-handoff', label: 'Print the hand-off', prompt: 'Frame the phone and wet sleeve. Make the exchange impossible to deny.', outcome: 'At high tide the phone was gone, but the wet sleeve made the morning print. The tender owner stopped returning calls at 08:01.', stamp: 'HAND-OFF PRINTED' },
      { id: 'follow-tender', label: 'Follow the tender', prompt: 'Let the phone fall away. Hold the watcher and the tender in the same story.', outcome: 'The tender left before dawn. Its wake cut straight past the quay cameras, but your plate preserved the one person who watched it go.', stamp: 'TENDER FOLLOWED' },
    ],
  },
  {
    id: 'off-the-meter',
    issue: 'ISSUE 04',
    call: 'CALL 05',
    time: '02:41',
    place: 'Northbelt Causeway',
    title: 'Off the Meter',
    deck: 'A shuttle meter kept ticking on an empty causeway. A coral ribbon flapped inside. Its driver was already walking toward the ferry.',
    prompt: 'Read the meter. Catch the route before it disappears.',
    outcome: 'The ferry crossed without the driver. At first light, the shuttle appeared two districts away with the same ribbon and a different fare.',
    image: '/images/off-the-meter.png',
    preview: '/images/display/off-the-meter-768.webp',
    accent: 'coral',
    angles: [
      { id: 'tag-driver', label: 'Tag the driver', prompt: 'Hold the driver against the ferry lights. Make the exit the whole story.', outcome: 'The ferry crossed without the driver. At first light, the shuttle appeared two districts away with the same ribbon and a different fare.', stamp: 'DRIVER TAGGED' },
      { id: 'map-route', label: 'Map the route', prompt: 'Keep the empty shuttle and the meter together. Let the route expose itself.', outcome: 'The meter kept running until noon. Its impossible fare drew a line through three districts and one sealed marina gate.', stamp: 'ROUTE MAPPED' },
    ],
  },
];

const ImageEditor = lazy(() => import('@unlayer/react-image-editor'));

const EDITOR_OPTIONS = {
  theme: 'dark' as const,
  features: {
    imageEditor: {
      dock: 'left' as const,
      tools: {
        crop: true,
        resize: false,
        filter: true,
        draw: true,
        text: true,
        shapes: true,
        stickers: true,
        frame: true,
      },
    },
  },
};

const steps: Array<{ id: Screen; label: string; number: string }> = [
  { id: 'desk', label: 'Briefing', number: '01' },
  { id: 'calls', label: 'Pick a case', number: '02' },
  { id: 'edit', label: 'Edit evidence', number: '03' },
  { id: 'reveal', label: 'Publish', number: '04' },
  { id: 'archive', label: 'Archive', number: '05' },
];

function formatTime() {
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

function imageExtension(dataUrl: string) {
  const mimeType = /^data:image\/(png|jpeg|webp);/i.exec(dataUrl)?.[1]?.toLowerCase();
  return mimeType === 'jpeg' ? 'jpg' : mimeType ?? 'png';
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>('desk');
  const [furthestStep, setFurthestStep] = useState(0);
  const [selectedId, setSelectedId] = useState(ASSIGNMENTS[0].id);
  const [selectedAngleId, setSelectedAngleId] = useState(ASSIGNMENTS[0].angles[0].id);
  const [briefingStep, setBriefingStep] = useState<'instinct' | 'loop'>('instinct');
  const [instinct, setInstinct] = useState<Instinct | null>(null);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [isClosingFrameOpen, setIsClosingFrameOpen] = useState(false);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [activeDispatchId, setActiveDispatchId] = useState<string | null>(null);
  const [editorStatus, setEditorStatus] = useState('Loading the field plate…');
  const [editorAttempt, setEditorAttempt] = useState(0);
  const [editorFailed, setEditorFailed] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const briefingDialogRef = useRef<HTMLElement>(null);
  const closingDialogRef = useRef<HTMLElement>(null);
  const screenRef = useRef<HTMLElement>(null);
  const previousScreen = useRef<Screen | null>(null);
  const prefetchedPlates = useRef(new Set<string>());

  useEffect(() => {
    window.scrollTo(0, 0);
    if (previousScreen.current) screenRef.current?.focus({ preventScroll: true });
    previousScreen.current = screen;
  }, [screen]);

  useEffect(() => {
    const dialog = isBriefingOpen
      ? briefingDialogRef.current
      : isClosingFrameOpen
        ? closingDialogRef.current
        : null;

    dialog?.focus({ preventScroll: true });
  }, [briefingStep, isBriefingOpen, isClosingFrameOpen]);

  useEffect(() => {
    if (!isBriefingOpen && !isClosingFrameOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isBriefingOpen, isClosingFrameOpen]);

  const selected = useMemo(
    () => ASSIGNMENTS.find((assignment) => assignment.id === selectedId) ?? ASSIGNMENTS[0],
    [selectedId],
  );

  const activeDispatch = useMemo(
    () => dispatches.find((dispatch) => dispatch.id === activeDispatchId) ?? null,
    [activeDispatchId, dispatches],
  );

  const selectedAngle = useMemo(
    () => selected.angles.find((angle) => angle.id === selectedAngleId) ?? selected.angles[0],
    [selected, selectedAngleId],
  );

  const recommendedAssignment = useMemo(
    () => ASSIGNMENTS.find((assignment) => assignment.id === (instinct === 'person' ? 'room-08' : 'after-rain')) ?? ASSIGNMENTS[0],
    [instinct],
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

  function navigateTo(nextScreen: Screen) {
    if (nextScreen === 'reveal' && !activeDispatch) return;
    if (nextScreen === 'edit' && screen !== 'edit') {
      setEditorFailed(false);
      setEditorReady(false);
      setEditorStatus('Loading the field plate…');
    }
    setIsBriefingOpen(false);
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

  function closeBriefing() {
    setIsBriefingOpen(false);
    window.requestAnimationFrame(() => startButtonRef.current?.focus());
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
    setSelectedId(id);
    setSelectedAngleId(assignment.angles[0].id);
    setEditorFailed(false);
    setEditorReady(false);
    setEditorStatus('Loading the field plate…');
    prefetchPlate(assignment.image);
    advanceProgress(2);
    setScreen('edit');
  }

  function openRecommendedAssignment() {
    setIsBriefingOpen(false);
    beginAssignment(recommendedAssignment.id);
  }

  function browseFieldCalls() {
    setIsBriefingOpen(false);
    advanceProgress(1);
    setScreen('calls');
  }

  function startTonightRun() {
    setInstinct(null);
    setBriefingStep('instinct');
    setIsBriefingOpen(true);
  }

  function chooseInstinct(nextInstinct: Instinct) {
    setInstinct(nextInstinct);
  }

  function openBriefingLoop() {
    if (!instinct) return;
    setBriefingStep('loop');
  }

  function retryEditor() {
    setEditorFailed(false);
    setEditorReady(false);
    setEditorStatus('Reloading the field plate…');
    setEditorAttempt((attempt) => attempt + 1);
  }

  function publishDispatch(image: string) {
    if (!image) return;

    const dispatch: Dispatch = {
      id: `${selected.id}-${Date.now()}`,
      assignmentId: selected.id,
      angleId: selectedAngle.id,
      image,
      issue: `${selected.issue}.${String(dispatches.length + 1).padStart(2, '0')}`,
      createdAt: formatTime(),
      angleLabel: selectedAngle.label,
      angleOutcome: selectedAngle.outcome,
      angleStamp: selectedAngle.stamp,
    };

    setDispatches((current) => [dispatch, ...current]);
    setActiveDispatchId(dispatch.id);
    advanceProgress(3);
    setScreen('reveal');
  }

  function downloadDispatch() {
    if (!activeDispatch) return;
    const link = document.createElement('a');
    link.href = activeDispatch.image;
    const issueSlug = activeDispatch.issue.toLowerCase().replace(/\s+/g, '-');
    link.download = `saltline-${activeAssignment.id}-${issueSlug}.${imageExtension(activeDispatch.image)}`;
    link.click();
  }

  const currentStep = steps.findIndex((step) => step.id === screen);

  return (
    <main className={`saltline ${screen === 'edit' ? 'is-editing' : ''}`}>
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
            <p className="intro">Saltline is an original coastal-crime dispatch in a boomtown of marina money, motel alibis, and bad decisions. Your job is simple: turn one field image into the version of the night that survives.</p>
            <div className="run-card" aria-label="How to complete tonight's run">
              <span className="run-card-label">Tonight&apos;s run</span>
              <ol>
                <li><b>01</b><span>Pick one late-night case.</span></li>
                <li><b>02</b><span>Lock a story angle, then frame and mark the evidence.</span></li>
                <li><b>03</b><span>Save it. Your exact export and angle hit the issue wall.</span></li>
              </ol>
            </div>
            <div className="desk-actions">
              <button ref={startButtonRef} className="ink-button" onClick={startTonightRun}>Start tonight&apos;s run <span>→</span></button>
              <span className="edition-note">5 cases<br />1 saved dispatch</span>
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
            <p className="edit-prompt">“{selectedAngle.prompt}”</p>
            <ol className="editor-moves">
              <li><b>01</b><span className="move-copy"><strong>Frame the proof</strong>Crop toward the thing that matters.</span></li>
              <li className="angle-lock"><b>02</b><div className="move-copy"><strong>Lock the lead</strong><div className="angle-options" role="group" aria-label="Choose the dispatch lead">{selected.angles.map((angle) => <button key={angle.id} type="button" className={angle.id === selectedAngle.id ? 'is-selected' : ''} onClick={() => setSelectedAngleId(angle.id)} aria-pressed={angle.id === selectedAngle.id}>{angle.label}</button>)}</div><small>This changes the brief, printed lead, and outcome.</small></div></li>
              <li><b>03</b><span className="move-copy"><strong>Save to publish</strong>Make the lead visible with a line, word, shape, or imperfect signal, then Save (✓) at top right.</span></li>
            </ol>
            <p className="editor-status" role="status">{editorStatus}</p>
            {editorFailed && <button className="retry-button" onClick={retryEditor}>Retry editor →</button>}
          </aside>
          <div className="editor-stage">
            <div className="editor-stage-bar">
              <span><i className="live-dot" /> STEP 03 / FIELD PLATE / ORIGINAL ART</span>
              <span>SAVE = PUBLISH</span>
            </div>
            <div className={`editor-shell ${editorReady ? 'is-ready' : ''}`} aria-busy={!editorReady && !editorFailed}>
              {!editorReady && (
                <div className="editor-loader" aria-hidden="true">
                  <img src={selected.preview} width="768" height="512" decoding="async" alt="" />
                  <div className="editor-loader-copy">
                    <span>FULL-RES FIELD PLATE</span>
                    <b>{editorFailed ? 'SIGNAL INTERRUPTED' : 'DEVELOPING AT THE NIGHT DESK'}</b>
                    <i />
                  </div>
                </div>
              )}
              <Suspense fallback={null}>
                <ImageEditor
                  key={`${selected.id}-${editorAttempt}`}
                  image={selected.image}
                  minHeight="min(58vh, 660px)"
                  options={EDITOR_OPTIONS}
                  onLoad={() => {
                    setEditorFailed(false);
                    setEditorReady(true);
                    setEditorStatus('The plate is live. Make a case, not a collage.');
                  }}
                  onLoadError={() => {
                    setEditorFailed(true);
                    setEditorReady(false);
                    setEditorStatus('The field plate did not load. Retry the editor or return to the cases.');
                  }}
                  onError={() => {
                    setEditorFailed(true);
                    setEditorReady(false);
                    setEditorStatus('The image desk could not open. Retry the editor when the connection is ready.');
                  }}
                  onSave={({ dataUrl }) => publishDispatch(dataUrl)}
                  onCancel={() => setEditorStatus('The press is still waiting. Your field plate stays on the desk.')}
                />
              </Suspense>
            </div>
            <div className="editor-actions">
              <p>Your single required move: add the signal you want, then click <strong>Save (✓)</strong> in the editor&apos;s top-right corner. There is no publish bypass.</p>
              <span className="save-cue" aria-hidden="true">SAVE ↑</span>
            </div>
          </div>
        </section>
      )}

      {screen === 'reveal' && activeDispatch && (
        <section ref={screenRef} className="reveal-screen screen" aria-labelledby="reveal-title" tabIndex={-1}>
          <div className="reveal-aside">
            <p className="eyebrow">Step 04 / published at {activeDispatch.createdAt}</p>
            <h1 id="reveal-title">Your edit is<br /><em>on the record.</em></h1>
            <p>{activeDispatch.angleOutcome}</p>
            <p className="reveal-angle">ANGLE LOCKED / {activeDispatch.angleLabel}</p>
            <div className="source-plate">
              <img src={activeAssignment.preview} width="768" height="512" decoding="async" alt={`Original field plate for ${activeAssignment.title}`} />
              <span><b>Original field plate</b>Your saved edit is the dispatch beside it.</span>
            </div>
            <p className="reveal-proof">This is the exact flattened image returned by React Image Editor. Saltline&apos;s paper and stamp sit around it; they never replace or crop it.</p>
            <div className="reveal-actions">
              <button className="ink-button" onClick={() => { advanceProgress(4); setScreen('archive'); setIsClosingFrameOpen(true); }}>Close the edition <span>→</span></button>
              <button className="text-button" onClick={downloadDispatch}>Download plate ↓</button>
            </div>
          </div>
          <article className={`printed-dispatch accent-${activeAssignment.accent}`}>
            <div className="dispatch-masthead"><span>SALTLINE / NIGHT EDITION</span><b>{activeDispatch.issue}</b></div>
            <div className="dispatch-image"><img src={activeDispatch.image} decoding="async" alt={`Edited dispatch for ${activeAssignment.title}`} /></div>
            <div className="dispatch-caption"><span>{activeAssignment.place}</span><span>{activeDispatch.angleStamp}. THE FIELD DESK DID NOT ALTER THE FACTS. ONLY THE LIGHT.</span></div>
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
                    onClick={() => {
                      setSelectedId(dispatch.assignmentId);
                      setSelectedAngleId(dispatch.angleId);
                      setActiveDispatchId(dispatch.id);
                      navigateTo('reveal');
                    }}
                  >
                    <img src={dispatch.image} loading="lazy" decoding="async" alt={`Open saved ${assignment.title} dispatch`} />
                    <span>{dispatch.issue} / {assignment.title}</span>
                    <i>{dispatch.angleStamp} / {dispatch.createdAt}</i>
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

      {isBriefingOpen && screen === 'desk' && (
        <section
          ref={briefingDialogRef}
          className="briefing-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="briefing-title"
          tabIndex={-1}
          onKeyDown={(event) => handleDialogKeyDown(event, closeBriefing)}
        >
          <div className="briefing-sheet">
            <div className="briefing-topline">
              <span>ISSUE 04 / FIRST SHIFT</span>
              <span className="overlay-controls">
                <span>{briefingStep === 'instinct' ? '01 / 02' : '02 / 02'}</span>
                <button className="overlay-close" onClick={closeBriefing} aria-label="Close the first-shift guide">CLOSE ×</button>
              </span>
            </div>
            {briefingStep === 'instinct' ? (
              <>
                <p className="eyebrow">The city gives you five calls. Start with an instinct.</p>
                <h2 id="briefing-title">What do you<br /><em>follow first?</em></h2>
                <div className="instinct-options" role="group" aria-label="Choose your first desk instinct">
                  <button className={instinct === 'person' ? 'is-selected' : ''} onClick={() => chooseInstinct('person')} aria-pressed={instinct === 'person'}><b>01</b><span><strong>Chase a person</strong>A balcony light, a missing driver, a witness who wants to vanish.</span></button>
                  <button className={instinct === 'object' ? 'is-selected' : ''} onClick={() => chooseInstinct('object')} aria-pressed={instinct === 'object'}><b>02</b><span><strong>Follow an object</strong>A mask, a phone, a ribbon. Things lie slower than people.</span></button>
                </div>
                <button className="ink-button briefing-next" disabled={!instinct} onClick={openBriefingLoop}>Set the desk instinct <span>→</span></button>
              </>
            ) : (
              <>
                <p className="eyebrow">Your first call is ready. The loop has one rule.</p>
                <h2 id="briefing-title">Print what the<br /><em>city will not.</em></h2>
                <ol className="briefing-loop">
                  <li><b>01</b><span><strong>Pick one of five calls</strong>There is no perfect case, only the one you put on the record.</span></li>
                  <li><b>02</b><span><strong>Lock the lead</strong>Your choice changes the brief, the outcome, and the issue stamp.</span></li>
                  <li><b>03</b><span><strong>Work the field plate</strong>Use the React Image Editor to make that lead visible before you save.</span></li>
                </ol>
                <p className="briefing-recommendation">YOUR FIRST LEAD / <b>{recommendedAssignment.title.toUpperCase()}</b></p>
                <div className="briefing-actions"><button className="ink-button" onClick={openRecommendedAssignment} onPointerDown={() => prefetchPlate(recommendedAssignment.image)}>Open {recommendedAssignment.title} <span>→</span></button><button className="text-button" onClick={browseFieldCalls}>Browse all five calls</button></div>
              </>
            )}
          </div>
        </section>
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
            <div className="closing-masthead"><span>ISSUE 04 / CLOSING FRAME</span><span>{activeDispatch.angleStamp}</span></div>
            <div className="closing-panels">
              <figure className="closing-image"><img src={activeDispatch.image} decoding="async" alt={`Saved closing frame for ${activeAssignment.title}`} /><figcaption>{activeAssignment.place} / {activeDispatch.createdAt}</figcaption></figure>
              <div className="closing-copy"><p className="eyebrow">The print is dry. The city is not.</p><h2 id="closing-title">First light finds<br /><em>the same lies.</em></h2><p>Your saved plate is now one of the stories Cala Verda has to wake up with.</p><div className="closing-sound">TIDE / TRAFFIC / PAPER</div></div>
            </div>
            <div className="closing-footer"><span>NOT A HERO. A WITNESS WITH A PRINT RUN.</span><button className="ink-button" onClick={closeClosingFrame}>File the night <span>→</span></button></div>
          </article>
        </section>
      )}
    </main>
  );
}
