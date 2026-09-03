/* eslint-disable @next/next/no-img-element -- editor exports are user-specific data URLs and must remain unoptimized. */
'use client';

import { useEffect, useMemo, useState } from 'react';
import ImageEditor from '@unlayer/react-image-editor';

type Screen = 'desk' | 'calls' | 'edit' | 'reveal' | 'archive';

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
  accent: 'coral' | 'teal' | 'gold';
  angles: Angle[];
};

type Dispatch = {
  id: string;
  assignmentId: string;
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
    accent: 'gold',
    angles: [
      { id: 'publish-mask', label: 'Publish the mask', prompt: 'Find the mask. Let the morning city see what the carnival denied.', outcome: 'The mask made the morning edition, then vanished from the evidence bag. A brass ticket appeared where it had been, stamped for a ride that has not existed in twelve years.', stamp: 'MASK PUBLISHED' },
      { id: 'follow-courier', label: 'Follow the courier', prompt: 'Follow the courier through the reflection. Keep the mask as a warning, not the headline.', outcome: 'The courier crossed the service bridge at dawn. The carnival kept its mask, but the route was now on the record.', stamp: 'COURIER FOLLOWED' },
    ],
  },
];

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

export default function Home() {
  const [screen, setScreen] = useState<Screen>('desk');
  const [selectedId, setSelectedId] = useState(ASSIGNMENTS[0].id);
  const [selectedAngleId, setSelectedAngleId] = useState(ASSIGNMENTS[0].angles[0].id);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [activeDispatchId, setActiveDispatchId] = useState<string | null>(null);
  const [editorStatus, setEditorStatus] = useState('Loading the field plate…');
  const [editorAttempt, setEditorAttempt] = useState(0);
  const [editorFailed, setEditorFailed] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

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

  const activeAssignment = useMemo(() => {
    const assignmentId = activeDispatch?.assignmentId ?? selected.id;
    return ASSIGNMENTS.find((assignment) => assignment.id === assignmentId) ?? selected;
  }, [activeDispatch, selected]);

  function beginAssignment(id: string) {
    const assignment = ASSIGNMENTS.find((item) => item.id === id) ?? ASSIGNMENTS[0];
    setSelectedId(id);
    setSelectedAngleId(assignment.angles[0].id);
    setEditorFailed(false);
    setEditorStatus('Loading the field plate…');
    setScreen('edit');
  }

  function retryEditor() {
    setEditorFailed(false);
    setEditorStatus('Reloading the field plate…');
    setEditorAttempt((attempt) => attempt + 1);
  }

  function publishDispatch(image: string) {
    if (!image) return;

    const dispatch: Dispatch = {
      id: `${selected.id}-${Date.now()}`,
      assignmentId: selected.id,
      image,
      issue: `${selected.issue}.${String(dispatches.length + 1).padStart(2, '0')}`,
      createdAt: formatTime(),
      angleLabel: selectedAngle.label,
      angleOutcome: selectedAngle.outcome,
      angleStamp: selectedAngle.stamp,
    };

    setDispatches((current) => [dispatch, ...current]);
    setActiveDispatchId(dispatch.id);
    setScreen('reveal');
  }

  function downloadDispatch() {
    if (!activeDispatch) return;
    const link = document.createElement('a');
    link.href = activeDispatch.image;
    link.download = `saltline-${activeAssignment.id}-${activeDispatch.issue.toLowerCase()}.png`;
    link.click();
  }

  const currentStep = steps.findIndex((step) => step.id === screen);

  return (
    <main className={`saltline ${screen === 'edit' ? 'is-editing' : ''}`}>
      <div className="paper-noise" aria-hidden="true" />
      <header className="topbar">
        <button className="wordmark" onClick={() => setScreen('desk')} aria-label="Return to the Saltline night desk">
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
        <button className="archive-count" onClick={() => setScreen('archive')}>
          <span>ISSUE WALL</span>
          <b>{String(dispatches.length).padStart(2, '0')}</b>
        </button>
      </header>

      <nav className="process" aria-label="Saltline progress">
        {steps.map((step, index) => (
          <button
            key={step.id}
            className={index === currentStep ? 'is-current' : index < currentStep ? 'is-done' : ''}
            onClick={() => {
              if (step.id === 'archive' || index <= currentStep) setScreen(step.id);
            }}
            disabled={index > currentStep && step.id !== 'archive'}
            aria-current={index === currentStep ? 'step' : undefined}
          >
            <span>{step.number}</span>
            {step.label}
          </button>
        ))}
      </nav>

      {screen === 'desk' && (
        <section className="desk-screen screen" aria-labelledby="desk-title">
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
              <button className="ink-button" onClick={() => setScreen('calls')}>Start tonight&apos;s run <span>→</span></button>
              <span className="edition-note">3 cases<br />1 saved dispatch</span>
            </div>
          </div>
          <div className="desk-plate" aria-hidden="true">
            <img className="desk-hero-image" src="/images/cala-verda-hero.png" alt="" />
            <div className="hero-ink-wash" />
            <div className="plate-strip plate-strip-one">THE WATER REMEMBERS</div>
            <div className="plate-strip plate-strip-two">CALA VERDA / 02:13</div>
            <div className="plate-stamp">S<br />L</div>
          </div>
          <p className="desk-footer">Not a hero. A witness with an editor, a deadline, and one chance to make the city talk.</p>
        </section>
      )}

      {screen === 'calls' && (
        <section className="calls-screen screen" aria-labelledby="calls-title">
          <div className="calls-heading">
            <div>
              <p className="eyebrow">Step 02 / one case per run</p>
              <h1 id="calls-title">Choose the story<br />the city wants buried.</h1>
            </div>
            <p>Each case starts with one original field plate. You will shape it in the editor, save it, and see that exact image become a published city dispatch.</p>
          </div>
          <div className="call-list">
            {ASSIGNMENTS.map((assignment, index) => (
              <article
                className={`call-card accent-${assignment.accent}`}
                key={assignment.id}
              >
                <button className="call-card-select" onClick={() => beginAssignment(assignment.id)} aria-label={`Open ${assignment.title} in the evidence editor`}>
                  <span className="call-index">0{index + 1}</span>
                  <span className="call-time">{assignment.time}</span>
                  <span className="call-image"><img src={assignment.image} alt="" /></span>
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
        <section className="edit-screen screen" aria-labelledby="edit-title">
          <aside className="edit-brief">
            <button className="back-button" onClick={() => setScreen('calls')}>← Field calls</button>
            <p className="eyebrow">Step 03 / {selected.call} / {selected.time}</p>
            <h1 id="edit-title">{selected.title}</h1>
            <p className="edit-place">{selected.place}</p>
            <p className="edit-prompt">“{selectedAngle.prompt}”</p>
            <ol className="editor-moves">
              <li><b>01</b><span className="move-copy"><strong>Frame the proof</strong>Crop toward the thing that matters.</span></li>
              <li className="angle-lock"><b>02</b><div className="move-copy"><strong>Lock the lead</strong><div className="angle-options" aria-label="Choose the dispatch lead">{selected.angles.map((angle) => <button key={angle.id} type="button" className={angle.id === selectedAngle.id ? 'is-selected' : ''} onClick={() => setSelectedAngleId(angle.id)} aria-pressed={angle.id === selectedAngle.id}>{angle.label}</button>)}</div><small>This changes the brief, printed lead, and outcome.</small></div></li>
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
            <div className="editor-shell">
              <ImageEditor
                key={`${selected.id}-${editorAttempt}`}
                image={selected.image}
                minHeight="min(58vh, 660px)"
                options={EDITOR_OPTIONS}
                onLoad={() => {
                  setEditorFailed(false);
                  setEditorStatus('The plate is live. Make a case, not a collage.');
                }}
                onLoadError={() => {
                  setEditorFailed(true);
                  setEditorStatus('The field plate did not load. Retry the editor or return to the cases.');
                }}
                onError={() => {
                  setEditorFailed(true);
                  setEditorStatus('The image desk could not open. Retry the editor when the connection is ready.');
                }}
                onSave={({ dataUrl }) => publishDispatch(dataUrl)}
                onCancel={() => setEditorStatus('The press is still waiting. Your field plate stays on the desk.')}
              />
            </div>
            <div className="editor-actions">
              <p>Your single required move: add the signal you want, then click <strong>Save (✓)</strong> in the editor&apos;s top-right corner. There is no publish bypass.</p>
              <span className="save-cue" aria-hidden="true">SAVE ↑</span>
            </div>
          </div>
        </section>
      )}

      {screen === 'reveal' && activeDispatch && (
        <section className="reveal-screen screen" aria-labelledby="reveal-title">
          <div className="reveal-aside">
            <p className="eyebrow">Step 04 / published at {activeDispatch.createdAt}</p>
            <h1 id="reveal-title">Your edit is<br /><em>on the record.</em></h1>
            <p>{activeDispatch.angleOutcome}</p>
            <p className="reveal-angle">ANGLE LOCKED / {activeDispatch.angleLabel}</p>
            <div className="source-plate">
              <img src={activeAssignment.image} alt={`Original field plate for ${activeAssignment.title}`} />
              <span><b>Original field plate</b>Your saved edit is the dispatch beside it.</span>
            </div>
            <p className="reveal-proof">This is the exact flattened image returned by React Image Editor. Pin it to the wall, or keep the plate.</p>
            <div className="reveal-actions">
              <button className="ink-button" onClick={() => setScreen('archive')}>Pin to issue wall <span>→</span></button>
              <button className="text-button" onClick={downloadDispatch}>Download plate ↓</button>
            </div>
          </div>
          <article className={`printed-dispatch accent-${activeAssignment.accent}`}>
            <div className="dispatch-masthead"><span>SALTLINE / NIGHT EDITION</span><b>{activeDispatch.issue}</b></div>
            <div className="dispatch-image"><img src={activeDispatch.image} alt={`Edited dispatch for ${activeAssignment.title}`} /></div>
            <div className="dispatch-caption"><span>{activeAssignment.place}</span><span>{activeDispatch.angleStamp}. THE FIELD DESK DID NOT ALTER THE FACTS. ONLY THE LIGHT.</span></div>
            <div className="dispatch-stamp">{activeDispatch.angleStamp}<br />{activeDispatch.createdAt}</div>
          </article>
        </section>
      )}

      {screen === 'archive' && (
        <section className="archive-screen screen" aria-labelledby="archive-title">
          <div className="archive-heading">
            <div>
              <p className="eyebrow">Step 05 / night edition archive</p>
              <h1 id="archive-title">Your version has<br /><em>a place in the city.</em></h1>
            </div>
            <button className="ink-button" onClick={() => setScreen('calls')}>Run another case <span>→</span></button>
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
                      setActiveDispatchId(dispatch.id);
                      setScreen('reveal');
                    }}
                  >
                    <img src={dispatch.image} alt={`Open saved ${assignment.title} dispatch`} />
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
              <button className="text-button" onClick={() => setScreen('calls')}>Open field calls →</button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
