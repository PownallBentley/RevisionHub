// src/pages/child/sessionSteps/SummaryStep.tsx
// Step 5: Key takeaways + mnemonic
// UPDATED: January 2026
// - Key takeaways now pulled from reinforce.slides[].key_points
// - Mnemonic suitability check based on subject
// - Removed placeholder buttons (Save to Flashcards, Create Your Own)
// - Child-friendly language updates
//
// RPC-first:
// - No direct table writes from the client
// - No reliance on passing child_id for favourites/plays (RPC derives child from auth.uid())
// - Favourite toggle + play tracking calls are routed through mnemonicActivityService (RPC)

import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faLightbulb,
  faBrain,
  faRobot,
  faWandMagicSparkles,
  faCheck,
  faPlay,
  faPause,
  faDownload,
  faHeart,
  faMusic,
  faCompactDisc,
  faGuitar,
  faMicrophone,
  faSpinner,
  faFlask,
  faCalculator,
  faAtom,
  faGlobe,
  faLandmark,
  faDna,
  faBook,
  faTriangleExclamation,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

import {
  isMnemonicFavourite,
  setMnemonicFavourite,
  startMnemonicPlay,
  endMnemonicPlay,
} from "../../../services/mnemonics/mnemonicActivityService";

import {
  requestMnemonicTracked,
  transformToMnemonicData,
  MnemonicStyle as ApiMnemonicStyle,
} from "../../../services/mnemonics/mnemonicApi";

// =============================================================================
// Types
// =============================================================================

type KeyTakeaway = {
  id: string;
  title: string;
  description: string;
};

type TeachingSlide = {
  id: string;
  title: string;
  content: string;
  key_points?: string[];
  examiner_tip?: string;
  slide_number?: number;
};

type MnemonicStyle = "hip-hop" | "pop" | "rock";

type MnemonicData = {
  mnemonicId: string | null; // DB mnemonic UUID
  style: MnemonicStyle;
  styleReference: string;
  lyrics: string;
  audioUrl: string | null;
  durationSeconds: number | null;
  status: "pending" | "generating" | "ready" | "failed";
};

type SummaryStepProps = {
  overview: {
    subject_name: string;
    subject_icon?: string;
    subject_color?: string;
    topic_name: string;
    topic_id?: string;
    session_duration_minutes: number | null;
    step_key: string;
    step_index: number;
    total_steps: number;

    // From SessionRun
    child_id: string; // kept for compatibility, not used for DB writes here
    revision_session_id: string;
  };
  payload: {
    reinforce?: {
      slides?: TeachingSlide[];
    };
    summary?: {
      keyTakeaways?: KeyTakeaway[];
      mnemonic?: MnemonicData;
      selectedStyle?: MnemonicStyle;
    };
  };
  saving: boolean;
  onPatch: (patch: Record<string, any>) => Promise<void>;
  onNext: () => Promise<void>;
  onBack: () => void;
  onExit: () => void;
  onRequestMnemonic?: (style: MnemonicStyle) => Promise<MnemonicData>;
};

// =============================================================================
// Icon Mapping
// =============================================================================

const ICON_MAP: Record<string, IconDefinition> = {
  calculator: faCalculator,
  book: faBook,
  flask: faFlask,
  atom: faAtom,
  globe: faGlobe,
  landmark: faLandmark,
  dna: faDna,
};

function getIconFromName(iconName?: string): IconDefinition {
  if (!iconName) return faFlask;
  return ICON_MAP[iconName.toLowerCase()] || faFlask;
}

// =============================================================================
// Mnemonic Suitability Check
// =============================================================================

// Subjects that benefit from mnemonics (formulas, dates, sequences)
const MNEMONIC_SUITABLE_SUBJECTS = [
  "chemistry",
  "physics",
  "biology",
  "maths",
  "mathematics",
  "history",
  "geography",
  "computer science",
  "computing",
];

// Subjects that don't benefit from mnemonics (analysis, essay-based)
const MNEMONIC_UNSUITABLE_SUBJECTS = [
  "english literature",
  "english language",
  "religious studies",
  "art",
  "drama",
];

function isSubjectMnemonicSuitable(subjectName: string): boolean {
  const normalised = subjectName.toLowerCase().trim();
  
  // Check explicit unsuitable first
  if (MNEMONIC_UNSUITABLE_SUBJECTS.some(s => normalised.includes(s))) {
    return false;
  }
  
  // Check explicit suitable
  if (MNEMONIC_SUITABLE_SUBJECTS.some(s => normalised.includes(s))) {
    return true;
  }
  
  // Default to not suitable for unknown subjects (cost control)
  return false;
}

