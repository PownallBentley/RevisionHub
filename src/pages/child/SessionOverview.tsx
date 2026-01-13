// src/pages/child/SessionOverview.tsx
// UPDATED: 7-Step Session Model - January 2026

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faClock,
  faChartSimple,
  faFire,
  faLightbulb,
  faRocket,
  faVolumeXmark,
  faPencil,
  faHeart,
  faCheckDouble,
  faChartLine,
  faBullseye,
  faCircleCheck,
  faFlask,
  faCalculator,
  faBook,
  faAtom,
  faGlobe,
  faLandmark,
  faDna,
  faLanguage,
  faPalette,
  faMusic,
  faLaptopCode,
  faRunning,
  faTheaterMasks,
  faCross,
  faBalanceScale,
  faFaceSmile,
  faFaceMeh,
  faSeedling,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "../../lib/supabase";
import { PageLayout } from "../../components/layout";

// =============================================================================
// Types
// =============================================================================

type TopicInfo = {
  id: string;
  topic_name: string;
};

type SubjectInfo = {
  id: string;
  subject_name: string;
  icon: string | null;
  color: string | null;
};

type PlannedSessionOverview = {
  planned_session_id: string;
  subject: SubjectInfo | null;
  topic_ids: string[];
  topics: TopicInfo[];
  session_duration_minutes: number;
  session_pattern: string;
};

type SessionStats = {
  total_sessions_completed: number;
  current_streak: number;
  points_balance: number;
  subject_history: {
    last_session_date: string | null;
    last_topic_name: string | null;
    last_confidence: string | null;
  } | null;
};

type PreConfidenceLevel =
  | "very_confident"
  | "somewhat_confident"
  | "not_confident"
  | "new_to_this";

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
  language: faLanguage,
  palette: faPalette,
  music: faMusic,
  "laptop-code": faLaptopCode,
  running: faRunning,
  "theater-masks": faTheaterMasks,
  cross: faCross,
  "balance-scale": faBalanceScale,
  "chart-line": faChartLine,
  history: faLandmark,
  science: faFlask,
  maths: faCalculator,
  english: faBook,
  geography: faGlobe,
  physics: faAtom,
  chemistry: faFlask,
  biology: faDna,
};

