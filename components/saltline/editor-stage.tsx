/* eslint-disable @next/next/no-img-element -- the plate previews are fixed-size
   same-origin display derivatives sitting behind the editor canvas; they must
   not be re-encoded or lazily swapped while the editor is initialising. */
'use client';

import {
  Component,
  Suspense,
  lazy,
  type LazyExoticComponent,
  type ReactNode,
  type RefObject,
} from 'react';
import type { ImageEditorRef, ImageEditorSaveResult } from '@unlayer/react-image-editor';
import type { Angle, Assignment, ToolCue } from '@/lib/assignments';

// ---------------------------------------------------------------------------
// The React Image Editor integration.
//
// Everything Saltline does with @unlayer/react-image-editor lives in this
// file: how the module is loaded, which tools are enabled, what happens when
// it fails, and what sits over it while it boots.
//
// The editor is code-split and only fetched once a visitor is heading for a
// case, so the landing screen never pays for it. The promise is cached so the
// pointerdown prefetch, the screen transition, and React.lazy all share one
// network request; a failed import clears the cache so Retry is a real retry.
// ---------------------------------------------------------------------------

type ImageEditorModule = typeof import('@unlayer/react-image-editor');
type ImageEditorComponent = ImageEditorModule['default'];

let editorImportPromise: Promise<ImageEditorModule> | null = null;

function loadImageEditor() {
  editorImportPromise ??= import('@unlayer/react-image-editor');
  return editorImportPromise;
}

/** A fresh lazy wrapper around the editor module. Each retry gets its own. */
export function createImageEditor(): LazyExoticComponent<ImageEditorComponent> {
  return lazy(loadImageEditor);
}

/** Warm the editor chunk before the visitor reaches the editor screen. */
export function preloadImageEditor() {
  const promise = loadImageEditor();
  void promise.catch(() => {
    if (editorImportPromise === promise) editorImportPromise = null;
  });
}

/** Drop the cached module promise so the next load is a real network attempt. */
export function resetImageEditorModule() {
  editorImportPromise = null;
}

// The rail in Saltline's language.
//
// `translations` is one of the three keys the wrapper applies through
// updateOptions rather than a remount (theme, locale, translations - see
// ImageEditor.tsx's updatableKey), so renaming the dock is safe and cannot
// cost the visitor their work. `features` is on the remount path and is
// therefore set once, below, and never touched again.
//
// Save keeps its own name on purpose. The brief rail, the README, and
// Unlayer's own documentation all say "Save", and the one control the whole
// journey depends on is not the place to be clever.
const EDITOR_TRANSLATIONS = {
  en: {
    'image_editor.tools.crop': 'FRAME',
    'image_editor.tools.filter': 'GRADE',
    'image_editor.tools.draw': 'MARK UP',
    'image_editor.tools.text': 'CAPTION',
    'image_editor.tools.shapes': 'BOXES',
    'image_editor.tools.frame': 'BORDER',
  },
};