// =============================================================================
// Key Takeaways Extraction
// =============================================================================

function extractKeyTakeaways(payload: SummaryStepProps["payload"]): KeyTakeaway[] {
  const takeaways: KeyTakeaway[] = [];
  
  // First, try to get from summary.keyTakeaways if already computed
  if (payload.summary?.keyTakeaways && payload.summary.keyTakeaways.length > 0) {
    return payload.summary.keyTakeaways;
  }
  
  // Extract from reinforce.slides[].key_points
  const slides = payload.reinforce?.slides ?? [];
  
  slides.forEach((slide, slideIndex) => {
    if (slide.key_points && slide.key_points.length > 0) {
      slide.key_points.forEach((point, pointIndex) => {
        takeaways.push({
          id: `${slide.id}-${pointIndex}`,
          title: slide.title || `Key Point ${slideIndex + 1}`,
          description: point,
        });
      });
    }
  });
  
  // If no key points found, create a summary from slide titles
  if (takeaways.length === 0 && slides.length > 0) {
    slides.forEach((slide, index) => {
      if (slide.title) {
        takeaways.push({
          id: `slide-${index}`,
          title: slide.title,
          description: slide.content?.substring(0, 150) + (slide.content?.length > 150 ? "..." : "") || "Review this concept in your notes.",
        });
      }
    });
  }
  
  // Limit to 5 takeaways maximum
  return takeaways.slice(0, 5);
}

// =============================================================================
// Style Configuration
// =============================================================================

const MNEMONIC_STYLES: Array<{
  id: MnemonicStyle;
  name: string;
  description: string;
  icon: IconDefinition;
  gradient: string;
  styleReference: string;
}> = [
  {
    id: "hip-hop",
    name: "Hip-Hop",
    description: "Catchy rap beats",
    icon: faMicrophone,
    gradient: "from-purple-500 to-pink-500",
    styleReference: "street-anthem",
  },
  {
    id: "pop",
    name: "Pop",
    description: "Upbeat melody",
    icon: faMusic,
    gradient: "from-blue-500 to-cyan-500",
    styleReference: "upbeat-pop",
  },
  {
    id: "rock",
    name: "Rock",
    description: "Electric vibes",
    icon: faGuitar,
    gradient: "from-orange-500 to-red-500",
    styleReference: "indie-rock",
  },
];

// =============================================================================
// Helpers
// =============================================================================

function formatTime(seconds: number | null | undefined) {
  if (!seconds || Number.isNaN(seconds) || !Number.isFinite(seconds)) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function resolveAudioUrl(raw: string | null): string | null {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!supabaseUrl) return raw;

  const AUDIO_BUCKET = "mnemonics";
  const path = raw.replace(/^\/+/, "");
  return `${supabaseUrl}/storage/v1/object/public/${AUDIO_BUCKET}/${path}`;
}

function safeIntSeconds(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) return null;
  if (value < 0) return 0;
  return Math.round(value);
}

// =============================================================================
// Sub-components
// =============================================================================

function KeyTakeawayCard({ takeaway, index }: { takeaway: KeyTakeaway; index: number }) {
  return (
    <div className="flex items-start space-x-4 p-4 bg-neutral-50 rounded-xl">
      <div className="w-8 h-8 bg-accent-green rounded-full flex items-center justify-center flex-shrink-0 mt-1">
        <span className="text-white font-bold text-sm">{index + 1}</span>
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-neutral-700 mb-2">{takeaway.title}</h3>
        <p className="text-neutral-600 text-sm">{takeaway.description}</p>
      </div>
    </div>
  );
}

