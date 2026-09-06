/* eslint-disable @next/next/no-img-element -- editor exports are user-specific data URLs and must remain unoptimized. */
'use client';

import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ImageEditorRef, ImageEditorSaveResult } from '@unlayer/react-image-editor';

type Screen = 'desk' | 'calls' | 'edit' | 'reveal' | 'archive';
type Instinct = 'person' | 'object';

type ToolCue = {
  tool: 'Crop' | 'Filter' | 'Draw' | 'Text' | 'Shapes' | 'Frame';
  instruction: string;
};

type Angle = {
  id: string;
  label: string;
  prompt: string;
  outcome: string;
  stamp: string;
  moves: [ToolCue, ToolCue, ToolCue];
  closingLead: string;
  closingEmphasis: string;
  closingDeck: string;
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
  closingLead: string;
  closingEmphasis: string;
  closingDeck: string;
  plateCode: string;
  byteSize: number;
  mimeType: string;
  width: number | null;
  height: number | null;
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
      {
        id: 'expose-launch',
        label: 'Expose the launch',
        prompt: 'Center the pleasure launch. Let the ferry lane tell on it.',
        outcome: 'The ferry master clipped your plate to the manifest before sunrise. Two hours later, the boat was moored under a borrowed name.',
        stamp: 'LAUNCH EXPOSED',
        moves: [
          { tool: 'Crop', instruction: 'Keep the launch, toll buoy, and broken wake together.' },
          { tool: 'Draw', instruction: 'Trace the wake back toward the launch.' },
          { tool: 'Text', instruction: 'Mark the time where the ferry lane narrows.' },
        ],
        closingLead: 'The wake reaches',
        closingEmphasis: 'the ledger first.',
        closingDeck: 'The club can rename the boat by sunrise. It cannot rename the route you printed.',
      },
      {
        id: 'protect-crew',
        label: 'Protect the ferry crew',
        prompt: 'Keep the ferry in frame. Make the boat club carry the blame.',
        outcome: 'The crew made the first crossing untouched. By breakfast, the boat club had sent three lawyers and one silent apology.',
        stamp: 'CREW PROTECTED',
        moves: [
          { tool: 'Crop', instruction: 'Hold the ferry lane and push the launch to the edge.' },
          { tool: 'Shapes', instruction: 'Box the safe line the crew kept.' },
          { tool: 'Text', instruction: 'Give the first crossing a clean label.' },
        ],
        closingLead: 'The first crossing',
        closingEmphasis: 'keeps its name.',
        closingDeck: 'The crew reaches dawn untouched. The boat club inherits every question left in frame.',
      },
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
      {
        id: 'show-witness',
        label: 'Show the witness',
        prompt: 'Hold the balcony. Let the witness stay visible through the noise.',
        outcome: 'By breakfast the manager had changed the key cards. The person behind the door left a damp matchbook on the desk with no room number.',
        stamp: 'WITNESS SHOWN',
        moves: [
          { tool: 'Crop', instruction: 'Keep the balcony and its pool reflection together.' },
          { tool: 'Filter', instruction: 'Lift the contrast until the light holds.' },
          { tool: 'Draw', instruction: 'Bracket the window the manager denies.' },
        ],
        closingLead: 'One balcony',
        closingEmphasis: 'stays lit.',
        closingDeck: 'The key cards change before breakfast. The witness remains exactly where you left the light.',
      },
      {
        id: 'hide-witness',
        label: 'Hide the witness',
        prompt: 'Cut the balcony loose. Put the reflection, not the person, on the record.',
        outcome: 'The coupe disappeared before dawn. The pool reflection remained, sharp enough for the night desk and nobody else.',
        stamp: 'WITNESS HELD',
        moves: [
          { tool: 'Crop', instruction: 'Cut the balcony and keep the pool in frame.' },
          { tool: 'Filter', instruction: 'Cool the scene until the reflection leads.' },
          { tool: 'Text', instruction: 'Leave one room number unanswered.' },
        ],
        closingLead: 'The reflection',
        closingEmphasis: 'keeps the secret.',
        closingDeck: 'The coupe leaves before dawn. The only witness left is water, and water never signs a statement.',
      },
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
      {
        id: 'publish-mask',
        label: 'Publish the mask',
        prompt: 'Find the mask. Let the morning city see what the carnival denied.',
        outcome: 'The mask made the morning edition, then vanished from the evidence bag. A brass ticket appeared where it had been, stamped for a ride that has not existed in twelve years.',
        stamp: 'MASK PUBLISHED',
        moves: [
          { tool: 'Crop', instruction: 'Pull the mask and floodwater into the same proof.' },
          { tool: 'Filter', instruction: 'Bleach the morning without cleaning the scene.' },
          { tool: 'Shapes', instruction: 'Ring the object the carnival never logged.' },
        ],
        closingLead: 'The mask makes',
        closingEmphasis: 'the morning run.',
        closingDeck: 'It disappears from evidence after print. The edition keeps the face the carnival tried to lose.',
      },
      {
        id: 'follow-courier',
        label: 'Follow the courier',
        prompt: 'Follow the courier through the reflection. Keep the mask as a warning, not the headline.',
        outcome: 'The courier crossed the service bridge at dawn. The carnival kept its mask, but the route was now on the record.',
        stamp: 'COURIER FOLLOWED',
        moves: [
          { tool: 'Crop', instruction: 'Hold the courier, service bridge, and reflection.' },
          { tool: 'Draw', instruction: 'Run a route line through the wet street.' },
          { tool: 'Text', instruction: 'Stamp the next crossing time beside the rider.' },
        ],
        closingLead: 'A wet route',
        closingEmphasis: 'outlives the rider.',
        closingDeck: 'The carnival keeps its mask. Your line gives the morning desk somewhere real to follow.',
      },
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
      {
        id: 'print-handoff',
        label: 'Print the hand-off',
        prompt: 'Frame the phone and wet sleeve. Make the exchange impossible to deny.',
        outcome: 'At high tide the phone was gone, but the wet sleeve made the morning print. The tender owner stopped returning calls at 08:01.',
        stamp: 'HAND-OFF PRINTED',
        moves: [
          { tool: 'Crop', instruction: 'Keep the phone, wet sleeve, and tide line tight.' },
          { tool: 'Filter', instruction: 'Push contrast until the hand-off reads first.' },
          { tool: 'Shapes', instruction: 'Box the exchange the quay cameras missed.' },
        ],
        closingLead: 'The tide takes',
        closingEmphasis: 'everything but proof.',
        closingDeck: 'The phone is gone at high water. The sleeve remains in print, dry enough for every desk in town.',
      },
      {
        id: 'follow-tender',
        label: 'Follow the tender',
        prompt: 'Let the phone fall away. Hold the watcher and the tender in the same story.',
        outcome: 'The tender left before dawn. Its wake cut straight past the quay cameras, but your plate preserved the one person who watched it go.',
        stamp: 'TENDER FOLLOWED',
        moves: [
          { tool: 'Crop', instruction: 'Pair the watcher with the tender in one frame.' },
          { tool: 'Draw', instruction: 'Pull an arrow from the quay into the channel.' },
          { tool: 'Text', instruction: 'Mark the departure time the cameras lost.' },
        ],
        closingLead: 'One wake line',
        closingEmphasis: 'leaves the quay.',
        closingDeck: 'The tender clears the cameras before dawn. Your plate keeps the watcher attached to its route.',
      },
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
      {
        id: 'tag-driver',
        label: 'Tag the driver',
        prompt: 'Hold the driver against the ferry lights. Make the exit the whole story.',
        outcome: 'The ferry crossed without the driver. At first light, the shuttle appeared two districts away with the same ribbon and a different fare.',
        stamp: 'DRIVER TAGGED',
        moves: [
          { tool: 'Crop', instruction: 'Keep the driver against the last ferry lights.' },
          { tool: 'Draw', instruction: 'Circle the person leaving the running meter.' },
          { tool: 'Text', instruction: 'Tag the final fare beside the causeway.' },
        ],
        closingLead: 'The driver walks',
        closingEmphasis: 'out of the fare.',
        closingDeck: 'The shuttle returns under new plates. The person who left it cannot step out of your frame.',
      },
      {
        id: 'map-route',
        label: 'Map the route',
        prompt: 'Keep the empty shuttle and the meter together. Let the route expose itself.',
        outcome: 'The meter kept running until noon. Its impossible fare drew a line through three districts and one sealed marina gate.',
        stamp: 'ROUTE MAPPED',
        moves: [
          { tool: 'Crop', instruction: 'Hold the empty shuttle and live meter together.' },
          { tool: 'Draw', instruction: 'Pull the fare line toward the sealed marina gate.' },
          { tool: 'Shapes', instruction: 'Box the number that makes the route impossible.' },
        ],
        closingLead: 'The meter draws',
        closingEmphasis: 'a road nobody owns.',
        closingDeck: 'The fare keeps climbing after the engine cools. Your mark turns the number into a route.',
      },
    ],
  },
];

