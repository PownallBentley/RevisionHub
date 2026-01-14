// src/pages/child/sessionSteps/CompleteStep.tsx
// UPDATED: 6-Step Session Model - January 2026
// Step 6: Combined Celebration + Reflection + Audio Notes
// Merges previous Steps 6 (Reflection) and 7 (Complete)
// NOW INCLUDES: Insert into child_voice_notes for transcription workflow

import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faFire,
  faTrophy,
  faCheckCircle,
  faClock,
  faGaugeHigh,
  faFaceLaughBeam,
  faFaceSmile,
  faFaceMeh,
  faFaceFrown,
  faMicrophone,
  faStop,
  faPlay,
  faPause,
  faTrash,
  faHome,
  faArrowRight,
  faFlask,
  faCalculator,
  faAtom,
  faGlobe,
  faLandmark,
  faDna,
  faBook,
  faNoteSticky,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "../../../lib/supabase";

// =============================================================================
// Types
// =============================================================================

type ConfidenceLevel = "very_confident" | "fairly_confident" | "bit_unsure" | "need_help";

type GamificationResult = {
  xpEarned: number;
  currentStreak: number;
  newBadge?: {
    id: string;
    name: string;
    icon: string;
  };
};

type AudioNoteData = {
  blob: Blob | null;
  url: string | null;
  durationSeconds: number;
};

type CompleteStepProps = {
  overview: {
    subject_name: string;
    subject_icon?: string;
    subject_color?: string;
    topic_name: string;
    session_duration_minutes: number | null;
    step_key: string;
    step_index: number;
    total_steps: number;
    child_name?: string;
    // Required for voice note tracking
    child_id: string;
    revision_session_id: string;
  };
  payload: {
    complete?: {
      gamification?: GamificationResult;
      postConfidence?: ConfidenceLevel;
      journalNote?: string;
      audioNoteUrl?: string;
      audioDurationSeconds?: number;
    };
  };
  saving: boolean;
  onPatch: (patch: Record<string, any>) => Promise<void>;
  onFinish: () => Promise<void>;
  onStartNextSession?: () => void;
  onUploadAudio?: (blob: Blob) => Promise<string>; // Returns URL after upload
};

// =============================================================================
// Constants
// =============================================================================

const CONFIDENCE_OPTIONS: Array<{
  id: ConfidenceLevel;
  label: string;
  description: string;
  icon: IconDefinition;
  bgColor: string;
  iconBgColor: string;
  iconColor: string;
  selectedBorder: string;
}> = [
  {
    id: "very_confident",
    label: "Very confident",
    description: "I understand this really well and could explain it to someone else",
    icon: faFaceLaughBeam,
    bgColor: "bg-accent-green/10",
    iconBgColor: "bg-accent-green",
    iconColor: "text-white",
    selectedBorder: "border-accent-green",
  },
  {
    id: "fairly_confident",
    label: "Fairly confident",
    description: "I get the main ideas but might need to review some parts",
    icon: faFaceSmile,
    bgColor: "bg-neutral-50",
    iconBgColor: "bg-primary-200",
    iconColor: "text-primary-600",
    selectedBorder: "border-primary-600",
  },
  {
    id: "bit_unsure",
    label: "A bit unsure",
    description: "I understand some parts but others are still unclear",
    icon: faFaceMeh,
    bgColor: "bg-neutral-50",
    iconBgColor: "bg-accent-amber/20",
    iconColor: "text-accent-amber",
    selectedBorder: "border-accent-amber",
  },
  {
    id: "need_help",
    label: "Need more help",
    description: "This topic is still confusing and I'd like to go over it again",
    icon: faFaceFrown,
    bgColor: "bg-neutral-50",
    iconBgColor: "bg-accent-red/20",
    iconColor: "text-accent-red",
    selectedBorder: "border-accent-red",
  },
];

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
// Sub-components
// =============================================================================

