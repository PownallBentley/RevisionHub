// src/pages/child/SessionOverview.tsx
// UPDATED: New design implementation - January 2026

import { useEffect, useMemo, useState } from "react";
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
  faComments,
  faHeart,
  faCalendarDays,
  faArrowRight,
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
  faChartLine,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "../../lib/supabase";
import { PageLayout } from "../../components/layout";

// Icon mapping
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

async function safeRpc<T>(fn: string, args?: Record<string, any>) {
  const first = await supabase.rpc(fn, args ?? {});
  if (!first.error) return first as { data: T; error: null };

  const second = await supabase.rpc(fn);
  if (!second.error) return second as { data: T; error: null };

  return first as any;
}

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

// Step colors for the 4-step model
const STEP_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-200" },
  { bg: "bg-indigo-100", text: "text-indigo-600", border: "border-indigo-200" },
  { bg: "bg-green-100", text: "text-green-600", border: "border-green-200" },
  { bg: "bg-purple-100", text: "text-purple-600", border: "border-purple-200" },
];

export default function SessionOverview() {
  const navigate = useNavigate();
  const { plannedSessionId } = useParams<{ plannedSessionId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<PlannedSessionOverview | null>(null);
  const [revisionSessionId, setRevisionSessionId] = useState<string | null>(null);

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
          .select("id, subject_id, topic_ids, session_duration_minutes, session_pattern")
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

        // 4) Start (or resume) the revision session
        const start = await safeRpc<any>("rpc_start_planned_session", {
          p_planned_session_id: id,
        });

        if (start.error) throw start.error;

        // Support various return shapes
        const rId =
          (start.data as any)?.out_revision_session_id ??
          (Array.isArray(start.data) ? (start.data[0] as any)?.out_revision_session_id : null) ??
          (start.data as any)?.revision_session_id ??
          (start.data as any)?.id ??
          (Array.isArray(start.data) ? (start.data[0] as any)?.id : null);

        const rIdStr = String(rId ?? "");
        if (!isUuid(rIdStr)) {
          throw new Error("Couldn't start the session (no valid revision session id returned).");
        }

        if (cancelled) return;

        setRevisionSessionId(rIdStr);
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

  const subjectName = overview?.subject?.subject_name ?? "Revision";
  const subjectIcon = getIconFromName(overview?.subject?.icon || "book");
  const subjectColor = overview?.subject?.color || "#5B2CFF";
  const topicCount = overview?.topics.length ?? 0;
  const duration = overview?.session_duration_minutes ?? 20;
  const primaryTopic = overview?.topics[0]?.topic_name ?? "Topics";

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
              background: `linear-gradient(135deg, ${subjectColor} 0%, ${adjustColor(subjectColor, -30)} 100%)` 
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
                    {topicCount > 1 
                      ? `${topicCount} Topics`
                      : primaryTopic
                    }
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
              </div>
            </div>
          </div>
        </section>

        {/* Topics to Cover */}
        {topicCount > 0 && (
          <section className="mb-8">
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h2 className="text-xl font-bold text-primary-900 mb-4">
                {topicCount > 1 ? "Topics You'll Cover" : "Topic Overview"}
              </h2>
              
              <div className="space-y-3">
                {overview?.topics.map((topic, index) => (
                  <div 
                    key={topic.id}
                    className="flex items-center space-x-4 p-4 bg-neutral-50 rounded-xl"
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: subjectColor }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-700">{topic.topic_name}</h3>
                      <p className="text-neutral-500 text-sm">
                        {index === 0 ? "Starting topic" : `Topic ${index + 1} of ${topicCount}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* How This Session Works - 4 Steps */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl shadow-soft p-6 border border-primary-200">
            <div className="flex items-start space-x-4 mb-6">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faLightbulb} className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary-900 mb-2">How This Session Works</h2>
                <p className="text-neutral-600">
                  Each topic follows a proven 4-step learning structure
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StepCard
                number={1}
                title="Recall"
                description="Quick questions to activate what you already know"
                colorScheme={STEP_COLORS[0]}
              />
              <StepCard
                number={2}
                title="Reinforce"
                description="Flashcards and examples to strengthen understanding"
                colorScheme={STEP_COLORS[1]}
              />
              <StepCard
                number={3}
                title="Practice"
                description="Apply your knowledge with exam-style questions"
                colorScheme={STEP_COLORS[2]}
              />
              <StepCard
                number={4}
                title="Reflect"
                description="Think about what you've learned and how you feel"
                colorScheme={STEP_COLORS[3]}
              />
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
                  <span className="text-neutral-700 font-medium text-sm">
                    {topicCount} {topicCount === 1 ? "topic" : "topics"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={!revisionSessionId}
                onClick={() => navigate(`/child/session/${plannedSessionId}/run`)}
                className="bg-primary-600 text-white font-bold px-12 py-4 rounded-xl hover:bg-primary-700 transition shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Begin Session
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

/**
 * Step Card Component
 */
function StepCard({
  number,
  title,
  description,
  colorScheme,
}: {
  number: number;
  title: string;
  description: string;
  colorScheme: { bg: string; text: string; border: string };
}) {
  return (
    <div className="bg-white rounded-xl p-4">
      <div className="flex items-center space-x-3 mb-2">
        <div className={`w-8 h-8 ${colorScheme.bg} rounded-lg flex items-center justify-center`}>
          <span className={`${colorScheme.text} font-bold text-sm`}>{number}</span>
        </div>
        <h3 className="font-semibold text-neutral-700">{title}</h3>
      </div>
      <p className="text-neutral-600 text-sm ml-11">{description}</p>
    </div>
  );
}

/**
 * Tip Item Component
 */
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

/**
 * Darken/lighten a hex color
 */
function adjustColor(hex: string, amount: number): string {
  const cleanHex = hex.replace("#", "");
  const r = Math.max(0, Math.min(255, parseInt(cleanHex.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(cleanHex.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(cleanHex.substring(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}