// The tool dock Saltline exposes. Crop, Filter, Draw, Text, Shapes, and Frame
// are the six moves the assignments' tool routes are written against; resize
// and stickers are off because neither can carry an editorial claim.
export const EDITOR_OPTIONS = {
  theme: 'dark' as const,
  locale: 'en' as const,
  translations: EDITOR_TRANSLATIONS,
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

/**
 * The in-world name for each enabled tool.
 *
 * lib/assignments.ts keeps Unlayer's own tool identities, so
 * scripts/check-content.mjs can still prove that every authored route points
 * at a tool that is actually enabled. This is the single place those
 * identities are turned into the words on the rail, so the brief and the dock
 * can never drift apart.
 */
export const TOOL_NAMES: Record<ToolCue['tool'], string> = {
  Crop: 'FRAME',
  Filter: 'GRADE',
  Draw: 'MARK UP',
  Text: 'CAPTION',
  Shapes: 'BOXES',
  Frame: 'BORDER',
};

type EditorBoundaryProps = {
  children: ReactNode;
  onFailure: () => void;
  resetKey: number;
};

type EditorBoundaryState = {
  failed: boolean;
  resetKey: number;
};

/**
 * Catches a crash inside the editor subtree so a failed chunk or a throwing
 * render degrades to the Retry affordance in the brief rail instead of taking
 * the whole night desk down. Bumping `resetKey` re-arms it.
 */
export class EditorBoundary extends Component<EditorBoundaryProps, EditorBoundaryState> {
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

type AngleLockGateProps = {
  assignment: Assignment;
  onLockAngle: (angleId: string) => void;
};

/**
 * The Angle Lock gate. It sits over the editor mount until the visitor decides
 * what the plate proves, because the tool route, the printed stamp, and the
 * closing frame all follow from that choice.
 */
function AngleLockGate({ assignment, onLockAngle }: AngleLockGateProps) {
  return (
    <div className="angle-gate">
      <img className="angle-gate-image" src={assignment.preview} width="768" height="512" decoding="async" alt="" />
      <div className="angle-gate-panel">
        <p className="eyebrow">The same plate can tell two true stories.</p>
        <h2>Lock the lead<br /><em>before you mark it.</em></h2>
        <div className="angle-gate-options" role="group" aria-label="Choose the dispatch angle">
          {assignment.angles.map((angle, index) => (
            <button key={angle.id} type="button" onClick={() => onLockAngle(angle.id)}>
              <span>ANGLE 0{index + 1}</span>
              <strong>{angle.label}</strong>
              <small>{angle.prompt}</small>
              <i>{angle.moves.map((move) => TOOL_NAMES[move.tool]).join(' + ')}</i>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Shown over the editor mount from Angle Lock until the editor's own onLoad. */
function EditorLoader({ assignment, failed }: { assignment: Assignment; failed: boolean }) {
  return (
    <div className="editor-loader" aria-hidden="true">
      <img src={assignment.preview} width="768" height="512" decoding="async" alt="" />
      <div className="editor-loader-copy">
        <span>FULL-RES FIELD PLATE</span>
        <b>{failed ? 'SIGNAL INTERRUPTED' : 'DEVELOPING AT THE NIGHT DESK'}</b>
        <i />
      </div>
    </div>
  );
}

type EditorStageProps = {
  /** A fresh wrapper is supplied after each Retry so the import runs again. */
  EditorComponent: LazyExoticComponent<ImageEditorComponent>;
  assignment: Assignment;
  angle: Angle | null;
  editorRef: RefObject<ImageEditorRef | null>;
  editorAttempt: number;
  editorReady: boolean;
  editorFailed: boolean;
  isPublishing: boolean;
  /** True once city heat has reached the tier where the desk is told to hold. */
  heldEdition: boolean;
  onLockAngle: (angleId: string) => void;
  onEditorCrash: () => void;
  onEditorLoad: () => void;
  onEditorLoadError: () => void;
  onEditorError: () => void;
  onSave: (result: ImageEditorSaveResult) => void;
  onCancel: () => void;
};

/**
 * The right-hand two thirds of the editor screen: the live bar, the editor
 * mount itself, and the save instruction. The full-resolution plate handed to
 * `image` is the same-origin canonical file, so the editor's export is a clean
 * flattened data URL rather than a tainted canvas.
 */
export function EditorStage({
  EditorComponent,
  assignment,
  angle,
  editorRef,
  editorAttempt,
  editorReady,
  editorFailed,
  isPublishing,
  heldEdition,
  onLockAngle,
  onEditorCrash,
  onEditorLoad,
  onEditorLoadError,
  onEditorError,
  onSave,
  onCancel,
}: EditorStageProps) {
  return (
    <div className="editor-stage">
      <div className="editor-stage-bar">
        <span><i className="live-dot" /> UNLAYER REACT IMAGE EDITOR / FULL-RES FIELD PLATE</span>
        <span>{!angle ? 'ANGLE LOCK REQUIRED' : heldEdition ? 'EDITION HELD / SAVE STILL PRINTS' : 'SAVE = PUBLISH'}</span>
      </div>
      <div className="editor-shell" aria-busy={Boolean(angle) && !editorReady && !editorFailed}>
        {!angle && <AngleLockGate assignment={assignment} onLockAngle={onLockAngle} />}
        {angle && !editorReady && <EditorLoader assignment={assignment} failed={editorFailed} />}
        {angle && (
          <EditorBoundary resetKey={editorAttempt} onFailure={onEditorCrash}>
            <Suspense fallback={null}>
              <EditorComponent
                ref={editorRef}
                key={`${assignment.id}-${editorAttempt}`}
                image={assignment.image}
                minHeight="min(64vh, 720px)"
                options={EDITOR_OPTIONS}
                onLoad={onEditorLoad}
                onLoadError={onEditorLoadError}
                onError={onEditorError}
                onSave={onSave}
                onCancel={onCancel}
              />
            </Suspense>
          </EditorBoundary>
        )}
      </div>
      <div className="editor-actions">
        <p>{angle ? <>Make at least one visible editorial move, then click <strong>Save (✓)</strong> in Unlayer&apos;s top-right corner. That exact export is the only route to print.</> : <>Choose an <strong>Angle Lock</strong> above. The full-resolution plate and editor module are already being prepared.</>}</p>
        {angle && <span className="save-cue" aria-hidden="true">{isPublishing ? 'PRINTING…' : 'SAVE ↑'}</span>}
      </div>
      {/* Shown only on a narrow viewport, where the rail collapses to icons
          and the canvas is the tightest thing in the app. */}
      <p className="editor-narrow-note">Turn the handset sideways for a wider canvas. The rail collapses to icons at this width; your plate and your marks are unaffected either way.</p>
    </div>
  );
}
