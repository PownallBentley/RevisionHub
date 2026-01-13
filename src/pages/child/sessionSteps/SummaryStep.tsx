// src/pages/child/sessionSteps/SummaryStep.tsx
// NEW: 7-Step Session Model - January 2026
// Step 5: Key takeaways consolidation + mnemonic generation

import { useState } from "react";
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
  faLayerGroup,
  faPenFancy,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

// =============================================================================
// Types
// =============================================================================

type KeyTakeaway = {
  id: string;
  title: string;
  description: string;
};

type MnemonicStyle = "hip-hop" | "pop" | "rock";

type MnemonicData = {
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
  };
  payload: {
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
    name: "Hip-Hop Rap",
    description: "Street anthem style beats",
    icon: faMicrophone,
    gradient: "from-purple-500 to-pink-500",
    styleReference: "street-Anthem",
  },
  {
    id: "pop",
    name: "Pop Song",
    description: "Catchy pop melody",
    icon: faMusic,
    gradient: "from-blue-500 to-cyan-500",
    styleReference: "opoline",
  },
  {
    id: "rock",
    name: "Rock Track",
    description: "Energetic rock vibes",
    icon: faGuitar,
    gradient: "from-orange-500 to-red-500",
    styleReference: "youth",
  },
];

// =============================================================================
// Sub-components
// =============================================================================