type ImageEditorModule = typeof import('@unlayer/react-image-editor');

let editorImportPromise: Promise<ImageEditorModule> | null = null;

function loadImageEditor() {
  editorImportPromise ??= import('@unlayer/react-image-editor');
  return editorImportPromise;
}

function preloadImageEditor() {
  const promise = loadImageEditor();
  void promise.catch(() => {
    if (editorImportPromise === promise) editorImportPromise = null;
  });
}

const ImageEditor = lazy(loadImageEditor);

type EditorBoundaryProps = {
  children: ReactNode;
  onFailure: () => void;
  resetKey: number;
};

type EditorBoundaryState = {
  failed: boolean;
  resetKey: number;
};

class EditorBoundary extends Component<EditorBoundaryProps, EditorBoundaryState> {
  state: EditorBoundaryState = { failed: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  static getDerivedStateFromProps(props: EditorBoundaryProps, state: EditorBoundaryState) {
    return props.resetKey === state.resetKey ? null : { failed: false, resetKey: props.resetKey };
  }

  componentDidCatch() {
    this.props.onFailure();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

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
        stickers: false,
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

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fallbackPlateCode(dataUrl: string) {
  const sample = `${dataUrl.slice(0, 4096)}${dataUrl.slice(-4096)}${dataUrl.length}`;
  let hash = 2166136261;

  for (let index = 0; index < sample.length; index += 1) {
    hash ^= sample.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

async function inspectExport(dataUrl: string, blob: Blob) {
  let plateCode = fallbackPlateCode(dataUrl);
  let width: number | null = null;
  let height: number | null = null;

  try {
    const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
    plateCode = Array.from(new Uint8Array(digest).slice(0, 5), (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
  } catch {
    // The deterministic fallback still gives every exact export a visible press identifier.
  }

  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(blob);
      width = bitmap.width;
      height = bitmap.height;
      bitmap.close();
    } catch {
      // Dimensions are supporting metadata; the exported data URL remains the artifact.
    }
  }

  return { plateCode: `SL-${plateCode}`, width, height };
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>('desk');
  const [furthestStep, setFurthestStep] = useState(0);
  const [selectedId, setSelectedId] = useState(ASSIGNMENTS[0].id);
  const [selectedAngleId, setSelectedAngleId] = useState<string | null>(null);
  const [briefingStep, setBriefingStep] = useState<'instinct' | 'loop'>('instinct');
  const [instinct, setInstinct] = useState<Instinct | null>(null);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [isClosingFrameOpen, setIsClosingFrameOpen] = useState(false);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [activeDispatchId, setActiveDispatchId] = useState<string | null>(null);
  const [editorStatus, setEditorStatus] = useState('Loading the field plate…');
  const [editorAttempt, setEditorAttempt] = useState(0);
  const [EditorComponent, setEditorComponent] = useState(() => ImageEditor);
  const [editorFailed, setEditorFailed] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const briefingDialogRef = useRef<HTMLElement>(null);
  const closingDialogRef = useRef<HTMLElement>(null);
  const screenRef = useRef<HTMLElement>(null);
  const previousScreen = useRef<Screen | null>(null);
  const prefetchedPlates = useRef(new Set<string>());
  const imageEditorRef = useRef<ImageEditorRef>(null);
  const publishingRef = useRef(false);
  const angleTransitionRef = useRef(false);
  const draftRevisionRef = useRef(0);

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
    if (screen === 'edit' && nextScreen !== 'edit' && (publishingRef.current || angleTransitionRef.current)) {
      setEditorStatus('The image desk is finishing the current operation. Leave after it settles.');
      return;
    }
    if (screen === 'edit' && nextScreen !== 'edit' && imageEditorRef.current?.editor?.hasChanges()) {
      const shouldDiscard = window.confirm('This field plate has unpublished marks. Discard them and leave the image desk?');
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
    if (publishingRef.current || angleTransitionRef.current) return;
    draftRevisionRef.current += 1;
    editorImportPromise = null;
    setEditorComponent(() => lazy(loadImageEditor));
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
      const shouldDiscard = window.confirm('Changing the Angle Lock clears the marks on this plate. Discard those marks and relock the lead?');
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

  function leaveEditorAfterCancel() {
    if (publishingRef.current || angleTransitionRef.current) {
      setEditorStatus('The image desk is finishing the current operation. Cancel after it settles.');
      return;
    }
    if (imageEditorRef.current?.editor?.hasChanges()) {
      const shouldDiscard = window.confirm('This field plate has unpublished marks. Discard them and return to the calls?');
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
    if (!dataUrl || !blob || !selectedAngle || !editor || publishingRef.current || angleTransitionRef.current) return;
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
    setEditorStatus('Developing the exact Unlayer export…');
    try {
      const exportDetails = await inspectExport(dataUrl, blob);
      if (draftRevisionRef.current !== draftRevision || imageEditorRef.current?.editor !== editor) return;
      const extension = imageExtension(dataUrl);
      const dispatch: Dispatch = {
        id: `${selected.id}-${Date.now()}`,
        assignmentId: selected.id,
        angleId: selectedAngle.id,
        image: dataUrl,
        issue: `${selected.issue}.${String(dispatches.length + 1).padStart(2, '0')}`,
        createdAt: formatTime(),
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
      };

      setDispatches((current) => [dispatch, ...current]);
      setActiveDispatchId(dispatch.id);
      draftRevisionRef.current += 1;
      advanceProgress(3);
      setScreen('reveal');
    } catch {
      setEditorStatus('The export returned, but the press ledger could not file it. Save once more.');
    } finally {
      publishingRef.current = false;
      setIsPublishing(false);
    }
  }

  function openArchivedDispatch(dispatch: Dispatch) {
    setSelectedId(dispatch.assignmentId);
    setSelectedAngleId(dispatch.angleId);
    setActiveDispatchId(dispatch.id);
    setIsBriefingOpen(false);
    setIsClosingFrameOpen(false);
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
          <div className="editor-stage">
            <div className="editor-stage-bar">
              <span><i className="live-dot" /> UNLAYER REACT IMAGE EDITOR / FULL-RES FIELD PLATE</span>
              <span>{selectedAngle ? 'SAVE = PUBLISH' : 'ANGLE LOCK REQUIRED'}</span>
            </div>
            <div className={`editor-shell ${editorReady ? 'is-ready' : ''} ${selectedAngle ? 'is-angle-locked' : 'is-angle-gate'}`} aria-busy={Boolean(selectedAngle) && !editorReady && !editorFailed}>
              {!selectedAngle && (
                <div className="angle-gate">
                  <img className="angle-gate-image" src={selected.preview} width="768" height="512" decoding="async" alt="" />
                  <div className="angle-gate-panel">
                    <p className="eyebrow">The same plate can tell two true stories.</p>
                    <h2>Lock the lead<br /><em>before you mark it.</em></h2>
                    <div className="angle-gate-options" role="group" aria-label="Choose the dispatch angle">
                      {selected.angles.map((angle, index) => (
                        <button key={angle.id} type="button" onClick={() => lockAngle(angle.id)}>
                          <span>ANGLE 0{index + 1}</span>
                          <strong>{angle.label}</strong>
                          <small>{angle.prompt}</small>
                          <i>{angle.moves.map((move) => move.tool).join(' + ')}</i>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {selectedAngle && !editorReady && (
                <div className="editor-loader" aria-hidden="true">
                  <img src={selected.preview} width="768" height="512" decoding="async" alt="" />
                  <div className="editor-loader-copy">
                    <span>FULL-RES FIELD PLATE</span>
                    <b>{editorFailed ? 'SIGNAL INTERRUPTED' : 'DEVELOPING AT THE NIGHT DESK'}</b>
                    <i />
                  </div>
                </div>
              )}
              {selectedAngle && (
                <EditorBoundary
                  resetKey={editorAttempt}
                  onFailure={() => {
                    setEditorFailed(true);
                    setEditorReady(false);
                    setEditorStatus('The image desk module was interrupted. Retry when the connection is ready.');
                  }}
                >
                  <Suspense fallback={null}>
                    <EditorComponent
                      ref={imageEditorRef}
                      key={`${selected.id}-${editorAttempt}`}
                      image={selected.image}
                      minHeight="min(64vh, 720px)"
                      options={EDITOR_OPTIONS}
                      onLoad={() => {
                        setEditorFailed(false);
                        setEditorReady(true);
                        setEditorStatus('Image desk connected. Make the locked lead visible, then Save.');
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
                      onSave={(result) => void publishDispatch(result)}
                      onCancel={leaveEditorAfterCancel}
                    />
                  </Suspense>
                </EditorBoundary>
              )}
            </div>
            <div className="editor-actions">
              <p>{selectedAngle ? <>Make at least one visible editorial move, then click <strong>Save (✓)</strong> in Unlayer&apos;s top-right corner. That exact export is the only route to print.</> : <>Choose an <strong>Angle Lock</strong> above. The full-resolution plate and editor module are already being prepared.</>}</p>
              {selectedAngle && <span className="save-cue" aria-hidden="true">{isPublishing ? 'PRINTING…' : 'SAVE ↑'}</span>}
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
            </dl>
            <div className="reveal-actions">
              <button className="ink-button" onClick={() => { advanceProgress(4); setScreen('archive'); setIsClosingFrameOpen(true); }}>Close the edition <span>→</span></button>
              <button className="text-button" onClick={downloadDispatch}>Download plate ↓</button>
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
