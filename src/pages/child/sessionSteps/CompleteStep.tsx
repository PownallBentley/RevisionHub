// src/pages/child/sessionSteps/CompleteStep.tsx
// UPDATED: January 2026 - 6-Step Session Model
// Step 6: Combined Celebration + Reflection + Audio Notes
// Child-friendly language update
//
// PRESERVES: Audio recording, transcription workflow, reflection insert
// FEAT-011 Phase 2: Added studyBuddyService.updateSummary on completion

import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faFire,
  faTrophy,
  faCheckCircle,
  faClock,
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
  faPencil,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "../../../lib/supabase";
import { studyBuddyService } from "../../../services/child/studyBuddy/studyBuddyService";

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
  onUploadAudio?: (blob: Blob) => Promise<string>;
};

// =============================================================================
// Constants
// =============================================================================

const CONFIDENCE_OPTIONS: Array<{
  id: ConfidenceLevel;
  label: string;
  emoji: string;
  description: string;
  icon: IconDefinition;
  bgColor: string;
  selectedBg: string;
  selectedBorder: string;
}> = [
  {
    id: "very_confident",
    label: "Got it! 💪",
    emoji: "😊",
    description: "I could teach this to a friend",
    icon: faFaceLaughBeam,
    bgColor: "bg-white",
    selectedBg: "bg-green-50",
    selectedBorder: "border-green-500",
  },
  {
    id: "fairly_confident",
    label: "Pretty good",
    emoji: "🙂",
    description: "I understand most of it",
    icon: faFaceSmile,
    bgColor: "bg-white",
    selectedBg: "bg-blue-50",
    selectedBorder: "border-blue-500",
  },
  {
    id: "bit_unsure",
    label: "A bit wobbly",
    emoji: "🤔",
    description: "Some parts are still unclear",
    icon: faFaceMeh,
    bgColor: "bg-white",
    selectedBg: "bg-amber-50",
    selectedBorder: "border-amber-500",
  },
  {
    id: "need_help",
    label: "Need more practice",
    emoji: "😅",
    description: "I'd like to go over this again",
    icon: faFaceFrown,
    bgColor: "bg-white",
    selectedBg: "bg-red-50",
    selectedBorder: "border-red-400",
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
  gamification,
}: {
  childName: string;
  gamification: GamificationResult;
}) {
  return (
    <div className="bg-gradient-to-br from-purple-50 via-primary-50 to-indigo-50 rounded-2xl shadow-card p-8 text-center border border-primary-200">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-3xl font-bold text-neutral-900 mb-2">
        You did it, {childName}!
      </h2>
      <p className="text-neutral-600 text-lg mb-6">
        Another session complete - you're on fire!
      </p>

      {/* Stats Row */}
      <div className="flex items-center justify-center gap-4">
        {/* XP Earned */}
        <div className="bg-white rounded-xl p-4 shadow-sm min-w-[100px]">
          <div className="text-2xl font-bold text-primary-600">+{gamification.xpEarned}</div>
          <div className="text-xs text-neutral-500 mt-1">XP earned</div>
        </div>

        {/* Streak */}
        <div className="bg-white rounded-xl p-4 shadow-sm min-w-[100px]">
          <div className="flex items-center justify-center gap-1">
            <FontAwesomeIcon icon={faFire} className="text-orange-500 text-xl" />
            <span className="text-2xl font-bold text-neutral-900">{gamification.currentStreak}</span>
          </div>
          <div className="text-xs text-neutral-500 mt-1">day streak</div>
        </div>

        {/* Badge (if earned) */}
        {gamification.newBadge && (
          <div className="bg-white rounded-xl p-4 shadow-sm min-w-[100px]">
            <FontAwesomeIcon icon={faTrophy} className="text-amber-500 text-2xl" />
            <div className="text-xs text-neutral-500 mt-1">New badge!</div>
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
    <div className="grid grid-cols-2 gap-3">
      {CONFIDENCE_OPTIONS.map((option) => {
        const isSelected = selected === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            disabled={disabled}
            className={`p-4 rounded-xl border-2 transition text-left ${
              isSelected
                ? `${option.selectedBg} ${option.selectedBorder}`
                : `${option.bgColor} border-neutral-200 hover:border-neutral-300`
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{option.emoji}</span>
              <span className="font-semibold text-neutral-900">{option.label}</span>
              {isSelected && (
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 ml-auto" />
              )}
            </div>
            <p className="text-neutral-500 text-sm">{option.description}</p>
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
  const recordingTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioData.url && !existingUrl) URL.revokeObjectURL(audioData.url);
    };
  }, []);

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
        const finalDuration = recordingTimeRef.current;
        const newAudioData = { blob, url, durationSeconds: finalDuration };
        setAudioData(newAudioData);
        onRecordingComplete(newAudioData);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime((prev) => {
          const newTime = prev + 1;
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

  const hasRecording = audioData.url !== null;
  const progressPercentage = audioData.durationSeconds > 0
    ? (currentPlaybackTime / audioData.durationSeconds) * 100
    : 0;

  return (
    <div className="p-5 bg-neutral-50 rounded-xl">
      {audioData.url && <audio ref={audioRef} src={audioData.url} />}

      {!hasRecording ? (
        <div className="text-center">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 transition ${
              isRecording
                ? "bg-red-500 animate-pulse"
                : "bg-primary-600 hover:bg-primary-700"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <FontAwesomeIcon
              icon={isRecording ? faStop : faMicrophone}
              className="text-white text-xl"
            />
          </button>

          {isRecording ? (
            <>
              <p className="font-semibold text-neutral-900 mb-1">
                Recording... {formatTime(recordingTime)}
              </p>
              <p className="text-neutral-500 text-sm">Tap to stop (max 60s)</p>
              <div className="mt-3 w-full max-w-[200px] mx-auto">
                <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${(recordingTime / 60) * 100}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="font-medium text-neutral-700 mb-1">Record a voice note</p>
              <p className="text-neutral-500 text-sm">Say what you learned in your own words</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePreview}
              className="w-12 h-12 rounded-full bg-primary-600 hover:bg-primary-700 flex items-center justify-center transition flex-shrink-0"
            >
              <FontAwesomeIcon
                icon={isPreviewing ? faPause : faPlay}
                className="text-white text-lg"
              />
            </button>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-neutral-700">Voice note recorded ✓</p>
              <p className="text-sm text-neutral-500">
                {formatTime(currentPlaybackTime)} / {formatTime(audioData.durationSeconds)}
              </p>
            </div>

            <button
              type="button"
              onClick={handleDelete}
              disabled={disabled}
              className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition flex-shrink-0"
            >
              <FontAwesomeIcon icon={faTrash} className="text-neutral-500" />
            </button>
          </div>

          <div
            className="h-1.5 bg-neutral-200 rounded-full overflow-hidden cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-primary-600 transition-all duration-100"
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
  const complete = payload?.complete ?? {};
  const initialGamification: GamificationResult = complete.gamification ?? {
    xpEarned: 45,
    currentStreak: 5,
    newBadge: { id: "focus_master", name: "Focus Master", icon: "trophy" },
  };

  const [postConfidence, setPostConfidence] = useState<ConfidenceLevel | null>(
    complete.postConfidence ?? null
  );
  const [journalNote, setJournalNote] = useState(complete.journalNote ?? "");
  const [audioData, setAudioData] = useState<AudioNoteData>({
    blob: null,
    url: complete.audioNoteUrl ?? null,
    durationSeconds: complete.audioDurationSeconds ?? 0,
  });

  const subjectIcon = getIconFromName(overview.subject_icon);
  const subjectColor = overview.subject_color || "#5B2CFF";
  const childName = overview.child_name || "there";
  const sessionMinutes = overview.session_duration_minutes ?? 20;
  const canFinish = postConfidence !== null;

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
      } catch (error) {
        console.error("[CompleteStep] Audio upload failed:", error);
      }
    }

    // Insert reflection record for transcription workflow
    const hasAudio = !!audioUrl;
    const hasTextNote = journalNote.trim().length > 0;

    if (hasAudio || hasTextNote) {
      const { error: reflectionError } = await supabase
        .from("child_session_reflections")
        .insert({
          child_id: overview.child_id,
          revision_session_id: overview.revision_session_id,
          audio_url: audioUrl || null,
          audio_duration_seconds: hasAudio ? audioData.durationSeconds : null,
          text_note: hasTextNote ? journalNote.trim() : null,
          context_type: "session_reflection",
          transcription_status: hasAudio ? "pending" : null,
        });

      if (reflectionError) {
        console.error("[CompleteStep] Failed to create reflection record:", reflectionError);
      } else {
        console.log("[CompleteStep] Session reflection record created", { hasAudio, hasTextNote });
      }
    }

    // Save to step payload
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

    // FEAT-011 Phase 2: Update Study Buddy summary on session completion
    // This generates thread summaries and learning notes from any Study Buddy
    // conversations that occurred during this session. Fire-and-forget pattern
    // to avoid blocking the completion flow.
    try {
      await studyBuddyService.updateSummary(overview.revision_session_id, true);
      console.log("[CompleteStep] Study Buddy summary update triggered");
    } catch (error) {
      // Non-blocking: log error but don't prevent session completion
      console.error("[CompleteStep] Study Buddy summary update failed:", error);
    }

    await onFinish();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <div className="flex items-center space-x-3 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: subjectColor }}
          >
            <FontAwesomeIcon icon={subjectIcon} className="text-white text-xl" />
          </div>
          <div>
            <p className="text-neutral-500 text-sm">
              {overview.subject_name} • Step {overview.step_index} of {overview.total_steps}
            </p>
            <h1 className="text-2xl font-bold text-primary-900">{overview.topic_name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-full">
            <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
            <span className="text-green-700 font-medium text-sm">Complete!</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-500 text-sm">
            <FontAwesomeIcon icon={faClock} />
            <span>{sessionMinutes} mins</span>
          </div>
        </div>
      </section>

      {/* Celebration */}
      <section>
        <CelebrationBanner childName={childName} gamification={initialGamification} />
      </section>

      {/* Confidence Check */}
      <section>
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center space-x-3 mb-5">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🤔</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary-900">How do you feel about this topic?</h2>
              <p className="text-neutral-500 text-sm">Be honest - it helps us help you!</p>
            </div>
          </div>

          <ConfidenceSelector
            selected={postConfidence}
            onSelect={handleConfidenceSelect}
            disabled={saving}
          />
        </div>
      </section>

      {/* Notes Section */}
      <section>
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center space-x-3 mb-5">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faPencil} className="text-primary-600 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary-900">Any notes for next time?</h2>
              <p className="text-neutral-500 text-sm">Questions, thoughts, things to remember</p>
            </div>
          </div>

          <textarea
            value={journalNote}
            onChange={(e) => handleJournalChange(e.target.value)}
            disabled={saving}
            placeholder="What stood out? Any questions? Write anything you want to remember..."
            rows={3}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 transition resize-none disabled:opacity-50 text-neutral-700"
          />

          <div className="mt-4">
            <p className="text-sm text-neutral-600 mb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faMicrophone} className="text-primary-600" />
              <span className="font-medium">Or say it instead:</span>
            </p>
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

      {/* Encouragement */}
      <section>
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-card p-6 text-white">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faStar} className="text-white text-xl" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">Amazing work, {childName}! 🌟</h3>
              <p className="text-primary-100 text-sm mb-3">
                Every session makes you stronger. Take a break, have a snack, and feel proud of what you've done today!
              </p>
              <p className="text-primary-200 text-xs flex items-center gap-2">
                <span>💡</span>
                <span>Top tip: Tell someone what you learned - it helps it stick!</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section>
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleFinish}
              disabled={!canFinish || saving}
              className="flex items-center gap-2 px-5 py-3 bg-neutral-100 text-neutral-700 font-medium rounded-xl hover:bg-neutral-200 transition disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faHome} />
              <span>Home</span>
            </button>

            {onStartNextSession ? (
              <button
                type="button"
                onClick={async () => {
                  await handleFinish();
                  onStartNextSession();
                }}
                disabled={!canFinish || saving}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
              >
                <span>{saving ? "Saving..." : "Next Session"}</span>
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={!canFinish || saving}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
              >
                <span>{saving ? "Saving..." : "Finish"}</span>
                <FontAwesomeIcon icon={faCheckCircle} />
              </button>
            )}
          </div>

          {!canFinish && (
            <p className="mt-4 text-center text-neutral-500 text-sm">
              Please tell us how you're feeling about this topic to continue
            </p>
          )}
        </div>
      </section>
    </div>
  );
}