function getIconFromName(iconName: string): IconDefinition {
  return ICON_MAP[iconName?.toLowerCase()] || faBook;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

// Darken/lighten a hex color
function adjustColor(hex: string, amount: number): string {
  const cleanHex = hex.replace("#", "");
  const r = Math.max(0, Math.min(255, parseInt(cleanHex.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(cleanHex.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(cleanHex.substring(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// =============================================================================
// Pre-Confidence Options
// =============================================================================

const PRE_CONFIDENCE_OPTIONS: Array<{
  value: PreConfidenceLevel;
  label: string;
  description: string;
  icon: IconDefinition;
  colorClass: string;
  bgClass: string;
}> = [
  {
    value: "very_confident",
    label: "Very Confident",
    description: "I know this topic well",
    icon: faFaceSmile,
    colorClass: "text-accent-green",
    bgClass: "bg-accent-green/10",
  },
  {
    value: "somewhat_confident",
    label: "Somewhat Confident",
    description: "I remember some things",
    icon: faFaceMeh,
    colorClass: "text-primary-600",
    bgClass: "bg-primary-100",
  },
  {
    value: "not_confident",
    label: "Not Very Confident",
    description: "I need more practice",
    icon: faFaceMeh,
    colorClass: "text-accent-amber",
    bgClass: "bg-accent-amber/10",
  },
  {
    value: "new_to_this",
    label: "New to This",
    description: "I haven't studied this yet",
    icon: faSeedling,
    colorClass: "text-neutral-600",
    bgClass: "bg-neutral-200",
  },
];

// =============================================================================
// 7-Step Definitions
// =============================================================================

const SESSION_STEPS = [
  {
    number: 1,
    title: "Preview",
    description: "Overview of today's topic and your starting confidence",
    duration: "1 min",
  },
  {
    number: 2,
    title: "Recall",
    description: "Quick flashcards to activate what you already know",
    duration: "3 min",
  },
  {
    number: 3,
    title: "Reinforce",
    description: "Key concepts explained with examples and worked solutions",
    duration: "8 min",
  },
  {
    number: 4,
    title: "Practice",
    description: "Apply your understanding with exam-style questions",
    duration: "5 min",
  },
  {
    number: 5,
    title: "Summary",
    description: "Key takeaways and optional memory aids",
    duration: "2 min",
  },
  {
    number: 6,
    title: "Reflection",
    description: "Think about what you've learned and how you feel",
    duration: "1 min",
  },
  {
    number: 7,
    title: "Complete",
    description: "Celebrate your progress and see what's next",
    duration: "30 sec",
  },
];

// =============================================================================
// Main Component
// =============================================================================

export default function SessionOverview() {
  const navigate = useNavigate();
  const { plannedSessionId } = useParams<{ plannedSessionId: string }>();

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<PlannedSessionOverview | null>(null);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [preConfidence, setPreConfidence] = useState<PreConfidenceLevel | null>(null);

  // Load session data
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const id = String(plannedSessionId ?? "");
      if (!id || !isUuid(id)) {
        setError("That session link looks invalid. Please go back and start again.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 1) Pull planned session data
        const { data: planned, error: plannedErr } = await supabase
          .from("planned_sessions")
          .select("id, child_id, subject_id, topic_ids, session_duration_minutes, session_pattern")
          .eq("id", id)
          .maybeSingle();

        if (plannedErr) throw plannedErr;
        if (!planned) throw new Error("Session not found.");

        // 2) Get subject info including icon and color
        let subject: SubjectInfo | null = null;
        if (planned.subject_id) {
          const { data: subjectData, error: subjectErr } = await supabase
            .from("subjects")
            .select("id, subject_name, icon, color")
            .eq("id", planned.subject_id)
            .maybeSingle();

          if (!subjectErr && subjectData) {
            subject = subjectData;
          }
        }

        // 3) Get all topic details
        const topicIds: string[] = Array.isArray(planned.topic_ids)
          ? planned.topic_ids.filter((tid: any) => tid && isUuid(String(tid))).map(String)
          : [];

        let topics: TopicInfo[] = [];
        if (topicIds.length > 0) {
          const { data: topicsData, error: topicsErr } = await supabase
            .from("topics")
            .select("id, topic_name")
            .in("id", topicIds);

          if (!topicsErr && topicsData) {
            // Maintain the order from topic_ids
            topics = topicIds
              .map((tid) => topicsData.find((t) => t.id === tid))
              .filter((t): t is TopicInfo => t !== undefined);
          }
        }

        if (cancelled) return;

        setOverview({
          planned_session_id: id,
          subject,
          topic_ids: topicIds,
          topics,
          session_duration_minutes: planned.session_duration_minutes ?? 20,
          session_pattern: planned.session_pattern ?? "SINGLE_20",
        });

        // 4) Load stats (using existing RPCs where available)
        await loadStats(planned.child_id, planned.subject_id);

        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        console.error("[SessionOverview] load error:", e);
        setError(e?.message ?? "Failed to load session.");
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [plannedSessionId]);

  // Load stats from existing gamification RPC
  async function loadStats(childId: string, subjectId: string) {
    try {
      // Use existing gamification summary RPC
      const { data: gamification } = await supabase.rpc("rpc_get_child_gamification_summary", {
        p_child_id: childId,
      });

      // Count completed sessions (simple query)
      const { count: sessionsCount } = await supabase
        .from("planned_sessions")
        .select("*", { count: "exact", head: true })
        .eq("child_id", childId)
        .eq("status", "completed");

      // Get last session in this subject
      const { data: lastSession } = await supabase
        .from("revision_sessions")
        .select("completed_at, confidence_level, topic_id")
        .eq("child_id", childId)
        .eq("subject_id", subjectId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let lastTopicName: string | null = null;
      if (lastSession?.topic_id) {
        const { data: topicData } = await supabase
          .from("topics")
          .select("topic_name")
          .eq("id", lastSession.topic_id)
          .maybeSingle();
        lastTopicName = topicData?.topic_name ?? null;
      }

      setStats({
        total_sessions_completed: sessionsCount ?? 0,
        current_streak: gamification?.streak?.current ?? 0,
        points_balance: gamification?.points?.balance ?? 0,
        subject_history: lastSession
          ? {
              last_session_date: lastSession.completed_at,
              last_topic_name: lastTopicName,
              last_confidence: lastSession.confidence_level,
            }
          : null,
      });
    } catch (e) {
      console.error("[SessionOverview] loadStats error:", e);
      // Stats are optional - don't fail the page
    }
  }

  // Start the session
  async function handleStartSession() {
    if (!overview) return;

    setStarting(true);

    try {
      // 1) Start the session (creates revision_session and step rows)
      const { data: startData, error: startError } = await supabase.rpc("rpc_start_planned_session", {
        p_planned_session_id: overview.planned_session_id,
      });

      if (startError) throw startError;

      // Extract revision session ID from various possible return shapes
      const rId =
        (startData as any)?.out_revision_session_id ??
        (Array.isArray(startData) ? (startData[0] as any)?.out_revision_session_id : null) ??
        (startData as any)?.revision_session_id ??
        (startData as any)?.id ??
        (Array.isArray(startData) ? (startData[0] as any)?.id : null);

      const rIdStr = String(rId ?? "");
      if (!isUuid(rIdStr)) {
        throw new Error("Couldn't start the session (no valid revision session id returned).");
      }

      // Pre-confidence is now captured in PreviewStep (step 1 of 6-step model)
      // No need to save it here anymore

      // Navigate to session runner
      navigate(`/child/session/${overview.planned_session_id}/run`);
    } catch (e: any) {
      console.error("[SessionOverview] handleStartSession error:", e);
      setError(e?.message ?? "Failed to start session.");
      setStarting(false);
    }
  }

  // Derived values
  const subjectName = overview?.subject?.subject_name ?? "Revision";
  const subjectIcon = getIconFromName(overview?.subject?.icon || "book");
  const subjectColor = overview?.subject?.color || "#5B2CFF";
  const topicCount = overview?.topics.length ?? 0;
  const duration = overview?.session_duration_minutes ?? 20;
  const primaryTopic = overview?.topics[0]?.topic_name ?? "Topics";

  // ==========================================================================
  // Render
  // ==========================================================================

  // Loading state
  if (loading) {
    return (
      <PageLayout bgColor="bg-neutral-100">
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-neutral-600">Preparing your session...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <PageLayout bgColor="bg-neutral-100">
        <div className="max-w-[1120px] mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h1 className="text-xl font-semibold text-neutral-700 mb-2">Session</h1>
            <p className="text-neutral-600 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => navigate("/child/today")}
              className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 font-medium"
            >
              Back to Today
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout bgColor="bg-neutral-100">
      <main className="max-w-[1120px] mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate("/child/today")}
          className="flex items-center space-x-2 text-neutral-600 hover:text-neutral-700 mb-6 transition"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span className="font-medium">Back to Today</span>
        </button>

        {/* Hero Section */}
        <section className="mb-8">
          <div
            className="rounded-2xl shadow-card p-8 text-white relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${subjectColor} 0%, ${adjustColor(subjectColor, -30)} 100%)`,
            }}
          >
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />

            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <FontAwesomeIcon icon={subjectIcon} className="text-white text-2xl" />
                </div>
                <div>
                  <p className="text-white/70 text-sm font-medium">{subjectName}</p>
                  <h1 className="text-3xl font-bold">
                    {topicCount > 1 ? `${topicCount} Topics` : primaryTopic}
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-6">
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faClock} className="text-white/60" />
                  <span className="text-white/90 font-medium">{duration} minutes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faChartSimple} className="text-white/60" />
                  <span className="text-white/90 font-medium">
                    {topicCount} {topicCount === 1 ? "topic" : "topics"}
                  </span>
                </div>
                {stats && stats.current_streak > 0 && (
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faFire} className="text-accent-green" />
                    <span className="text-white/90 font-medium">Day {stats.current_streak} streak</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* What You'll Revise */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-start space-x-4 mb-6">
              <div className="w-12 h-12 bg-accent-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faBullseye} className="text-accent-green text-xl" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-primary-900 mb-2">What You'll Revise</h2>
                <p className="text-neutral-600">
                  {topicCount > 1
                    ? `Today you'll work through ${topicCount} topics in ${subjectName}.`
                    : `Today's session focuses on ${primaryTopic}.`}
                </p>
              </div>
            </div>

            <div className="space-y-3 ml-16">
              {overview?.topics.map((topic) => (
                <div key={topic.id} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FontAwesomeIcon icon={faCircleCheck} className="text-primary-600 text-xs" />
                  </div>
                  <p className="text-neutral-700 font-medium">{topic.topic_name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How This Session Works - 7 Steps */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl shadow-soft p-6 border border-primary-200">
            <div className="flex items-start space-x-4 mb-6">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faLightbulb} className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary-900 mb-2">How This Session Works</h2>
                <p className="text-neutral-600">
                  Each topic follows a proven 7-step structure designed to help you learn effectively.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SESSION_STEPS.slice(0, 4).map((step) => (
                <StepCard key={step.number} {...step} />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {SESSION_STEPS.slice(4).map((step) => (
                <StepCard key={step.number} {...step} />
              ))}
            </div>
          </div>
        </section>

        {/* Your Progress So Far (if stats available) */}
        {stats && stats.total_sessions_completed > 0 && (
          <section className="mb-8">
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h2 className="text-xl font-bold text-primary-900 mb-4">Your Progress So Far</h2>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-neutral-50 rounded-xl p-4 text-center">
                  <div className="w-12 h-12 bg-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FontAwesomeIcon icon={faCheckDouble} className="text-accent-green text-xl" />
                  </div>
                  <p className="text-2xl font-bold text-primary-900 mb-1">{stats.total_sessions_completed}</p>
                  <p className="text-neutral-600 text-sm">Sessions completed</p>
                </div>

                <div className="bg-neutral-50 rounded-xl p-4 text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FontAwesomeIcon icon={faChartLine} className="text-primary-600 text-xl" />
                  </div>
                  <p className="text-2xl font-bold text-primary-900 mb-1">{stats.points_balance}</p>
                  <p className="text-neutral-600 text-sm">Points earned</p>
                </div>

                <div className="bg-neutral-50 rounded-xl p-4 text-center">
                  <div className="w-12 h-12 bg-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FontAwesomeIcon icon={faFire} className="text-accent-green text-xl" />
                  </div>
                  <p className="text-2xl font-bold text-primary-900 mb-1">{stats.current_streak}</p>
                  <p className="text-neutral-600 text-sm">Day streak</p>
                </div>
              </div>

              {stats.subject_history && (
                <div className="bg-primary-50 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <FontAwesomeIcon icon={faLightbulb} className="text-primary-600 text-lg mt-0.5" />
                    <div>
                      <p className="font-semibold text-primary-900 mb-1">Last time you studied {subjectName}:</p>
                      <p className="text-neutral-700 text-sm">
                        You completed "{stats.subject_history.last_topic_name}" and felt{" "}
                        <span className="font-medium">{stats.subject_history.last_confidence?.replace("_", " ")}</span>.
                        Great foundation to build on!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Pre-Confidence Check */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="text-xl font-bold text-primary-900 mb-2">How Confident Do You Feel?</h2>
            <p className="text-neutral-600 mb-6">
              Let us know your starting point so we can tailor the session to you. Don't worry—this is
              just to help us, not a test!
            </p>

            <div className="space-y-3">
              {PRE_CONFIDENCE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPreConfidence(option.value)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition ${
                    preConfidence === option.value
                      ? "border-primary-600 bg-primary-50"
                      : "border-transparent bg-neutral-50 hover:bg-primary-50 hover:border-primary-200"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 ${option.bgClass} rounded-full flex items-center justify-center`}>
                      <FontAwesomeIcon icon={option.icon} className={`${option.colorClass} text-xl`} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-neutral-700">{option.label}</p>
                      <p className="text-neutral-500 text-sm">{option.description}</p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      preConfidence === option.value
                        ? "border-primary-600 bg-primary-600"
                        : "border-neutral-300"
                    }`}
                  >
                    {preConfidence === option.value && (
                      <FontAwesomeIcon icon={faCircleCheck} className="text-white text-xs" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Tips */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="text-xl font-bold text-primary-900 mb-4">Quick Tips for Success</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TipItem
                icon={faVolumeXmark}
                title="Find a quiet space"
                description="Minimize distractions so you can focus"
              />
              <TipItem
                icon={faPencil}
                title="Have paper handy"
                description="Writing helps you remember better"
              />
              <TipItem
                icon={faClock}
                title="Take your time"
                description="Understanding matters more than speed"
              />
              <TipItem
                icon={faHeart}
                title="Be kind to yourself"
                description="Learning takes time—you're doing great!"
              />
            </div>
          </div>
        </section>

        {/* Ready to Begin CTA */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl shadow-soft p-6 border border-primary-200">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faRocket} className="text-white text-3xl" />
              </div>
              <h2 className="text-2xl font-bold text-primary-900 mb-2">Ready to Begin?</h2>
              <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                You're all set! Take a deep breath, and let's dive into {primaryTopic} together.
              </p>

              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full">
                  <FontAwesomeIcon icon={faClock} className="text-neutral-600" />
                  <span className="text-neutral-700 font-medium text-sm">{duration} minutes</span>
                </div>
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full">
                  <FontAwesomeIcon icon={faChartSimple} className="text-neutral-600" />
                  <span className="text-neutral-700 font-medium text-sm">7 steps</span>
                </div>
              </div>

              <button
                type="button"
                disabled={starting}
                onClick={handleStartSession}
                className="bg-primary-600 text-white font-bold px-12 py-4 rounded-xl hover:bg-primary-700 transition shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {starting ? "Starting..." : "Begin Session"}
              </button>
            </div>
          </div>
        </section>

        {/* Alternative Actions */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h3 className="font-semibold text-neutral-700 mb-4 text-center">Not ready yet?</h3>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => navigate("/child/today")}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-neutral-50 text-neutral-700 font-medium rounded-xl hover:bg-neutral-100 transition"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </PageLayout>
  );
}

// =============================================================================
// Sub-Components
// =============================================================================

function StepCard({
  number,
  title,
  description,
  duration,
}: {
  number: number;
  title: string;
  description: string;
  duration: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4">
      <div className="flex items-center space-x-3 mb-2">
        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
          <span className="text-primary-700 font-bold text-sm">{number}</span>
        </div>
        <h3 className="font-semibold text-neutral-700">{title}</h3>
        <span className="text-neutral-500 text-sm ml-auto">{duration}</span>
      </div>
      <p className="text-neutral-600 text-sm ml-11">{description}</p>
    </div>
  );
}

function TipItem({
  icon,
  title,
  description,
}: {
  icon: IconDefinition;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start space-x-3 p-3 bg-neutral-50 rounded-lg">
      <FontAwesomeIcon icon={icon} className="text-neutral-600 text-lg mt-0.5" />
      <div>
        <p className="font-semibold text-neutral-700 text-sm mb-1">{title}</p>
        <p className="text-neutral-600 text-sm">{description}</p>
      </div>
    </div>
  );
}