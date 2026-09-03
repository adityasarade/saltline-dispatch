'use client';

import { useMemo, useRef, useState } from 'react';
import ImageEditor from '@unlayer/react-image-editor';
import type { ImageEditorRef } from '@unlayer/react-image-editor';

type Screen = 'desk' | 'calls' | 'edit' | 'reveal' | 'archive';

type Assignment = {
  id: string;
  issue: string;
  time: string;
  place: string;
  title: string;
  deck: string;
  prompt: string;
  outcome: string;
  image: string;
  accent: 'coral' | 'teal' | 'gold';
};

type Dispatch = {
  id: string;
  assignmentId: string;
  image: string;
  issue: string;
  createdAt: string;
};

const ASSIGNMENTS: Assignment[] = [
  {
    id: 'wake-tax',
    issue: 'SALT/04',
    time: '02:13',
    place: 'Bellwether Pier',
    title: 'Wake Tax',
    deck: 'A pleasure boat cuts the ferry lane and leaves the pier counting cups, teeth, and excuses.',
    prompt: 'Keep the ferry. Lose the alibi. Make the water look guilty.',
    outcome: 'The ferry master clipped your plate to the manifest before sunrise. Two hours later, the boat was moored under a borrowed name.',
    image: '/images/wake-tax.png',
    accent: 'coral',
  },
  {
    id: 'room-08',
    issue: 'SALT/05',
    time: '02:19',
    place: 'Morrow Court',
    title: 'Room 08',
    deck: 'The balcony light went out exactly once. The pool kept the rest of the story.',
    prompt: 'Hold the witness. Cut the noise. Leave one question open.',
    outcome: 'By breakfast the manager had changed the key cards. The person behind the door left a damp matchbook on the desk with no room number.',
    image: '/images/room-08.png',
    accent: 'teal',
  },
  {
    id: 'after-rain',
    issue: 'SALT/06',
    time: '02:27',
    place: 'Cormorant Carnival',
    title: 'After the Rain',
    deck: 'Floodwater returns a silver mask that everyone swears was never reported missing.',
    prompt: 'Find the object. Follow the reflection. Do not clean it up.',
    outcome: 'The mask made the morning edition, then vanished from the evidence bag. A brass ticket appeared where it had been, stamped for a ride that has not existed in twelve years.',
    image: '/images/after-rain.png',
    accent: 'gold',
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
  { id: 'desk', label: 'Night desk', number: '01' },
  { id: 'calls', label: 'Field calls', number: '02' },
  { id: 'edit', label: 'Hot plate', number: '03' },
  { id: 'reveal', label: 'Press run', number: '04' },
  { id: 'archive', label: 'Issue wall', number: '05' },
];

function formatTime() {
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

export default function Home() {
  const editorRef = useRef<ImageEditorRef>(null);
  const [screen, setScreen] = useState<Screen>('desk');
  const [selectedId, setSelectedId] = useState(ASSIGNMENTS[0].id);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [activeDispatchId, setActiveDispatchId] = useState<string | null>(null);
  const [editorStatus, setEditorStatus] = useState('Loading the field plate…');

  const selected = useMemo(
    () => ASSIGNMENTS.find((assignment) => assignment.id === selectedId) ?? ASSIGNMENTS[0],
    [selectedId],
  );

  const activeDispatch = useMemo(
    () => dispatches.find((dispatch) => dispatch.id === activeDispatchId) ?? null,
    [activeDispatchId, dispatches],
  );

  const activeAssignment = useMemo(() => {
    const assignmentId = activeDispatch?.assignmentId ?? selected.id;
    return ASSIGNMENTS.find((assignment) => assignment.id === assignmentId) ?? selected;
  }, [activeDispatch, selected]);

  function chooseAssignment(id: string) {
    setSelectedId(id);
  }

  function openHotPlate() {
    setEditorStatus('Loading the field plate…');
    setScreen('edit');
  }

  function printDispatch(image?: string) {
    const printedImage = image ?? editorRef.current?.editor?.getImage();
    if (!printedImage) {
      setEditorStatus('The plate is still warming up. Give it a moment.');
      return;
    }

    const dispatch: Dispatch = {
      id: `${selected.id}-${Date.now()}`,
      assignmentId: selected.id,
      image: printedImage,
      issue: `${selected.issue}.${String(dispatches.length + 1).padStart(2, '0')}`,
      createdAt: formatTime(),
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
          >
            <span>{step.number}</span>
            {step.label}
          </button>
        ))}
      </nav>

      {screen === 'desk' && (
        <section className="desk-screen screen" aria-labelledby="desk-title">
          <div className="desk-copy">
            <p className="eyebrow">Cala Verda, 02:00 until it is not</p>
            <h1 id="desk-title">Every night leaves a mark.<br /><em>Make it printable.</em></h1>
            <p className="intro">Saltline is the after-hours desk for a city that only explains itself when you cut, circle, stain, and publish the evidence.</p>
            <div className="desk-actions">
              <button className="ink-button" onClick={() => setScreen('calls')}>Take the night desk <span>→</span></button>
              <span className="edition-note">3 field calls<br />one edition</span>
            </div>
          </div>
          <div className="desk-plate" aria-hidden="true">
            <div className="plate-moon" />
            <div className="plate-horizon"><i /><i /><i /><i /><i /><i /><i /></div>
            <div className="plate-water" />
            <div className="plate-strip plate-strip-one">THE WATER REMEMBERS</div>
            <div className="plate-strip plate-strip-two">NO. 04 / KEEP MOVING</div>
            <div className="plate-stamp">S<br />L</div>
          </div>
          <p className="desk-footer">You are not a hero. You are the person who decides which version survives the night.</p>
        </section>
      )}

      {screen === 'calls' && (
        <section className="calls-screen screen" aria-labelledby="calls-title">
          <div className="calls-heading">
            <div>
              <p className="eyebrow">Three field calls waiting</p>
              <h1 id="calls-title">Choose one thing<br />the city cannot explain.</h1>
            </div>
            <p>Each call comes with a single field plate. Your edit will become the dispatch on the issue wall.</p>
          </div>
          <div className="call-list">
            {ASSIGNMENTS.map((assignment, index) => (
              <article
                className={`call-card accent-${assignment.accent} ${assignment.id === selected.id ? 'is-selected' : ''}`}
                key={assignment.id}
              >
                <button className="call-card-select" onClick={() => chooseAssignment(assignment.id)} aria-label={`Select ${assignment.title}`}>
                  <span className="call-index">0{index + 1}</span>
                  <span className="call-time">{assignment.time}</span>
                  <span className="call-image"><img src={assignment.image} alt="" /></span>
                  <span className="call-place">{assignment.place}</span>
                  <strong>{assignment.title}</strong>
                  <span className="call-deck">{assignment.deck}</span>
                  <span className="call-pick">{assignment.id === selected.id ? 'Assigned' : 'Take call'} <b>↗</b></span>
                </button>
              </article>
            ))}
          </div>
          <div className="call-footer">
            <span>THE DESK HAS NO REWIND. THE EDITOR DOES.</span>
            <button className="ink-button" onClick={openHotPlate}>Open {selected.title} <span>→</span></button>
          </div>
        </section>
      )}

      {screen === 'edit' && (
        <section className="edit-screen screen" aria-labelledby="edit-title">
          <aside className="edit-brief">
            <button className="back-button" onClick={() => setScreen('calls')}>← Field calls</button>
            <p className="eyebrow">{selected.issue} / {selected.time}</p>
            <h1 id="edit-title">{selected.title}</h1>
            <p className="edit-place">{selected.place}</p>
            <p className="edit-prompt">“{selected.prompt}”</p>
            <ol className="editor-moves">
              <li><b>01</b><span><strong>Frame it</strong>Crop toward the thing that matters.</span></li>
              <li><b>02</b><span><strong>Mark it</strong>Add a line, word, shape, or imperfect signal.</span></li>
              <li><b>03</b><span><strong>Print it</strong>The flattened plate enters tonight’s issue.</span></li>
            </ol>
            <p className="editor-status" role="status">{editorStatus}</p>
          </aside>
          <div className="editor-stage">
            <div className="editor-stage-bar">
              <span><i className="live-dot" /> FIELD PLATE / ORIGINAL ART</span>
              <span>MANUAL TOOLS ONLY</span>
            </div>
            <div className="editor-shell">
              <ImageEditor
                key={selected.id}
                ref={editorRef}
                image={selected.image}
                minHeight="min(70vh, 760px)"
                options={EDITOR_OPTIONS}
                onLoad={() => setEditorStatus('The plate is live. Make a case, not a collage.')}
                onLoadError={() => setEditorStatus('The field plate did not load. Return to the calls and try again.')}
                onError={() => setEditorStatus('The image desk could not open. Check the connection and retry the call.')}
                onSave={({ dataUrl }) => printDispatch(dataUrl)}
                onCancel={() => setEditorStatus('The press is still waiting. Your field plate stays on the desk.')}
              />
            </div>
            <div className="editor-actions">
              <p>Use the editor’s own Save if you want. Or print the current plate straight from the desk.</p>
              <button className="ink-button" onClick={() => printDispatch()}>Print dispatch <span>→</span></button>
            </div>
          </div>
        </section>
      )}

      {screen === 'reveal' && activeDispatch && (
        <section className="reveal-screen screen" aria-labelledby="reveal-title">
          <div className="reveal-aside">
            <p className="eyebrow">Printed at {activeDispatch.createdAt}</p>
            <h1 id="reveal-title">The city has<br /><em>your version now.</em></h1>
            <p>{activeAssignment.outcome}</p>
            <div className="reveal-actions">
              <button className="ink-button" onClick={() => setScreen('archive')}>Pin to issue wall <span>→</span></button>
              <button className="text-button" onClick={downloadDispatch}>Download plate ↓</button>
            </div>
          </div>
          <article className={`printed-dispatch accent-${activeAssignment.accent}`}>
            <div className="dispatch-masthead"><span>SALTLINE / NIGHT EDITION</span><b>{activeDispatch.issue}</b></div>
            <div className="dispatch-image"><img src={activeDispatch.image} alt={`Edited dispatch for ${activeAssignment.title}`} /></div>
            <div className="dispatch-caption"><span>{activeAssignment.place}</span><span>THE FIELD DESK DID NOT ALTER THE FACTS. ONLY THE LIGHT.</span></div>
            <div className="dispatch-stamp">PRINTED<br />02:44</div>
          </article>
        </section>
      )}

      {screen === 'archive' && (
        <section className="archive-screen screen" aria-labelledby="archive-title">
          <div className="archive-heading">
            <div>
              <p className="eyebrow">Night edition / issue wall</p>
              <h1 id="archive-title">Nothing disappears.<br /><em>It just gets filed badly.</em></h1>
            </div>
            <button className="ink-button" onClick={() => setScreen('calls')}>Take another call <span>→</span></button>
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
                    <i>02:44</i>
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