function MnemonicStyleSelector({
  selectedStyle,
  onSelect,
  disabled,
}: {
  selectedStyle: MnemonicStyle | null;
  onSelect: (style: MnemonicStyle) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {MNEMONIC_STYLES.map((style) => {
        const isSelected = selectedStyle === style.id;
        return (
          <button
            key={style.id}
            type="button"
            onClick={() => onSelect(style.id)}
            disabled={disabled}
            className={`flex flex-col items-center p-4 rounded-xl transition border-2 ${
              isSelected
                ? "bg-primary-50 border-primary-600"
                : "bg-neutral-50 border-transparent hover:border-primary-300"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 bg-gradient-to-br ${style.gradient}`}
            >
              <FontAwesomeIcon icon={style.icon} className="text-white text-lg" />
            </div>
            <span className="font-semibold text-neutral-700 text-sm">{style.name}</span>
            <span className="text-neutral-500 text-xs text-center">{style.description}</span>
            {isSelected && (
              <div className="mt-2">
                <FontAwesomeIcon icon={faCheck} className="text-primary-600" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function MnemonicPlayer({
  mnemonic,
  sessionId,
}: {
  mnemonic: MnemonicData;
  sessionId: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(mnemonic.durationSeconds ?? null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isMetadataReady, setIsMetadataReady] = useState(false);

  // favourites
  const [isFav, setIsFav] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  // play tracking
  const [playId, setPlayId] = useState<string | null>(null);
  const playStartMsRef = useRef<number | null>(null);

  const styleConfig = useMemo(
    () => MNEMONIC_STYLES.find((s) => s.id === mnemonic.style),
    [mnemonic.style]
  );

  const resolvedAudioUrl = useMemo(() => resolveAudioUrl(mnemonic.audioUrl), [mnemonic.audioUrl]);

  const progressPercent = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  }, [currentTime, duration]);

  // Load favourite status when ready + id present
  useEffect(() => {
    let cancelled = false;

    async function loadFav() {
      if (mnemonic.status !== "ready") return;
      if (!mnemonic.mnemonicId) return;

      try {
        const fav = await isMnemonicFavourite({ mnemonicId: mnemonic.mnemonicId });
        if (!cancelled) setIsFav(fav);
      } catch (e) {
        console.error("[MnemonicPlayer] favourite lookup failed:", e);
      }
    }

    loadFav();
    return () => {
      cancelled = true;
    };
  }, [mnemonic.status, mnemonic.mnemonicId]);

  // Reset player state when mnemonic changes
  useEffect(() => {
    setIsPlaying(false);
    setDuration(mnemonic.durationSeconds ?? null);
    setCurrentTime(0);
    setAudioError(null);
    setIsMetadataReady(false);

    if (playId) {
      void endMnemonicPlay({
        playId,
        playDurationSeconds: safeIntSeconds(currentTime) ?? 0,
        completed: false,
      }).catch((e) => console.error("[MnemonicPlayer] end play (reset) failed:", e));
    }

    setPlayId(null);
    playStartMsRef.current = null;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mnemonic.audioUrl, mnemonic.durationSeconds, mnemonic.style]);

  // Close any active play on unmount
  useEffect(() => {
    return () => {
      if (!playId) return;

      const startMs = playStartMsRef.current;
      const elapsedSeconds = startMs ? (Date.now() - startMs) / 1000 : currentTime;

      void endMnemonicPlay({
        playId,
        playDurationSeconds: safeIntSeconds(elapsedSeconds) ?? safeIntSeconds(currentTime) ?? 0,
        completed: false,
      }).catch((e) => console.error("[MnemonicPlayer] end play (unmount) failed:", e));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playId]);

  async function toggleFavourite() {
    if (!mnemonic.mnemonicId) return;
    if (favBusy) return;

    setFavBusy(true);
    const next = !isFav;

    setIsFav(next); // optimistic

    try {
      await setMnemonicFavourite({
        mnemonicId: mnemonic.mnemonicId,
        makeFavourite: next,
      });
    } catch (e) {
      console.error("[MnemonicPlayer] favourite toggle failed:", e);
      setIsFav(!next); // revert
    } finally {
      setFavBusy(false);
    }
  }

  async function startPlayTrackingIfNeeded() {
    if (!mnemonic.mnemonicId) return;
    if (playId) return;

    try {
      const id = await startMnemonicPlay({
        mnemonicId: mnemonic.mnemonicId,
        sessionId,
        source: "summary",
      });
      setPlayId(id);
      playStartMsRef.current = Date.now();
    } catch (e) {
      console.error("[MnemonicPlayer] start play tracking failed:", e);
    }
  }

  async function stopPlayTracking(completed: boolean) {
    if (!playId) return;

    const startMs = playStartMsRef.current;
    const elapsedSeconds = startMs ? (Date.now() - startMs) / 1000 : currentTime;

    try {
      await endMnemonicPlay({
        playId,
        playDurationSeconds: safeIntSeconds(elapsedSeconds) ?? safeIntSeconds(currentTime) ?? 0,
        completed,
      });
    } catch (e) {
      console.error("[MnemonicPlayer] end play tracking failed:", e);
    } finally {
      setPlayId(null);
      playStartMsRef.current = null;
    }
  }

  async function togglePlay() {
    if (!audioRef.current) return;

    setAudioError(null);

    if (!resolvedAudioUrl) {
      setAudioError("No audio URL was provided for this mnemonic.");
      return;
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        await stopPlayTracking(false);
        return;
      }

      await startPlayTrackingIfNeeded();

      const playPromise = audioRef.current.play();
      if (playPromise) await playPromise;

      setIsPlaying(true);
    } catch (err) {
      console.error("[MnemonicPlayer] play() failed:", err);
      setIsPlaying(false);
      await stopPlayTracking(false);
      setAudioError(
        "Audio couldn't be played. This is usually a private file URL, an expired signed link, or a CORS issue."
      );
    }
  }

  async function handleDownload() {
    if (!resolvedAudioUrl) return;

    try {
      const res = await fetch(resolvedAudioUrl);
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `mnemonic-${mnemonic.style}.mp3`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[MnemonicPlayer] download failed:", err);
      setAudioError("Couldn't download the audio file.");
    }
  }

  if (mnemonic.status === "generating") {
    return (
      <div className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200">
        <div className="flex items-center justify-center space-x-4 py-8">
          <FontAwesomeIcon icon={faSpinner} className="text-primary-600 text-3xl animate-spin" />
          <div>
            <p className="font-semibold text-primary-900">Creating your song... 🎵</p>
            <p className="text-neutral-600 text-sm">StudyBuddy is writing lyrics and making music</p>
          </div>
        </div>
      </div>
    );
  }

  if (mnemonic.status === "failed") {
    return (
      <div className="p-6 bg-accent-red/5 rounded-xl border border-accent-red/20">
        <p className="text-accent-red font-semibold mb-2">Oops! Something went wrong 😕</p>
        <p className="text-neutral-600 text-sm">
          We couldn't make your song this time. Try picking a different style or skip for now.
        </p>
      </div>
    );
  }

  if (mnemonic.status !== "ready") return null;

  return (
    <div className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200">
      <audio
        ref={audioRef}
        src={resolvedAudioUrl ?? undefined}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = (e.currentTarget as HTMLAudioElement).duration;
          if (Number.isFinite(d)) {
            setDuration(d);
            setIsMetadataReady(true);
          }
        }}
        onTimeUpdate={(e) => setCurrentTime((e.currentTarget as HTMLAudioElement).currentTime)}
        onEnded={async () => {
          setIsPlaying(false);
          setCurrentTime(0);
          await stopPlayTracking(true);
        }}
        onError={async () => {
          setIsPlaying(false);
          await stopPlayTracking(false);
          setAudioError(
            "Audio failed to load. Check that the URL is public or signed, and that CORS allows playback."
          );
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${
              styleConfig?.gradient || "from-primary-500 to-primary-600"
            }`}
          >
            <FontAwesomeIcon icon={styleConfig?.icon || faMusic} className="text-white text-lg" />
          </div>
          <div>
            <h3 className="font-bold text-primary-900">Your {styleConfig?.name || "Song"} 🎵</h3>
            <p className="text-neutral-600 text-sm">
              {duration ? formatTime(duration) : isMetadataReady ? "Ready to play" : "Loading..."}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={toggleFavourite}
            disabled={!mnemonic.mnemonicId || favBusy}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-primary-50 transition disabled:opacity-50"
            title="Add to favourites"
          >
            <FontAwesomeIcon icon={faHeart} className={isFav ? "text-accent-red" : "text-primary-600"} />
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!resolvedAudioUrl}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-primary-50 transition disabled:opacity-50"
            title="Download"
          >
            <FontAwesomeIcon icon={faDownload} className="text-primary-600" />
          </button>
        </div>
      </div>

      {/* Audio Player */}
      <div className="bg-white rounded-xl p-4 mb-4">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-primary-600 flex items-center justify-center hover:bg-primary-700 transition flex-shrink-0"
            title={isPlaying ? "Pause" : "Play"}
          >
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-white text-xl" />
          </button>

          <div className="flex-1">
            <div className="w-full bg-neutral-200 rounded-full h-2 mb-2">
              <div
                className="bg-primary-600 h-full rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-neutral-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {!resolvedAudioUrl && (
          <div className="mt-3 text-xs text-neutral-600 flex items-start space-x-2">
            <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" />
            <span>No audio URL found. Your n8n workflow needs to return a playable URL (public or signed).</span>
          </div>
        )}

        {audioError && (
          <div className="mt-3 text-xs text-accent-red flex items-start space-x-2">
            <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" />
            <span>{audioError}</span>
          </div>
        )}
      </div>

      {/* Lyrics */}
      <div className="bg-white rounded-xl p-5">
        <h4 className="font-semibold text-neutral-700 mb-3 flex items-center space-x-2">
          <FontAwesomeIcon icon={faCompactDisc} className="text-primary-600" />
          <span>Lyrics</span>
        </h4>
        <p className="text-neutral-700 whitespace-pre-line text-sm leading-relaxed">{mnemonic.lyrics}</p>
      </div>
    </div>
  );
}

// =============================================================================
// No Mnemonic Available Message
// =============================================================================

function MnemonicNotAvailable({ subjectName }: { subjectName: string }) {
  return (
    <div className="p-6 bg-neutral-50 rounded-xl border border-neutral-200">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0">
          <FontAwesomeIcon icon={faMusic} className="text-neutral-400 text-lg" />
        </div>
        <div>
          <h3 className="font-semibold text-neutral-700 mb-2">Memory songs aren't available for {subjectName}</h3>
          <p className="text-neutral-600 text-sm">
            Songs work best for subjects with formulas, dates, or sequences to remember. 
            For this subject, focus on understanding the key points above! 📚
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function SummaryStep({
  overview,
  payload,
  saving,
  onPatch,
  onNext,
  onRequestMnemonic,
}: SummaryStepProps) {
  const summary = payload?.summary ?? {};
  const existingMnemonic = summary.mnemonic ?? null;

  // Extract key takeaways from slides
  const keyTakeaways = useMemo(() => extractKeyTakeaways(payload), [payload]);

  // Check if mnemonic generation is suitable for this subject
  const mnemonicSuitable = useMemo(
    () => isSubjectMnemonicSuitable(overview.subject_name),
    [overview.subject_name]
  );

  const [selectedStyle, setSelectedStyle] = useState<MnemonicStyle | null>(summary.selectedStyle ?? null);
  const [mnemonic, setMnemonic] = useState<MnemonicData | null>(existingMnemonic);
  const [isGenerating, setIsGenerating] = useState(false);

  const progressPercent = (overview.step_index / overview.total_steps) * 100;
  const subjectIcon = getIconFromName(overview.subject_icon);
  const subjectColor = overview.subject_color || "#5B2CFF";

  function handleSelectStyle(style: MnemonicStyle) {
    setSelectedStyle(style);
  }

  async function handleGenerateMnemonic() {
    if (!selectedStyle) return;

    const topicId = overview.topic_id;
    const topicName = overview.topic_name;

    if (!topicId) {
      console.error("[SummaryStep] Missing overview.topic_id (required for tracked mnemonic request)");
      setMnemonic({
        mnemonicId: null,
        style: selectedStyle,
        styleReference: "",
        lyrics: "",
        audioUrl: null,
        durationSeconds: null,
        status: "failed",
      });
      return;
    }

    setIsGenerating(true);
    setMnemonic({
      mnemonicId: null,
      style: selectedStyle,
      styleReference: MNEMONIC_STYLES.find((s) => s.id === selectedStyle)?.styleReference || "",
      lyrics: "",
      audioUrl: null,
      durationSeconds: null,
      status: "generating",
    });

    try {
      // If SessionRun provides a handler, use it.
      if (onRequestMnemonic) {
        const result = await onRequestMnemonic(selectedStyle);
        setMnemonic(result);

        await onPatch({
          summary: {
            ...summary,
            keyTakeaways,
            selectedStyle,
            mnemonic: result,
          },
        });
        return;
      }

      // Otherwise call the tracked flow directly (end-to-end from Summary).
      const originalPrompt = `${overview.subject_name} | ${topicName} | style=${selectedStyle} | step=summary`;

      const { response } = await requestMnemonicTracked({
        topicId,
        topicName,
        originalPrompt,
        subjectName: overview.subject_name.toLowerCase(),
        topicText: topicName,
        style: selectedStyle as ApiMnemonicStyle,
        level: "gcse",
        examBoard: null,
        callbackUrl: null,
        disableClientFallbackTracking: false,
      });

      const transformed = transformToMnemonicData(response, selectedStyle as ApiMnemonicStyle);

      const result: MnemonicData = {
        mnemonicId: transformed.mnemonicId,
        style: transformed.style as MnemonicStyle,
        styleReference: transformed.styleReference,
        lyrics: transformed.lyrics,
        audioUrl: transformed.audioUrl,
        durationSeconds: transformed.durationSeconds,
        status: transformed.status,
      };

      setMnemonic(result);

      await onPatch({
        summary: {
          ...summary,
          keyTakeaways,
          selectedStyle,
          mnemonic: result,
        },
      });
    } catch (error) {
      console.error("[SummaryStep] Mnemonic generation failed:", error);
      setMnemonic({
        mnemonicId: null,
        style: selectedStyle,
        styleReference: "",
        lyrics: "",
        audioUrl: null,
        durationSeconds: null,
        status: "failed",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleContinue() {
    await onPatch({
      summary: {
        ...summary,
        keyTakeaways,
        selectedStyle,
        mnemonic,
        completed_at: new Date().toISOString(),
      },
    });
    await onNext();
  }

  // Fallback takeaways if none extracted
  const displayTakeaways =
    keyTakeaways.length > 0
      ? keyTakeaways
      : [
          {
            id: "1",
            title: "Great job completing this session!",
            description: "Review your notes and flashcards to reinforce what you've learned today.",
          },
        ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: subjectColor }}>
            <FontAwesomeIcon icon={subjectIcon} className="text-white text-xl" />
          </div>
          <div>
            <p className="text-neutral-500 text-sm">
              {overview.subject_name} • Step {overview.step_index} of {overview.total_steps}
            </p>
            <h1 className="text-2xl font-bold text-primary-900">{overview.topic_name}</h1>
          </div>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
          <div className="bg-primary-600 h-full rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>
      </section>

      {/* Key Takeaways */}
      <section>
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center space-x-3 mb-5">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faLightbulb} className="text-primary-600 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary-900">What You've Learned 🎯</h2>
              <p className="text-neutral-500 text-sm">The key points from this session</p>
            </div>
          </div>

          <div className="space-y-3">
            {displayTakeaways.map((takeaway, index) => (
              <KeyTakeawayCard key={takeaway.id} takeaway={takeaway} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Help Me Remember (Memory Tools) */}
      <section>
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center space-x-3 mb-5">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faBrain} className="text-primary-600 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary-900">Help Me Remember 🎵</h2>
              <p className="text-neutral-500 text-sm">Create a song to help the facts stick!</p>
            </div>
          </div>

          {!mnemonicSuitable ? (
            <MnemonicNotAvailable subjectName={overview.subject_name} />
          ) : !mnemonic || mnemonic.status === "failed" ? (
            <div className="space-y-5">
              <div className="p-5 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={faRobot} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary-900 mb-1">StudyBuddy's Music Maker 🎤</h3>
                    <p className="text-neutral-600 text-sm">
                      Pick a music style and I'll create a catchy song to help you remember the key facts!
                    </p>
                  </div>
                </div>

                <MnemonicStyleSelector selectedStyle={selectedStyle} onSelect={handleSelectStyle} disabled={isGenerating} />

                {selectedStyle && (
                  <div className="mt-5 flex justify-center">
                    <button
                      type="button"
                      onClick={handleGenerateMnemonic}
                      disabled={isGenerating || saving}
                      className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
                    >
                      <FontAwesomeIcon icon={faWandMagicSparkles} />
                      <span>Make My Song! ✨</span>
                    </button>
                  </div>
                )}
              </div>

              {mnemonic?.status === "failed" && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-amber-800 text-sm">
                    <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2" />
                    The last attempt didn't work. Try a different style or continue without a song.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <MnemonicPlayer mnemonic={mnemonic} sessionId={overview.revision_session_id} />
          )}
        </div>
      </section>

      {/* Encouragement */}
      <section>
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-card p-6 text-white">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faRobot} className="text-white text-xl" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">Amazing progress! 🌟</h3>
              <p className="text-primary-50 mb-3 text-sm">
                You've covered the key concepts for {overview.topic_name}. Take a moment to look over the points above — they'll help in your exams!
              </p>
              <p className="text-primary-100 text-xs flex items-center space-x-2">
                <FontAwesomeIcon icon={faLightbulb} />
                <span>Top tip: Try explaining what you learned to someone else — it really helps it stick!</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Continue */}
      <section>
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-primary-900 mb-1">Ready to wrap up?</h3>
              <p className="text-neutral-600 text-sm">One quick reflection and you're done!</p>
            </div>
            <button
              type="button"
              onClick={handleContinue}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
            >
              <span>Continue</span>
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}