function CelebrationBanner({
  childName,
  subjectName,
  gamification,
}: {
  childName: string;
  subjectName: string;
  gamification: GamificationResult;
}) {
  return (
    <div className="bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200 rounded-2xl shadow-soft p-8 text-center border border-primary-300">
      <div className="w-20 h-20 bg-accent-green rounded-full flex items-center justify-center mx-auto mb-4">
        <FontAwesomeIcon icon={faStar} className="text-white text-3xl" />
      </div>
      <h2 className="text-3xl font-bold text-primary-900 mb-3">
        Great work, {childName}! 🎉
      </h2>
      <p className="text-neutral-600 text-lg mb-4">
        You've completed today's {subjectName} session with excellent focus.
      </p>

      {/* Gamification Results */}
      <div className="flex items-center justify-center space-x-6 mt-6">
        {/* XP Earned */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-2 shadow-soft">
            <span className="text-2xl font-bold text-primary-900">
              +{gamification.xpEarned}
            </span>
          </div>
          <span className="text-neutral-600 text-sm font-medium">XP Earned</span>
        </div>

        {/* Streak */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-2 shadow-soft">
            <FontAwesomeIcon icon={faFire} className="text-accent-green text-2xl" />
          </div>
          <span className="text-neutral-600 text-sm font-medium">
            {gamification.currentStreak}-Day Streak!
          </span>
        </div>

        {/* Badge (if earned) */}
        {gamification.newBadge && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-2 shadow-soft">
              <FontAwesomeIcon icon={faTrophy} className="text-accent-amber text-2xl" />
            </div>
            <span className="text-neutral-600 text-sm font-medium">New Badge</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfidenceSelector({
  selected,
  onSelect,
  disabled,
}: {
  selected: ConfidenceLevel | null;
  onSelect: (level: ConfidenceLevel) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      {CONFIDENCE_OPTIONS.map((option) => {
        const isSelected = selected === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            disabled={disabled}
            className={`w-full p-5 rounded-xl border-2 transition flex items-center space-x-4 ${
              isSelected
                ? `${option.bgColor} ${option.selectedBorder}`
                : "bg-neutral-50 border-neutral-200 hover:border-primary-300"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                isSelected ? option.iconBgColor : "bg-neutral-200"
              }`}
            >
              <FontAwesomeIcon
                icon={option.icon}
                className={`text-xl ${isSelected ? option.iconColor : "text-neutral-500"}`}
              />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-neutral-900 mb-1">{option.label}</p>
              <p className="text-neutral-600 text-sm">{option.description}</p>
            </div>
            {isSelected && (
              <FontAwesomeIcon
                icon={faCheckCircle}
                className={`text-2xl ${
                  option.id === "very_confident"
                    ? "text-accent-green"
                    : option.id === "fairly_confident"
                    ? "text-primary-600"
                    : option.id === "bit_unsure"
                    ? "text-accent-amber"
                    : "text-accent-red"
                }`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function AudioRecorder({
  existingUrl,
  existingDuration,
  onRecordingComplete,
  onDelete,
  disabled,
}: {
  existingUrl: string | null;
  existingDuration: number;
  onRecordingComplete: (data: AudioNoteData) => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [audioData, setAudioData] = useState<AudioNoteData>({
    blob: null,
    url: existingUrl,
    durationSeconds: existingDuration,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimeRef = useRef<number>(0); // Track duration in ref for accurate capture

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioData.url && !existingUrl) URL.revokeObjectURL(audioData.url);
    };
  }, []);

  // Track playback progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentPlaybackTime(Math.floor(audio.currentTime));
    };

    const handleEnded = () => {
      setIsPreviewing(false);
      setCurrentPlaybackTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioData.url]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingTimeRef.current = 0;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const finalDuration = recordingTimeRef.current; // Use ref value, not state
        const newAudioData = {
          blob,
          url,
          durationSeconds: finalDuration,
        };
        setAudioData(newAudioData);
        onRecordingComplete(newAudioData);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer - update both state (for UI) and ref (for capture)
      timerRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          // Max 60 seconds
          if (newTime >= 60) {
            stopRecording();
            return prev;
          }
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error("[AudioRecorder] Failed to start recording:", error);
      alert("Could not access microphone. Please check your permissions.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }

  function togglePreview() {
    if (!audioRef.current || !audioData.url) return;

    if (isPreviewing) {
      audioRef.current.pause();
      setIsPreviewing(false);
    } else {
      audioRef.current.currentTime = 0;
      setCurrentPlaybackTime(0);
      audioRef.current.play();
      setIsPreviewing(true);
    }
  }

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!audioRef.current || !audioData.durationSeconds) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * audioData.durationSeconds;
    
    audioRef.current.currentTime = newTime;
    setCurrentPlaybackTime(Math.floor(newTime));
  }

  function handleDelete() {
    if (audioData.url && !existingUrl) {
      URL.revokeObjectURL(audioData.url);
    }
    setAudioData({ blob: null, url: null, durationSeconds: 0 });
    setRecordingTime(0);
    setCurrentPlaybackTime(0);
    onDelete();
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }

  function formatFileSize(bytes: number | undefined): string {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const hasRecording = audioData.url !== null;
  const progressPercentage = audioData.durationSeconds > 0 
    ? (currentPlaybackTime / audioData.durationSeconds) * 100 
    : 0;

  return (
    <div className="p-6 bg-neutral-50 rounded-xl">
      {/* Hidden audio element for playback */}
      {audioData.url && (
        <audio
          ref={audioRef}
          src={audioData.url}
        />
      )}

      {!hasRecording ? (
        // Recording UI
        <div className="text-center">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition ${
              isRecording
                ? "bg-accent-red animate-pulse"
                : "bg-primary-600 hover:bg-primary-700"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <FontAwesomeIcon
              icon={isRecording ? faStop : faMicrophone}
              className="text-white text-2xl"
            />
          </button>

          {isRecording ? (
            <>
              <p className="text-lg font-semibold text-neutral-900 mb-1">
                Recording... {formatTime(recordingTime)}
              </p>
              <p className="text-neutral-500 text-sm">Tap to stop (max 60s)</p>
              {/* Recording progress bar */}
              <div className="mt-4 w-full max-w-xs mx-auto">
                <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent-red transition-all duration-1000 ease-linear"
                    style={{ width: `${(recordingTime / 60) * 100}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="font-semibold text-neutral-700 mb-1">
                Record a voice note
              </p>
              <p className="text-neutral-500 text-sm">
                Capture your thoughts in your own words
              </p>
            </>
          )}
        </div>
      ) : (
        // Playback UI with progress bar
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={togglePreview}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition flex-shrink-0 ${
                isPreviewing 
                  ? "bg-primary-700" 
                  : "bg-primary-600 hover:bg-primary-700"
              }`}
            >
              <FontAwesomeIcon
                icon={isPreviewing ? faPause : faPlay}
                className="text-white text-xl"
              />
            </button>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-neutral-700 mb-1">Voice note recorded</p>
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <span>{formatTime(currentPlaybackTime)} / {formatTime(audioData.durationSeconds)}</span>
                {audioData.blob && (
                  <>
                    <span className="text-neutral-300">•</span>
                    <span>{formatFileSize(audioData.blob.size)}</span>
                  </>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleDelete}
              disabled={disabled}
              className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center hover:bg-accent-red/10 hover:text-accent-red transition flex-shrink-0"
            >
              <FontAwesomeIcon icon={faTrash} className="text-neutral-600" />
            </button>
          </div>

          {/* Progress bar */}
          <div 
            className="h-2 bg-neutral-200 rounded-full overflow-hidden cursor-pointer"
            onClick={handleProgressClick}
          >
            <div 
              className={`h-full bg-primary-600 transition-all ${
                isPreviewing ? "duration-100" : "duration-0"
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function CompleteStep({
  overview,
  payload,
  saving,
  onPatch,
  onFinish,
  onStartNextSession,
  onUploadAudio,
}: CompleteStepProps) {
  // Extract from payload
  const complete = payload?.complete ?? {};
  const initialGamification: GamificationResult = complete.gamification ?? {
    xpEarned: 45,
    currentStreak: 5,
    newBadge: { id: "focus_master", name: "Focus Master", icon: "trophy" },
  };

  // State
  const [postConfidence, setPostConfidence] = useState<ConfidenceLevel | null>(
    complete.postConfidence ?? null
  );
  const [journalNote, setJournalNote] = useState(complete.journalNote ?? "");
  const [audioData, setAudioData] = useState<AudioNoteData>({
    blob: null,
    url: complete.audioNoteUrl ?? null,
    durationSeconds: complete.audioDurationSeconds ?? 0,
  });

  // Derived
  const subjectIcon = getIconFromName(overview.subject_icon);
  const subjectColor = overview.subject_color || "#5B2CFF";
  const childName = overview.child_name || "there";
  const sessionMinutes = overview.session_duration_minutes ?? 20;

  // Can finish if confidence is selected
  const canFinish = postConfidence !== null;

  // Handlers
  function handleConfidenceSelect(level: ConfidenceLevel) {
    setPostConfidence(level);
  }

  function handleJournalChange(value: string) {
    setJournalNote(value);
  }

  function handleAudioRecorded(data: AudioNoteData) {
    setAudioData(data);
  }

  function handleAudioDelete() {
    setAudioData({ blob: null, url: null, durationSeconds: 0 });
  }

  async function handleFinish() {
    // Upload audio if we have a new recording
    let audioUrl = complete.audioNoteUrl ?? null;
    if (audioData.blob && onUploadAudio) {
      try {
        audioUrl = await onUploadAudio(audioData.blob);
        
        // =====================================================================
        // INSERT INTO child_voice_notes FOR TRANSCRIPTION WORKFLOW
        // This triggers the N8n webhook via Supabase database webhook
        // =====================================================================
        if (audioUrl) {
          const { error: voiceNoteError } = await supabase
            .from("child_voice_notes")
            .insert({
              child_id: overview.child_id,
              revision_session_id: overview.revision_session_id,
              audio_url: audioUrl,
              audio_duration_seconds: audioData.durationSeconds,
              context_type: "session_reflection",
              transcription_status: "pending",
            });

          if (voiceNoteError) {
            // Log but don't block session completion
            console.error("[CompleteStep] Failed to create voice note record:", voiceNoteError);
          } else {
            console.log("[CompleteStep] Voice note record created for transcription");
          }
        }
      } catch (error) {
        console.error("[CompleteStep] Audio upload failed:", error);
      }
    }

    // Save all data to step payload
    await onPatch({
      complete: {
        gamification: initialGamification,
        postConfidence,
        journalNote: journalNote.trim() || null,
        audioNoteUrl: audioUrl,
        audioDurationSeconds: audioData.durationSeconds,
        completed_at: new Date().toISOString(),
      },
    });

    await onFinish();
  }

  return (
    <div className="space-y-8">
      {/* ================================================================== */}
      {/* Session Header */}
      {/* ================================================================== */}
      <section className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: subjectColor }}
          >
            <FontAwesomeIcon icon={subjectIcon} className="text-white text-xl" />
          </div>
          <div>
            <p className="text-neutral-500 text-sm">
              {overview.subject_name} • Step {overview.step_index} of{" "}
              {overview.total_steps}
            </p>
            <h1 className="text-2xl font-bold text-primary-900">
              {overview.topic_name}
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-accent-green/10 px-4 py-2 rounded-full">
            <FontAwesomeIcon icon={faCheckCircle} className="text-accent-green" />
            <span className="text-accent-green font-semibold text-sm">
              Session Complete
            </span>
          </div>
          <div className="flex items-center space-x-2 text-neutral-500 text-sm">
            <FontAwesomeIcon icon={faClock} />
            <span>{sessionMinutes} minutes</span>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Celebration Section */}
      {/* ================================================================== */}
      <section className="mb-8">
        <CelebrationBanner
          childName={childName}
          subjectName={overview.subject_name}
          gamification={initialGamification}
        />
      </section>

      {/* ================================================================== */}
      {/* Confidence Check Section */}
      {/* ================================================================== */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faGaugeHigh} className="text-primary-600 text-xl" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-primary-900">
                How confident do you feel?
              </h2>
              <p className="text-neutral-500 text-sm">
                Your honest answer helps us support you better
              </p>
            </div>
          </div>

          <ConfidenceSelector
            selected={postConfidence}
            onSelect={handleConfidenceSelect}
            disabled={saving}
          />

          <div className="mt-6 p-4 bg-primary-50 rounded-xl border border-primary-200">
            <p className="text-neutral-600 text-sm">
              <strong className="text-primary-900">Remember:</strong> It's completely
              normal to need more time with some topics. Being honest about how you
              feel helps us give you the right support.
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Journal Note Section */}
      {/* ================================================================== */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faNoteSticky} className="text-primary-600 text-xl" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-primary-900">
                Anything you want to remember?
              </h2>
              <p className="text-neutral-500 text-sm">
                Jot down notes, questions, or thoughts from this session
              </p>
            </div>
          </div>

          <textarea
            value={journalNote}
            onChange={(e) => handleJournalChange(e.target.value)}
            disabled={saving}
            placeholder="Write your thoughts here... What stood out? Any questions for next time?"
            rows={4}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:border-primary-600 transition resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Audio Recording */}
          <div className="mt-6">
            <div className="flex items-center space-x-2 mb-4">
              <FontAwesomeIcon icon={faMicrophone} className="text-primary-600" />
              <span className="font-semibold text-neutral-700">
                Or record a voice note
              </span>
              <span className="text-neutral-400 text-sm">(optional)</span>
            </div>

            <AudioRecorder
              existingUrl={complete.audioNoteUrl ?? null}
              existingDuration={complete.audioDurationSeconds ?? 0}
              onRecordingComplete={handleAudioRecorded}
              onDelete={handleAudioDelete}
              disabled={saving}
            />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* StudyBuddy Encouragement */}
      {/* ================================================================== */}
      <section className="mb-8">
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-card p-6 text-white">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faStar} className="text-white text-2xl" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-3">Well done, {childName}!</h3>
              <p className="text-primary-50 mb-4">
                You've shown great focus today. Every session builds your knowledge
                and gets you closer to exam success. Take a well-deserved break!
              </p>
              <div className="flex items-center space-x-2 text-primary-100 text-sm">
                <FontAwesomeIcon icon={faStar} />
                <span>
                  Tip: Try explaining what you learned to someone — it's one of the
                  best ways to remember!
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Action Buttons */}
      {/* ================================================================== */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onFinish}
              disabled={!canFinish || saving}
              className="flex items-center space-x-2 px-6 py-3 bg-neutral-100 text-neutral-700 font-semibold rounded-xl hover:bg-neutral-200 transition disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faHome} />
              <span>Return Home</span>
            </button>

            {onStartNextSession && (
              <button
                type="button"
                onClick={async () => {
                  await handleFinish();
                  onStartNextSession();
                }}
                disabled={!canFinish || saving}
                className="flex items-center space-x-2 px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
              >
                <span>{saving ? "Saving..." : "Start Next Session"}</span>
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            )}

            {!onStartNextSession && (
              <button
                type="button"
                onClick={handleFinish}
                disabled={!canFinish || saving}
                className="flex items-center space-x-2 px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
              >
                <span>{saving ? "Saving..." : "Finish Session"}</span>
                <FontAwesomeIcon icon={faCheckCircle} />
              </button>
            )}
          </div>

          {!canFinish && (
            <p className="mt-4 text-center text-neutral-500 text-sm">
              Please select how confident you feel to continue
            </p>
          )}
        </div>
      </section>
    </div>
  );
}