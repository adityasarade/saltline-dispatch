/* eslint-disable @next/next/no-img-element -- editor exports are user-specific data URLs and must remain unoptimized. */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ImageEditorRef, ImageEditorSaveResult } from '@unlayer/react-image-editor';
import { pressLedgerLine } from '@/lib/press-read';
import { leadLedgerLine, measureLead, readLead } from '@/lib/lead-proof';
import { leadRegion } from '@/lib/lead-regions';
import { ASSIGNMENTS } from '@/lib/assignments';
import { filedAt, formatBytes, imageExtension, inspectExport, loadCanvasImage } from '@/lib/export-meta';
import {
  EditorStage,
  createImageEditor,
  preloadImageEditor,
  resetImageEditorModule,
  TOOL_NAMES,
} from '@/components/saltline/editor-stage';
import { LiveReadCard } from '@/components/saltline/live-read-card';
import { DeskSound } from '@/lib/desk-sound';
import { renderFrontPage } from '@/lib/front-page';
import {
  applyFiling,
  browserDeskStorage,
  clearDesk,
  contradictionPairs,
  emptyDesk,
  readDesk,
  standingSummary,
  techniqueLabel,
  techniquesOf,
  tierAt,
  tierProgress,
  writeDesk,
  type DeskState,
  type DeskStorage,
  type HeatCharge,
  type PlateRecord,
} from '@/lib/city-heat';
import { classifiedsFor } from '@/lib/classifieds';

type Screen = 'desk' | 'calls' | 'edit' | 'reveal' | 'archive';

type JourneyGuide = {
  key: string;
  step: string;
  title: string;
  copy: string;
};

const GUIDE_STORAGE = 'saltline-journey-guide-v1';

function journeyGuide(screen: Screen, angleLocked: boolean): JourneyGuide {
  if (screen === 'desk') return {
    key: 'briefing', step: '01 / 05', title: 'You are tonight’s picture editor.',
    copy: 'Take one field call, decide what its photograph proves, make that lead visible in the image editor, and send your exact export to print.',
  };
  if (screen === 'calls') return {
    key: 'calls', step: '02 / 05', title: 'Choose one story to investigate.',
    copy: 'Each case contains two defensible angles. Select any card now; you will choose its angle after the field plate opens.',
  };
  if (screen === 'edit' && !angleLocked) return {
    key: 'angle-lock', step: '03 / 05', title: 'Lock the headline before editing.',
    copy: 'Choose one Angle Lock beside the plate. It changes the recommended edit, the printed headline, and the consequence recorded on the issue wall.',
  };
  if (screen === 'edit') return {
    key: 'image-desk', step: '03 / 05', title: 'Make the chosen lead unmistakable.',
    copy: 'Follow START HERE for the fastest route, make one visible move, then use the editor’s Save control. Saltline measures and prints that exact export.',
  };
  if (screen === 'reveal') return {
    key: 'published', step: '04 / 05', title: 'Read what your edit became.',
    copy: 'The proof pair shows source versus saved export. The page, lead verdict and CITY HEAT explain how your framing changed the edition.',
  };
  return {
    key: 'issue-wall', step: '05 / 05', title: 'The paper remembers every version.',
    copy: 'Open a plate to revisit it, run another case, or read the standing sheet. Printing opposing angles keeps both versions and raises CITY HEAT.',
  };
}

/** Whether this browser is actually keeping the night between visits. */
type DeskMemory = 'pending' | 'persisting' | 'trimmed' | 'memory';

type DiscardAsk = {
  title: string;
  message: string;
  confirm: string;
  keep: string;
  resolve: (discard: boolean) => void;
};

const steps: Array<{ id: Screen; label: string; number: string }> = [
  { id: 'desk', label: 'Briefing', number: '01' },
  { id: 'calls', label: 'Pick a case', number: '02' },
  { id: 'edit', label: 'Edit evidence', number: '03' },
  { id: 'reveal', label: 'Publish', number: '04' },
  { id: 'archive', label: 'Issue wall', number: '05' },
];

/** After this many failed loads the desk stops pretending another try will help. */
const EDITOR_RETRY_LIMIT = 3;