function KeyTakeawayCard({
  takeaway,
  index,
}: {
  takeaway: KeyTakeaway;
  index: number;
}) {
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
    <div className="grid grid-cols-3 gap-4">
      {MNEMONIC_STYLES.map((style) => {
        const isSelected = selectedStyle === style.id;
        return (
          <button
            key={style.id}
            type="button"
            onClick={() => onSelect(style.id)}
            disabled={disabled}
            className={`flex flex-col items-center p-5 rounded-xl transition border-2 ${
              isSelected
                ? "bg-primary-50 border-primary-600"
                : "bg-neutral-50 border-transparent hover:border-primary-300"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 bg-gradient-to-br ${style.gradient}`}
            >
              <FontAwesomeIcon icon={style.icon} className="text-white text-xl" />
            </div>
            <span className="font-semibold text-neutral-700 mb-1">{style.name}</span>
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
  onFavourite,
  onDownload,
}: {
  mnemonic: MnemonicData;
  onFavourite?: () => void;
  onDownload?: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const styleConfig = MNEMONIC_STYLES.find((s) => s.id === mnemonic.style);

  function togglePlay() {
    setIsPlaying(!isPlaying);
    // In production, this would control an actual audio element
  }

  if (mnemonic.status === "generating") {
    return (
      <div className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200">
        <div className="flex items-center justify-center space-x-4 py-8">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-primary-600 text-3xl animate-spin"
          />
          <div>
            <p className="font-semibold text-primary-900">Creating your mnemonic...</p>
            <p className="text-neutral-600 text-sm">
              StudyBuddy is writing lyrics and generating audio
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (mnemonic.status === "failed") {
    return (
      <div className="p-6 bg-accent-red/5 rounded-xl border border-accent-red/20">
        <p className="text-accent-red font-semibold mb-2">
          Couldn't generate mnemonic
        </p>
        <p className="text-neutral-600 text-sm">
          Something went wrong. Try selecting a different style or continue without.
        </p>
      </div>
    );
  }

  if (mnemonic.status !== "ready") {
    return null;
  }

  return (
    <div className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${
              styleConfig?.gradient || "from-primary-500 to-primary-600"
            }`}
          >
            <FontAwesomeIcon
              icon={styleConfig?.icon || faMusic}
              className="text-white text-lg"
            />
          </div>
          <div>
            <h3 className="font-bold text-primary-900">
              Your {styleConfig?.name || "Mnemonic"}
            </h3>
            <p className="text-neutral-600 text-sm">
              {mnemonic.durationSeconds
                ? `${Math.floor(mnemonic.durationSeconds / 60)}:${String(
                    mnemonic.durationSeconds % 60
                  ).padStart(2, "0")}`
                : "Audio ready"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {onFavourite && (
            <button
              type="button"
              onClick={onFavourite}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-primary-50 transition"
            >
              <FontAwesomeIcon icon={faHeart} className="text-primary-600" />
            </button>
          )}
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-primary-50 transition"
            >
              <FontAwesomeIcon icon={faDownload} className="text-primary-600" />
            </button>
          )}
        </div>
      </div>

      {/* Audio Player */}
      <div className="bg-white rounded-xl p-4 mb-4">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-primary-600 flex items-center justify-center hover:bg-primary-700 transition flex-shrink-0"
          >
            <FontAwesomeIcon
              icon={isPlaying ? faPause : faPlay}
              className="text-white text-xl"
            />
          </button>
          <div className="flex-1">
            <div className="w-full bg-neutral-200 rounded-full h-2 mb-2">
              <div
                className="bg-primary-600 h-full rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-neutral-500">
              <span>0:00</span>
              <span>
                {mnemonic.durationSeconds
                  ? `${Math.floor(mnemonic.durationSeconds / 60)}:${String(
                      mnemonic.durationSeconds % 60
                    ).padStart(2, "0")}`
                  : "--:--"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lyrics */}
      <div className="bg-white rounded-xl p-5">
        <h4 className="font-semibold text-neutral-700 mb-3 flex items-center space-x-2">
          <FontAwesomeIcon icon={faCompactDisc} className="text-primary-600" />
          <span>Lyrics</span>
        </h4>
        <p className="text-neutral-700 whitespace-pre-line text-sm leading-relaxed">
          {mnemonic.lyrics}
        </p>
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
  onBack,
  onExit,
  onRequestMnemonic,
}: SummaryStepProps) {
  // Extract from payload
  const summary = payload?.summary ?? {};
  const keyTakeaways: KeyTakeaway[] = summary.keyTakeaways ?? [];
  const existingMnemonic = summary.mnemonic ?? null;

  // State
  const [selectedStyle, setSelectedStyle] = useState<MnemonicStyle | null>(
    summary.selectedStyle ?? null
  );
  const [mnemonic, setMnemonic] = useState<MnemonicData | null>(existingMnemonic);
  const [isGenerating, setIsGenerating] = useState(false);

  // Derived
  const progressPercent = (overview.step_index / overview.total_steps) * 100;
  const subjectIcon = getIconFromName(overview.subject_icon);
  const subjectColor = overview.subject_color || "#5B2CFF";

  // Handlers
  function handleSelectStyle(style: MnemonicStyle) {
    setSelectedStyle(style);
  }

  async function handleGenerateMnemonic() {
    if (!selectedStyle) return;

    setIsGenerating(true);
    setMnemonic({
      style: selectedStyle,
      styleReference: MNEMONIC_STYLES.find((s) => s.id === selectedStyle)?.styleReference || "",
      lyrics: "",
      audioUrl: null,
      durationSeconds: null,
      status: "generating",
    });

    try {
      if (onRequestMnemonic) {
        const result = await onRequestMnemonic(selectedStyle);
        setMnemonic(result);
        await onPatch({
          summary: {
            ...summary,
            selectedStyle,
            mnemonic: result,
          },
        });
      } else {
        // Mock for development
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const mockMnemonic: MnemonicData = {
          style: selectedStyle,
          styleReference: MNEMONIC_STYLES.find((s) => s.id === selectedStyle)?.styleReference || "",
          lyrics: generateMockLyrics(overview.topic_name, selectedStyle),
          audioUrl: null,
          durationSeconds: 45,
          status: "ready",
        };
        setMnemonic(mockMnemonic);
        await onPatch({
          summary: {
            ...summary,
            selectedStyle,
            mnemonic: mockMnemonic,
          },
        });
      }
    } catch (error) {
      console.error("[SummaryStep] Mnemonic generation failed:", error);
      setMnemonic({
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
    // Save current state
    await onPatch({
      summary: {
        ...summary,
        selectedStyle,
        mnemonic,
        completed_at: new Date().toISOString(),
      },
    });
    await onNext();
  }

  // Default takeaways if none provided
  const displayTakeaways =
    keyTakeaways.length > 0
      ? keyTakeaways
      : [
          {
            id: "1",
            title: "Key concept from this topic",
            description:
              "The main ideas you've learned will appear here after completing the session.",
          },
        ];

  return (
    <div className="space-y-8">
      {/* ================================================================== */}
      {/* Session Header Section */}
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
              {overview.subject_name} • Step {overview.step_index} of {overview.total_steps}
            </p>
            <h1 className="text-2xl font-bold text-primary-900">{overview.topic_name}</h1>
          </div>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      {/* ================================================================== */}
      {/* Key Takeaways Section */}
      {/* ================================================================== */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faLightbulb} className="text-primary-600 text-xl" />
            </div>
            <h2 className="text-2xl font-bold text-primary-900">Key Takeaways</h2>
          </div>

          <div className="space-y-4">
            {displayTakeaways.map((takeaway, index) => (
              <KeyTakeawayCard key={takeaway.id} takeaway={takeaway} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Memory Tools / Mnemonic Section */}
      {/* ================================================================== */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faBrain} className="text-primary-600 text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary-900">Memory Tools</h2>
              <p className="text-neutral-500 text-sm">
                Create a musical mnemonic to help remember key concepts
              </p>
            </div>
          </div>

          {/* Style Selector or Generated Mnemonic */}
          {!mnemonic || mnemonic.status === "failed" ? (
            <div className="space-y-6">
              <div className="p-5 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={faRobot} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary-900 mb-1">
                      StudyBuddy's Musical Mnemonics
                    </h3>
                    <p className="text-neutral-600 text-sm">
                      Choose a music style and I'll create a catchy song to help you remember
                      the key points from this topic!
                    </p>
                  </div>
                </div>

                <MnemonicStyleSelector
                  selectedStyle={selectedStyle}
                  onSelect={handleSelectStyle}
                  disabled={isGenerating}
                />

                {selectedStyle && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={handleGenerateMnemonic}
                      disabled={isGenerating || saving}
                      className="flex items-center space-x-2 px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
                    >
                      <FontAwesomeIcon icon={faWandMagicSparkles} />
                      <span>Generate My Mnemonic</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Alternative options */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="flex flex-col items-center p-5 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition border-2 border-transparent hover:border-primary-300"
                >
                  <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                    <FontAwesomeIcon icon={faLayerGroup} className="text-primary-600 text-xl" />
                  </div>
                  <span className="font-semibold text-neutral-700 mb-1">Save to Flashcards</span>
                  <span className="text-neutral-500 text-xs text-center">
                    Add these key points to your revision deck
                  </span>
                </button>

                <button
                  type="button"
                  className="flex flex-col items-center p-5 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition border-2 border-transparent hover:border-primary-300"
                >
                  <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                    <FontAwesomeIcon icon={faPenFancy} className="text-primary-600 text-xl" />
                  </div>
                  <span className="font-semibold text-neutral-700 mb-1">Create Your Own</span>
                  <span className="text-neutral-500 text-xs text-center">
                    Make a personal mnemonic that works for you
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <MnemonicPlayer mnemonic={mnemonic} />
          )}
        </div>
      </section>

      {/* ================================================================== */}
      {/* StudyBuddy Encouragement Section */}
      {/* ================================================================== */}
      <section className="mb-8">
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-card p-6 text-white">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faRobot} className="text-white text-2xl" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-3">Great progress!</h3>
              <p className="text-primary-50 mb-4">
                You've covered the key concepts for {overview.topic_name}. Take a moment to
                review the takeaways above — they'll be important for your exams.
              </p>
              <p className="text-primary-100 text-sm flex items-center space-x-2">
                <FontAwesomeIcon icon={faLightbulb} />
                <span>
                  Tip: Try explaining these concepts to someone else — it's one of the best
                  ways to reinforce your learning!
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Continue Button */}
      {/* ================================================================== */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-primary-900 mb-1">Ready to continue?</h3>
              <p className="text-neutral-600 text-sm">
                Next: Quick reflection on what you've learned
              </p>
            </div>
            <button
              type="button"
              onClick={handleContinue}
              disabled={saving}
              className="flex items-center space-x-2 px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
            >
              <span>Continue to Reflection</span>
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// =============================================================================
// Mock Lyrics Generator (Development Only)
// =============================================================================

function generateMockLyrics(topicName: string, style: MnemonicStyle): string {
  const mockLyrics: Record<MnemonicStyle, string> = {
    "hip-hop": `Yo, listen up, here's the knowledge drop
${topicName}, we never stop

Verse 1:
Atoms in the nucleus, protons and neutrons tight
Electrons spinning round, keeping it right
Atomic number tells you what element you got
The periodic table, yeah we learned a lot

Chorus:
Learn it, know it, ace that test
ReviseRight helping us be the best!`,

    pop: `🎵 ${topicName} 🎵

Every atom has a story to tell
Protons, neutrons, electrons as well
The periodic table shows the way
Learning chemistry every day

Remember the numbers, remember the signs
Understanding science, it all aligns
We've got this, we know the facts
Nothing's gonna hold us back!`,

    rock: `⚡ ${topicName} ⚡

[Verse]
Atoms colliding, electrons are free
Understanding chemistry, that's the key
Mass number minus atomic gives you neutrons
Learning these facts, we're the new icons

[Chorus]
We rock this knowledge, we own this stage
Writing our future on every page
Science is power, knowledge is might
With ReviseRight, our future's bright!`,
  };

  return mockLyrics[style] || mockLyrics["pop"];
}