export default function Home() {
  const [screen, setScreen] = useState<Screen>('desk');
  const [furthestStep, setFurthestStep] = useState(0);
  const [selectedId, setSelectedId] = useState(ASSIGNMENTS[0].id);
  const [selectedAngleId, setSelectedAngleId] = useState<string | null>(null);
  const [isClosingFrameOpen, setIsClosingFrameOpen] = useState(false);
  const [isStandingOpen, setIsStandingOpen] = useState(false);
  const [desk, setDesk] = useState<DeskState>(emptyDesk);
  const [deskMemory, setDeskMemory] = useState<DeskMemory>('pending');
  const [lastCharge, setLastCharge] = useState<HeatCharge | null>(null);
  const [activeDispatchId, setActiveDispatchId] = useState<string | null>(null);
  const [editorStatus, setEditorStatus] = useState('Loading the field plate…');
  const [editorAttempt, setEditorAttempt] = useState(0);
  const [editorFailures, setEditorFailures] = useState(0);
  const [EditorComponent, setEditorComponent] = useState(createImageEditor);
  const [editorFailed, setEditorFailed] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPressRunning, setIsPressRunning] = useState(false);
  const [isPressSlow, setIsPressSlow] = useState(false);
  const [discardAsk, setDiscardAsk] = useState<DiscardAsk | null>(null);
  const [deskNotice, setDeskNotice] = useState('');
  const [soundOn, setSoundOn] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guidesMuted, setGuidesMuted] = useState(false);
  const [guideReady, setGuideReady] = useState(false);
  const seenGuides = useRef(new Set<string>());
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const closingDialogRef = useRef<HTMLElement>(null);
  const standingDialogRef = useRef<HTMLElement>(null);
  const screenRef = useRef<HTMLElement>(null);
  const previousScreen = useRef<Screen | null>(null);
  const prefetchedPlates = useRef(new Set<string>());
  const imageEditorRef = useRef<ImageEditorRef>(null);
  const publishingRef = useRef(false);
  const angleTransitionRef = useRef(false);
  const draftRevisionRef = useRef(0);
  const deskSound = useRef<DeskSound | null>(null);
  const deskRef = useRef<DeskState>(emptyDesk());
  const storageRef = useRef<DeskStorage | null>(null);

  // ---------------------------------------------------------------------
  // CITY HEAT: the desk's memory.
  //
  // Read once on mount, never during render, so the server and the first
  // client paint agree. Every touch of storage goes through lib/city-heat.ts,
  // which swallows its own failures: a private window or blocked site data
  // simply leaves storageRef null and the night lives in this tab.
  // ---------------------------------------------------------------------
  useEffect(() => {
    const storage = browserDeskStorage();
    storageRef.current = storage;

    // readDesk cannot throw; a corrupt or foreign payload reads as a fresh
    // desk. The extra try/catch is belt and braces for a storage object that
    // passed the write probe and then started throwing.
    let stored = emptyDesk();
    try {
      if (storage) stored = readDesk(storage);
    } catch {
      stored = emptyDesk();
    }

    deskRef.current = stored;

    // Handed to React from a microtask rather than straight out of the effect
    // body: the stored night is external state, and a microtask still lands
    // before the browser paints, so the wall never flashes empty first.
    queueMicrotask(() => {
      setDesk(stored);
      setDeskMemory(storage ? 'persisting' : 'memory');
    });
  }, []);

  const commitDesk = useCallback((next: DeskState) => {
    deskRef.current = next;
    setDesk(next);

    const outcome = writeDesk(next, storageRef.current);
    setDeskMemory(
      outcome === 'unavailable' ? 'memory' : outcome === 'stored' ? 'persisting' : 'trimmed',
    );
  }, []);

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

  // A slow line should look like a slow line, not like a hung press. The
  // flag is cleared where the press run starts, so nothing is set from this
  // effect except through its own timer.
  useEffect(() => {
    if (!isPressRunning) return;
    const timer = window.setTimeout(() => setIsPressSlow(true), 3800);
    return () => window.clearTimeout(timer);
  }, [isPressRunning]);

  // An in-world replacement for window.confirm. The desk asks on newsprint
  // rather than handing the visitor a browser chrome dialog mid-story.
  function askDiscard(
    message: string,
    options?: { title?: string; confirm?: string; keep?: string },
  ) {
    return new Promise<boolean>((resolve) => {
      setDiscardAsk({
        title: options?.title ?? 'Spike these marks?',
        message,
        confirm: options?.confirm ?? 'Spike the marks',
        keep: options?.keep ?? 'Keep working the plate',
        resolve,
      });
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
    if (!isStandingOpen) return;
    standingDialogRef.current?.focus({ preventScroll: true });
  }, [isStandingOpen]);

  useEffect(() => {
    if (!isClosingFrameOpen && !isStandingOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isClosingFrameOpen, isStandingOpen]);

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
    () => desk.plates.find((plate) => plate.id === activeDispatchId) ?? null,
    [activeDispatchId, desk.plates],
  );

  const selectedAngle = useMemo(
    () => selected.angles.find((angle) => angle.id === selectedAngleId) ?? null,
    [selected, selectedAngleId],
  );

  const currentGuide = journeyGuide(screen, Boolean(selectedAngle));
  const persistGuides = useCallback((muted: boolean) => {
    try {
      window.localStorage.setItem(GUIDE_STORAGE, JSON.stringify({ muted, seen: [...seenGuides.current] }));
    } catch {
      /* The guide remains available for this tab when preferences cannot persist. */
    }
  }, []);

  useEffect(() => {
    let muted = false;
    try {
      const stored = JSON.parse(window.localStorage.getItem(GUIDE_STORAGE) || 'null') as { muted?: boolean; seen?: string[] } | null;
      if (stored?.seen) seenGuides.current = new Set(stored.seen);
      muted = Boolean(stored?.muted);
    } catch {
      /* A damaged preference is treated as a first visit. */
    }
    queueMicrotask(() => {
      setGuidesMuted(muted);
      setGuideReady(true);
    });
  }, []);

  useEffect(() => {
    if (!guideReady || guidesMuted || seenGuides.current.has(currentGuide.key)) return;
    seenGuides.current.add(currentGuide.key);
    persistGuides(false);
    queueMicrotask(() => setGuideOpen(true));
  }, [currentGuide, guideReady, guidesMuted, persistGuides]);

  useEffect(() => {
    if (!guideOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setGuideOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [guideOpen]);

  const activeAssignment = useMemo(() => {
    const assignmentId = activeDispatch?.assignmentId ?? selected.id;
    return ASSIGNMENTS.find((assignment) => assignment.id === assignmentId) ?? selected;
  }, [activeDispatch, selected]);

  const tier = useMemo(() => tierAt(desk.heat), [desk.heat]);
  const gauge = useMemo(() => tierProgress(desk.heat), [desk.heat]);
  const contradicted = useMemo(() => contradictionPairs(desk.plates), [desk.plates]);
  const smallAds = useMemo(() => classifiedsFor(desk.plates.length, 3), [desk.plates.length]);

  const repeatLeads = useMemo(
    () =>
      Object.entries(desk.leadUses)
        .filter(([, uses]) => uses > 1)
        .sort((a, b) => b[1] - a[1])
        .map(([key, uses]) => {
          const [assignmentId, angleId] = key.split(':');
          const assignment = ASSIGNMENTS.find((item) => item.id === assignmentId);
          const angle = assignment?.angles.find((item) => item.id === angleId);
          return { key, uses, label: `${angle?.label ?? angleId} / ${assignment?.title ?? assignmentId}` };
        }),
    [desk.leadUses],
  );

  const repeatMoves = useMemo(
    () =>
      Object.entries(desk.techniqueUses)
        .filter(([, uses]) => uses > 1)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([key, uses]) => ({ key, uses, label: techniqueLabel(key) })),
    [desk.techniqueUses],
  );

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
    setIsStandingOpen(false);
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

  function closeStanding() {
    setIsStandingOpen(false);
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('.heat-strip')?.focus();
    });
  }

  /** Pulps the stored night so the next visitor starts clean. In-world, and reversible only by playing again. */
  async function setCleanEdition() {
    const confirmed = await askDiscard(
      'A clean edition clears the issue wall, the city heat, every contradiction on the record, and any plate still in the archive box. Nothing is kept anywhere else.',
      { title: 'Pulp tonight’s run?', confirm: 'Pulp it and reset the night', keep: 'Keep the edition standing' },
    );
    if (!confirmed) return;

    clearDesk(storageRef.current);
    const fresh = emptyDesk();
    deskRef.current = fresh;
    setDesk(fresh);
    setLastCharge(null);
    setActiveDispatchId(null);
    setIsStandingOpen(false);
    setIsClosingFrameOpen(false);
    setFurthestStep(0);
    setSelectedAngleId(null);
    setScreen('desk');
    setDeskMemory(storageRef.current ? 'persisting' : 'memory');
    setDeskNotice('Clean edition set. The wall is empty and the city has forgotten your name.');
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
    setIsStandingOpen(false);
    setScreen('calls');
  }

  function retryEditor() {
    if (publishingRef.current || angleTransitionRef.current) return;
    if (editorFailures >= EDITOR_RETRY_LIMIT) return;
    draftRevisionRef.current += 1;
    resetImageEditorModule();
    setEditorComponent(createImageEditor);
    setEditorFailed(false);
    setEditorReady(false);
    setEditorStatus('Reloading the field plate…');
    setEditorAttempt((attempt) => attempt + 1);
  }

  function noteEditorFailure(message: string) {
    setEditorFailed(true);
    setEditorReady(false);
    setEditorFailures((count) => {
      const next = count + 1;
      setEditorStatus(
        next >= EDITOR_RETRY_LIMIT
          ? 'The image bureau is not answering. Saltline loads the editor runtime from Unlayer’s CDN, so this needs an open connection — check the line, or take a different call while it comes back.'
          : message,
      );
      return next;
    });
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
    setEditorStatus(`Angle locked: ${nextAngle.label}. Start with ${TOOL_NAMES[nextAngle.moves[0].tool]}, then Save.`);
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
      setEditorStatus('The desk needs one visible editorial move before it can print. Use FRAME, GRADE, MARK UP, CAPTION, BOXES, or BORDER.');
      return;
    }

    setIsPublishing(true);
    setIsPressSlow(false);
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
      const current = deskRef.current;
      const lead = readLead(
        leadMeasurement.insideChange,
        leadMeasurement.outsideChange,
        region?.subject ?? null,
        leadMeasurement.recropped,
      );
      const record: PlateRecord = {
        id: `${selected.id}-${Date.now()}`,
        assignmentId: selected.id,
        angleId: selectedAngle.id,
        image: dataUrl,
        // The edition number continues across visits, so a second night
        // reads as the same night going on rather than a reset.
        issue: `${selected.issue}.${String(current.filed + 1).padStart(2, '0')}`,
        createdAt: filedAt(selected.time, current.filed),
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
        lead,
        contradicted: false,
        spiked: false,
      };

      const filing = applyFiling(current, record, {
        assignmentId: selected.id,
        angleId: selectedAngle.id,
        caseTitle: selected.title,
        angleLabel: selectedAngle.label,
        techniques: techniquesOf(exportDetails.press, lead),
      });

      commitDesk(filing.state);
      setLastCharge(filing.charge);
      setActiveDispatchId(record.id);
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

  function openArchivedDispatch(plate: PlateRecord) {
    setSelectedId(plate.assignmentId);
    setSelectedAngleId(plate.angleId);
    setActiveDispatchId(plate.id);
    setIsClosingFrameOpen(false);
    setIsStandingOpen(false);
    setScreen('reveal');
  }

  async function downloadDispatch() {
    if (!activeDispatch?.image) return;
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
    if (!activeDispatch?.image) return;
    setIsPublishing(true);
    try {
      const image = await loadCanvasImage(activeDispatch.image);
      const blob = await renderFrontPage(
        {
          issue: activeDispatch.issue,
          createdAt: activeDispatch.createdAt,
          plateCode: activeDispatch.plateCode,
          caseTitle: activeAssignment.title,
          place: activeAssignment.place,
          angleLabel: activeDispatch.angleLabel,
          angleStamp: activeDispatch.angleStamp,
          closingLead: activeDispatch.closingLead,
          closingEmphasis: activeDispatch.closingEmphasis,
          closingDeck: activeDispatch.closingDeck,
          play: activeDispatch.press.play,
          playLabel: activeDispatch.press.playLabel,
          toneLabel: activeDispatch.press.toneLabel,
          ledgerLine: pressLedgerLine(activeDispatch.press),
          heat: desk.heat,
          heatLabel: tier.label,
          heatProgress: gauge,
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
  const memoryLine =
    deskMemory === 'memory'
      ? 'This browser will not keep site data, so tonight’s edition lives in this tab only.'
      : deskMemory === 'trimmed'
        ? `The archive box is full. Every record is kept, but only the newest negatives still have their pixels.`
        : 'Tonight’s edition is kept in this browser under one key, and the clean-edition button below erases it.';

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
          <span>{String(desk.filed).padStart(2, '0')} FILED TONIGHT</span>
        </div>
        <button
          className="guide-toggle"
          onClick={() => {
            if (guidesMuted) {
              setGuidesMuted(false);
              persistGuides(false);
            }
            setGuideOpen(true);
          }}
          aria-expanded={guideOpen}
        >
          GUIDE
        </button>
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
          <b>{String(desk.plates.length).padStart(2, '0')}</b>
        </button>
      </header>

      {/* The masthead strip. Not a score and not a HUD: an ink gauge on a
          newspaper that is attracting the wrong sort of attention, and the
          only in-world route to the standing sheet. */}
      <button
        className={`heat-strip heat-${tier.id}`}
        onClick={() => setIsStandingOpen(true)}
        aria-label={`City heat: ${tier.label}. Open the desk standing sheet.`}
        data-heat-tier={tier.id}
      >
        <span className="heat-strip-label">CITY HEAT</span>
        <span className="heat-gauge" aria-hidden="true">
          <i style={{ width: `${Math.round(gauge * 100)}%` }} />
        </span>
        <b data-heat-label>{tier.label}</b>
        <span className="heat-strip-copy" data-heat-masthead>{tier.masthead}</span>
        <span className="heat-strip-open">STANDING ↗</span>
      </button>

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

      {guideOpen && !discardAsk && !isPressRunning && !isClosingFrameOpen && !isStandingOpen && (
        <aside
          className="journey-guide"
          aria-labelledby="saltline-guide-title"
          aria-describedby="saltline-guide-copy"
        >
          <div className="journey-guide-head">
            <span>{currentGuide.step} / NIGHT DESK GUIDE</span>
            <button aria-label="Close guide" onClick={() => setGuideOpen(false)}>CLOSE ×</button>
          </div>
          <h2 id="saltline-guide-title">{currentGuide.title}</h2>
          <p id="saltline-guide-copy">{currentGuide.copy}</p>
          <div className="journey-guide-actions">
            <button className="ink-button" onClick={() => setGuideOpen(false)}>Understood <span>→</span></button>
            <button
              className="text-button"
              onClick={() => {
                setGuidesMuted(true);
                setGuideOpen(false);
                persistGuides(true);
              }}
            >
              Stop tips
            </button>
          </div>
        </aside>
      )}

      {screen === 'desk' && (
        <section ref={screenRef} className="desk-screen screen" aria-labelledby="desk-title" tabIndex={-1}>
          <div className="desk-copy">
            <p className="eyebrow">Cala Verda / live case desk / 02:13</p>
            <h1 id="desk-title">The city plays dumb.<br /><em>Make the proof loud.</em></h1>
            <p className="intro">Five late-night calls. Two defensible truths inside every field plate. Lock the lead, use React Image Editor to make it visible, and your exact saved image decides what Cala Verda wakes up believing.</p>
            <div className="desk-actions">
              <button ref={startButtonRef} className="ink-button" onClick={browseFieldCalls}>Start tonight&apos;s run <span>→</span></button>
              <span className="edition-note">5 cases<br />1 print to make</span>
            </div>
            {desk.filed > 0 ? (
              <div className="desk-resume" aria-label="Where tonight's edition stands">
                <span className="run-card-label">Still running / {tier.label}</span>
                <p><b>{String(desk.filed).padStart(2, '0')} plates</b> already went to the stone. {tier.deskLine}</p>
                <div className="desk-resume-actions">
                  <button className="text-button" onClick={() => navigateTo('archive')}>Open the issue wall →</button>
                  <button className="text-button" onClick={() => setIsStandingOpen(true)}>Read the standing sheet →</button>
                </div>
              </div>
            ) : (
              <div className="run-card" aria-label="How to complete tonight's run">
                <span className="run-card-label">Desk rule / two truths, one print</span>
                <ol>
                  <li><b>01</b><span>Pick one late-night case.</span></li>
                  <li><b>02</b><span>Lock a story angle, then frame and mark the evidence.</span></li>
                  <li><b>03</b><span>Save it. Your exact export and angle hit the issue wall.</span></li>
                </ol>
              </div>
            )}
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
            <p>Choose a case, decide what the photograph proves, then edit it for the front page. Return to the same case with another angle and the desk must answer for two unreconciled versions.</p>
          </div>
          <div className="call-list">
            {ASSIGNMENTS.map((assignment, index) => {
              const printed = desk.plates.filter((plate) => plate.assignmentId === assignment.id);
              const bothSides = new Set(printed.map((plate) => plate.angleId)).size > 1;

              return (
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
                    {printed.length > 0 && (
                      <span className={`call-record ${bothSides ? 'is-contradicted' : ''}`}>
                        {bothSides
                          ? 'TWO VERSIONS PRINTED / ON THE RECORD'
                          : `ALREADY PRINTED / ${printed[0].angleStamp}`}
                      </span>
                    )}
                    <span className="call-pick">Open evidence desk <b>↗</b></span>
                  </button>
                </article>
              );
            })}
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
                {/* One objective, one recommended tool. The full route is
                    still here, one click away, but it no longer stands
                    between the visitor and the canvas. */}
                <div className="first-move">
                  <span>Start here</span>
                  <b>{TOOL_NAMES[selectedAngle.moves[0].tool]}</b>
                  <p>{selectedAngle.moves[0].instruction}</p>
                  <i>Then Save. One visible move is enough to print.</i>
                </div>
                <details className="tool-route-details">
                  <summary>Full three-move route <span aria-hidden="true">▾</span></summary>
                  <ol className="editor-moves tool-route" aria-label={`${selectedAngle.label} suggested tool route`}>
                    {selectedAngle.moves.map((move, index) => (
                      <li key={`${move.tool}-${index}`}><b>0{index + 1}</b><span className="move-copy"><strong>{TOOL_NAMES[move.tool]}</strong>{move.instruction}</span></li>
                    ))}
                  </ol>
                </details>
                <div className="angle-lock-summary">
                  <span>ANGLE LOCK / {selectedAngle.label}</span>
                  <div className="angle-options" role="group" aria-label="Change the dispatch angle">
                    {selected.angles.map((angle) => (
                      <button key={angle.id} type="button" className={angle.id === selectedAngle.id ? 'is-selected' : ''} onClick={() => lockAngle(angle.id)} aria-pressed={angle.id === selectedAngle.id}>{angle.label}</button>
                    ))}
                  </div>
                  {desk.plates.some((plate) => plate.assignmentId === selected.id && plate.angleId !== selectedAngle.id) && (
                    <p className="angle-revision-note">This case already ran with the other lead. Print this version and both stay on the wall, unreconciled; city heat rises.</p>
                  )}
                </div>
              </>
            ) : (
              <div className="angle-lock-note">
                <b>ANGLE LOCK REQUIRED</b>
                <p>Choose what this image proves. The lead changes the edit route, the printed stamp, and what happens next.</p>
              </div>
            )}
            <div className="edit-brief-foot">
              {/* The live sample, beside the canvas rather than after Save. */}
              <LiveReadCard
                editorRef={imageEditorRef}
                plateUrl={selected.image}
                region={selectedAngle ? leadRegion(selected.id, selectedAngle.id) : null}
                active={Boolean(selectedAngle) && editorReady && !editorFailed && !isPublishing}
              />
              <p className="editor-status" role="status">{editorStatus}</p>
              {editorFailed && editorFailures < EDITOR_RETRY_LIMIT && <button className="retry-button" onClick={retryEditor}>Retry editor →</button>}
              {editorFailed && editorFailures >= EDITOR_RETRY_LIMIT && <button className="retry-button" onClick={() => navigateTo('calls')}>Take a different call →</button>}
            </div>
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
            heldEdition={tier.holds}
            onLockAngle={(angleId) => void lockAngle(angleId)}
            onEditorCrash={() => noteEditorFailure('The image desk module was interrupted. Retry when the connection is ready.')}
            onEditorLoad={() => {
              setEditorFailed(false);
              setEditorReady(true);
              setEditorFailures(0);
              setEditorStatus(
                selectedAngle
                  ? `Image desk connected. Start with ${TOOL_NAMES[selectedAngle.moves[0].tool]}, then Save.`
                  : 'Image desk connected. Make the locked lead visible, then Save.',
              );
            }}
            onEditorLoadError={() => noteEditorFailure('The field plate did not load. Retry the editor or return to the cases.')}
            onEditorError={() => noteEditorFailure('The image desk could not open. Retry the editor when the connection is ready.')}
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
            {lastCharge && activeDispatch.id === desk.plates[0]?.id && (
              <div className={`heat-charge heat-${tier.id}`} aria-label="What this dispatch cost the desk">
                <span>CITY HEAT / +{lastCharge.total} / {tier.label}</span>
                <ul>
                  <li><b>+{lastCharge.base}</b> a plate went to print</li>
                  {lastCharge.repeatLead > 0 && <li><b>+{lastCharge.repeatLead}</b> that lead was already on the wall</li>}
                  {lastCharge.repeatTechnique > 0 && <li><b>+{lastCharge.repeatTechnique}</b> the desk reused {lastCharge.repeats.length === 1 ? 'a move it has run before' : 'moves it has run before'}</li>}
                  {lastCharge.contradiction > 0 && <li className="is-contradiction"><b>+{lastCharge.contradiction}</b> a second angle ran without reconciling the first</li>}
                </ul>
                {lastCharge.notices[0] && <p>{lastCharge.notices[0]}</p>}
              </div>
            )}
            <div className="proof-pair" aria-label="Original field plate compared with the exact saved editor export">
              <figure>
                <img src={activeAssignment.preview} width="768" height="512" decoding="async" alt={`Original field plate for ${activeAssignment.title}`} />
                <figcaption>01 / FIELD SOURCE</figcaption>
              </figure>
              <span aria-hidden="true">→</span>
              <figure>
                {activeDispatch.image ? (
                  <img src={activeDispatch.image} decoding="async" alt={`Small proof of the exact saved ${activeAssignment.title} export`} />
                ) : (
                  <span className="plate-missing">NEGATIVE<br />NOT ON FILE</span>
                )}
                <figcaption>02 / UNLAYER EXPORT</figcaption>
              </figure>
            </div>
            <p className="reveal-proof">
              {activeDispatch.image
                ? <>The image at right is the exact flattened <b>dataUrl</b> returned by React Image Editor. Saltline&apos;s paper and stamp sit around it; they never replace or crop it.</>
                : <>This record came back from an earlier visit. The archive box only keeps the newest negatives, so the ledger below survived and the pixels did not.</>}
            </p>
            <dl className="export-ledger">
              <div><dt>PLATE</dt><dd>{activeDispatch.plateCode}</dd></div>
              <div><dt>EXPORT</dt><dd>{activeDispatch.width && activeDispatch.height ? `${activeDispatch.width} × ${activeDispatch.height}` : 'FLATTENED'} / {activeDispatch.mimeType.replace('image/', '').toUpperCase()} / {formatBytes(activeDispatch.byteSize)}</dd></div>
              <div><dt>PRESS</dt><dd>{pressLedgerLine(activeDispatch.press)}</dd></div>
              <div><dt>LEAD</dt><dd>{leadLedgerLine(activeDispatch.lead)}</dd></div>
            </dl>
            <div className="reveal-actions">
              <button className="ink-button" onClick={() => { advanceProgress(4); setScreen('archive'); setIsClosingFrameOpen(true); }}>Close the edition <span>→</span></button>
              <button className="text-button front-page-action" disabled={isPublishing || !activeDispatch.image} onClick={() => void downloadFrontPage()}>{isPublishing ? 'Developing front page…' : 'Keep front page ↓'}<small>1600 × 2000 PNG</small></button>
              <button className="text-button" disabled={!activeDispatch.image} onClick={() => void downloadDispatch()}>Keep exact plate ↓</button>
            </div>
          </div>
          <article className={`printed-dispatch accent-${activeAssignment.accent}`} aria-label={`Your finished ${activeAssignment.title} front page`}>
            <div className="dispatch-masthead">
              <strong>SALTLINE</strong>
              <span>NIGHT EDITION / CALA VERDA</span>
              <b>{activeDispatch.issue}</b>
            </div>
            <div className="dispatch-kicker"><span>{activeAssignment.title} / {activeAssignment.place}</span><span>{activeDispatch.plateCode}</span></div>
            <h2 className="dispatch-headline"><span>{activeDispatch.closingLead}</span><em>{activeDispatch.closingEmphasis}</em></h2>
            <div className="dispatch-image">
              {activeDispatch.image
                ? <img src={activeDispatch.image} decoding="async" alt={`Edited dispatch for ${activeAssignment.title}`} />
                : <span className="plate-missing">NEGATIVE NOT ON FILE</span>}
            </div>
            <div className="dispatch-caption"><span>EXACT UNLAYER EXPORT / {activeDispatch.press.playLabel}</span><span>{activeDispatch.createdAt}</span></div>
            <div className="dispatch-copy">
              <p>{activeDispatch.closingDeck}</p>
              <dl>
                <div><dt>ANGLE</dt><dd>{activeDispatch.angleLabel}</dd></div>
                <div><dt>CITY HEAT</dt><dd>{tier.label} / {desk.heat} INK</dd></div>
                <div><dt>PLATE</dt><dd>{activeDispatch.plateCode}</dd></div>
              </dl>
            </div>
            <div className="dispatch-stamp">{activeDispatch.angleStamp}<br />{activeDispatch.createdAt}</div>
            <div className="dispatch-rule"><span>YOUR EDIT. YOUR ANGLE. ON THE RECORD.</span><span>ISSUE 04 / NIGHT DESK</span></div>
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

          {/* The wall's own heat panel. Tier copy, the itemised standing, and
              the in-world route to a clean edition. */}
          <div className={`wall-heat heat-${tier.id}`} aria-label="City heat standing">
            <div className="wall-heat-head">
              <span>CITY HEAT</span>
              <b data-wall-tier>{tier.label}</b>
              <span className="heat-gauge" aria-hidden="true"><i style={{ width: `${Math.round(gauge * 100)}%` }} /></span>
              <span className="wall-heat-count">{desk.heat} INK / {String(desk.filed).padStart(2, '0')} FILED</span>
            </div>
            <p data-wall-desk-line>{tier.deskLine}</p>
            <p className="wall-heat-standing">{standingSummary(desk)}</p>
            <div className="wall-heat-actions">
              <button className="text-button" onClick={() => setIsStandingOpen(true)}>Read the standing sheet →</button>
              <button className="text-button" onClick={() => void setCleanEdition()}>Set a clean edition ↺</button>
            </div>
          </div>

          {tier.notice && (
            <aside className="wall-notice" aria-label="Notice pinned to the issue wall" data-wall-notice>
              <span>{tier.notice.from}</span>
              <p>{tier.notice.body}</p>
              <i>PINNED TO THE WALL BY THE NIGHT DESK. NOT WITHDRAWN.</i>
            </aside>
          )}

          {contradicted.length > 0 && (
            <aside className="wall-contradictions" aria-label="Cases with unreconciled coverage" data-wall-contradictions>
              <span>UNRECONCILED COVERAGE / {String(contradicted.length).padStart(2, '0')}</span>
              <ul>
                {contradicted.map((pair) => {
                  const assignment = ASSIGNMENTS.find((item) => item.id === pair.assignmentId);
                  return (
                    <li key={pair.assignmentId}>
                      <b>{assignment?.title ?? pair.assignmentId}</b>
                      <span>
                        {pair.angles.map((angle) => `“${angle.angleLabel}” at ${angle.createdAt}`).join(' and ')}. Both versions are on this wall. The desk has not explained the change in lead.
                      </span>
                    </li>
                  );
                })}
              </ul>
            </aside>
          )}

          {desk.plates.length ? (
            <div className="archive-wall">
              {desk.plates.map((plate, index) => {
                const assignment = ASSIGNMENTS.find((item) => item.id === plate.assignmentId) ?? ASSIGNMENTS[0];
                const turn = { '--turn': `${index % 2 ? 1.8 : -1.5}deg` } as React.CSSProperties;
                const inner = (
                  <>
                    {plate.image
                      ? <img src={plate.image} loading="lazy" decoding="async" alt={`Open saved ${assignment.title} dispatch`} />
                      : <span className="plate-missing">NEGATIVE NOT ON FILE</span>}
                    <span>{plate.issue} / {assignment.title}</span>
                    <i>{plate.angleStamp} / {plate.createdAt}</i>
                    <small>{plate.angleOutcome}</small>
                    <b>{plate.plateCode}</b>
                    {plate.contradicted && <em className="plate-flag plate-flag-contradicted">UNRECONCILED IN PRINT</em>}
                    {plate.spiked && <em className="plate-flag plate-flag-spiked">SPIKED BY ORDER</em>}
                  </>
                );

                // A spiked plate has been pulled. It stays on the wall as a
                // record and stops being something you can open.
                return plate.spiked ? (
                  <div
                    key={plate.id}
                    className={`archive-item is-spiked accent-${assignment.accent}`}
                    style={turn}
                    aria-label={`${assignment.title} dispatch, spiked by order of the publisher`}
                  >
                    {inner}
                  </div>
                ) : (
                  <button
                    key={plate.id}
                    className={`archive-item accent-${assignment.accent} ${plate.contradicted ? 'is-contradicted' : ''}`}
                    style={turn}
                    onClick={() => openArchivedDispatch(plate)}
                  >
                    {inner}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="empty-wall">
              <span>NO PLATES YET</span>
              <p>The wall starts empty. Take a field call, work the plate, and make the first mark that lasts.</p>
              <i>Whatever you print stays here between visits, under one key in this browser, until you set a clean edition.</i>
              <button className="ink-button" onClick={browseFieldCalls}>Open field calls <span>→</span></button>
            </div>
          )}

          {/* The back page. Cala Verda's small ads: every one of them a front,
              every one of them written for this project. */}
          <aside className="small-ads" aria-label="Classifieds from tonight's back page">
            <span className="small-ads-head">CALA VERDA CLASSIFIEDS / BACK PAGE / PAID IN FULL</span>
            <ul>
              {smallAds.map((ad) => (
                <li key={ad.name}>
                  <b>{ad.name}</b>
                  <p>{ad.copy}</p>
                  <i>{ad.rate}</i>
                </li>
              ))}
            </ul>
            <p className="small-ads-foot">Advertisements are fictional businesses invented for Saltline. The paper takes their money and investigates them in the same edition.</p>
          </aside>
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
            <h2 id="discard-title">{discardAsk.title}</h2>
            <p>{discardAsk.message}</p>
            <div className="discard-actions">
              <button className="ink-button" onClick={() => answerDiscard(true)} autoFocus>{discardAsk.confirm} <span>→</span></button>
              <button className="text-button" onClick={() => answerDiscard(false)}>{discardAsk.keep}</button>
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
            {isPressSlow && <small>Still developing. A slow line makes the press wait — nothing has been lost, and your marks are still on the plate.</small>}
          </div>
        </div>
      )}

      {isStandingOpen && (
        <section
          ref={standingDialogRef}
          className="standing-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="standing-title"
          tabIndex={-1}
          onKeyDown={(event) => handleDialogKeyDown(event, closeStanding)}
        >
          <article className={`standing-sheet heat-${tier.id}`}>
            <div className="standing-masthead">
              <span>SALTLINE / NIGHT DESK / STANDING SHEET</span>
              <span>ISSUE 04 · {String(desk.filed).padStart(2, '0')} FILED</span>
            </div>
            <div className="standing-body">
              <p className="eyebrow">City heat / {desk.heat} ink</p>
              <h2 id="standing-title" data-standing-tier>{tier.label}</h2>
              <span className="heat-gauge heat-gauge-large" aria-hidden="true"><i style={{ width: `${Math.round(gauge * 100)}%` }} /></span>
              <p className="standing-desk-line">{tier.deskLine}</p>
              <p className="standing-summary">{standingSummary(desk)}</p>

              <dl className="standing-ledger">
                <div><dt>PLATES FILED</dt><dd>{String(desk.filed).padStart(2, '0')}</dd></div>
                <div><dt>ON THE WALL</dt><dd>{String(desk.plates.length).padStart(2, '0')}</dd></div>
                <div><dt>UNRECONCILED</dt><dd>{String(desk.contradictions.length).padStart(2, '0')}</dd></div>
                <div><dt>SPIKED</dt><dd>{String(desk.plates.filter((plate) => plate.spiked).length).padStart(2, '0')}</dd></div>
              </dl>

              {repeatLeads.length > 0 && (
                <div className="standing-block">
                  <span>LEADS YOU KEEP COMING BACK TO</span>
                  <ul>
                    {repeatLeads.map((lead) => (
                      <li key={lead.key}><b>×{lead.uses}</b> {lead.label}</li>
                    ))}
                  </ul>
                </div>
              )}

              {repeatMoves.length > 0 && (
                <div className="standing-block">
                  <span>MOVES THE DESK KEEPS RUNNING</span>
                  <ul>
                    {repeatMoves.map((move) => (
                      <li key={move.key}><b>×{move.uses}</b> {move.label}</li>
                    ))}
                  </ul>
                  <i>A move here is one of the readings already printed in your export ledger — how you cut the plate, how you graded it, whether the marks landed on the lead. The desk never guesses which buttons you pressed.</i>
                </div>
              )}

              {desk.notices.length > 0 && (
                <div className="standing-block standing-notices">
                  <span>WHAT THE DESK SAID LAST</span>
                  <ul>
                    {desk.notices.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="standing-memory" data-standing-memory>{memoryLine}</p>
            </div>
            <div className="standing-footer">
              <button className="text-button" onClick={() => void setCleanEdition()}>Set a clean edition ↺</button>
              <button className="ink-button" onClick={closeStanding}>Back to the desk <span>→</span></button>
            </div>
          </article>
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
              <figure className="closing-image">
                {activeDispatch.image
                  ? <img src={activeDispatch.image} decoding="async" alt={`Saved closing frame for ${activeAssignment.title}`} />
                  : <span className="plate-missing">NEGATIVE NOT ON FILE</span>}
                <figcaption>{activeAssignment.place} / {activeDispatch.createdAt}</figcaption>
              </figure>
              <div className="closing-copy"><p className="eyebrow">The print is dry. The city is not.</p><h2 id="closing-title">{activeDispatch.closingLead}<br /><em>{activeDispatch.closingEmphasis}</em></h2><p>{activeDispatch.closingDeck}</p><p className="closing-heat" data-closing-heat><b>{tier.label}</b>{tier.closingLine}</p><div className="closing-sound">TIDE / TRAFFIC / PAPER</div></div>
            </div>
            <div className="closing-footer"><span>NOT A HERO. A WITNESS WITH A PRINT RUN.</span><button className="ink-button" onClick={closeClosingFrame}>File the night <span>→</span></button></div>
          </article>
        </section>
      )}
    </main>
  );
}
