// src/pages/parent/SubjectProgress.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../contexts/AuthContext";
import {
  fetchSubjectProgress,
  fetchChildrenForParent,
} from "../../services/subjectProgressService";
import type { SubjectProgressData, ChildOption } from "../../types/subjectProgress";
import {
  SubjectCard,
  CoverageSummary,
  QuickStats,
  RecentActivity,
} from "../../components/subjects";

// Design system colors
const COLORS = {
  primary: { 600: "#5B2CFF", 900: "#2A185E" },
  neutral: { 50: "#F9FAFC", 100: "#F6F7FB", 200: "#E1E4EE", 500: "#6C7280", 600: "#4B5161", 700: "#1F2330" },
  accent: { green: "#1EC592", amber: "#FFB547", red: "#F05151" },
};

export default function SubjectProgress() {
  const navigate = useNavigate();
  const { user, profile, activeChildId, loading: authLoading } = useAuth();

  const [data, setData] = useState<SubjectProgressData | null>(null);
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not logged in or is a child
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    if (activeChildId) {
      navigate("/child/today", { replace: true });
      return;
    }
  }, [authLoading, user, activeChildId, navigate]);

  // Load children list
  useEffect(() => {
    if (!user) return;

    async function loadChildren() {
      const { data: childrenData } = await fetchChildrenForParent(user!.id);
      if (childrenData && childrenData.length > 0) {
        setChildren(childrenData);
        setSelectedChildId(childrenData[0].child_id);
      } else {
        setLoading(false);
      }
    }

    loadChildren();
  }, [user]);

  // Load subject progress data
  useEffect(() => {
    if (!user || !selectedChildId) return;

    async function loadData() {
      setLoading(true);
      setError(null);

      const { data: progressData, error: fetchError } = await fetchSubjectProgress(
        user!.id,
        selectedChildId!
      );

      if (fetchError) {
        setError(fetchError);
        setData(null);
      } else {
        setData(progressData);
      }

      setLoading(false);
    }

    loadData();
  }, [user, selectedChildId]);

  // Handle child change
  const handleChildChange = (childId: string) => {
    setSelectedChildId(childId);
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div
        className="min-h-[calc(100vh-73px)] flex items-center justify-center"
        style={{ backgroundColor: COLORS.neutral[100] }}
      >
        <div className="text-center">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: COLORS.primary[600] }}
          />
          <p className="text-sm" style={{ color: COLORS.neutral[600] }}>
            Loading subject progress...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !profile) return null;

  // Error state
  if (error) {
    return (
      <div
        className="min-h-[calc(100vh-73px)]"
        style={{ backgroundColor: COLORS.neutral[100] }}
      >
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div
            className="rounded-2xl p-6 text-center"
            style={{ backgroundColor: "#FEE2E2", border: "1px solid #FECACA" }}
          >
            <p className="font-medium" style={{ color: COLORS.accent.red }}>
              Failed to load subject progress
            </p>
            <p className="text-sm mt-1" style={{ color: "#B91C1C" }}>
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 text-white rounded-lg hover:opacity-90"
              style={{ backgroundColor: COLORS.accent.red }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!data || !data.child) {
    return (
      <div
        className="min-h-[calc(100vh-73px)]"
        style={{ backgroundColor: COLORS.neutral[100] }}
      >
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div
            className="bg-white rounded-2xl p-8 text-center"
            style={{ boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)" }}
          >
            <p style={{ color: COLORS.neutral[600] }}>
              No children found. Please add a child first.
            </p>
            <button
              onClick={() => navigate("/parent/onboarding")}
              className="mt-4 px-4 py-2 text-white rounded-full hover:opacity-90"
              style={{ backgroundColor: COLORS.primary[600] }}
            >
              Add Child
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalSubjects = data.subjects.length;
  const subjectsOnTrack = data.subjects.filter(
    (s) => s.status === "in_progress" || s.status === "completed"
  ).length;
  const avgSessionsPerWeek = data.child.sessions_this_week || 0;
  const totalRevisionPeriods = data.subjects.reduce(
    (sum, s) => sum + s.topics_covered_total,
    0
  );

  // Find subjects needing attention
  const subjectsNeedingAttention = data.subjects.filter(
    (s) => s.status === "needs_attention" || s.completion_percentage < 50
  );
  const hasIssues = subjectsNeedingAttention.length > 0;

  // Calculate average coverage
  const avgCoverage =
    totalSubjects > 0
      ? Math.round(
          data.subjects.reduce((sum, s) => sum + s.completion_percentage, 0) /
            totalSubjects
        )
      : 0;

  // Calculate weeks until exams (placeholder - would come from revision_plans)
  const weeksUntilExams = 12;

  return (
    <div
      className="min-h-[calc(100vh-73px)]"
      style={{ backgroundColor: COLORS.neutral[100] }}
    >
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero Card */}
        <section
          className="bg-white rounded-2xl p-8 mb-8"
          style={{ boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)" }}
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold" style={{ color: COLORS.primary[900] }}>
              Subjects Overview
            </h1>
            <div className="flex items-center space-x-3">
              <span className="text-sm" style={{ color: COLORS.neutral[500] }}>
                Child:
              </span>
              <div
                className="relative flex items-center px-4 py-2 rounded-full border cursor-pointer"
                style={{
                  backgroundColor: "#F7F4FF",
                  borderColor: "#EAE3FF",
                }}
              >
                <select
                  value={selectedChildId || ""}
                  onChange={(e) => handleChildChange(e.target.value)}
                  className="appearance-none bg-transparent border-none font-medium focus:outline-none cursor-pointer pr-6"
                  style={{ color: COLORS.primary[600] }}
                >
                  {children.map((child) => (
                    <option key={child.child_id} value={child.child_id}>
                      {child.child_name}
                    </option>
                  ))}
                </select>
                <FontAwesomeIcon 
                  icon={faChevronDown} 
                  className="absolute right-4 text-xs pointer-events-none" 
                  style={{ color: COLORS.primary[600] }}
                />
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="flex items-center space-x-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: hasIssues ? COLORS.accent.amber : COLORS.accent.green }}
              />
              <div>
                <div
                  className="text-sm font-medium"
                  style={{ color: hasIssues ? COLORS.accent.amber : COLORS.accent.green }}
                >
                  {hasIssues ? "Needs attention" : "Subjects on track"}
                </div>
                <div className="text-xs" style={{ color: COLORS.neutral[500] }}>
                  Overall status
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: COLORS.primary[900] }}>
                {totalSubjects}
              </div>
              <div className="text-sm" style={{ color: COLORS.neutral[500] }}>
                Total subjects
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: COLORS.primary[900] }}>
                {avgSessionsPerWeek}
              </div>
              <div className="text-sm" style={{ color: COLORS.neutral[500] }}>
                Avg sessions/week
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: COLORS.primary[900] }}>
                {totalRevisionPeriods}
              </div>
              <div className="text-sm" style={{ color: COLORS.neutral[500] }}>
                Total revision periods
              </div>
            </div>
          </div>

          {/* Alert Box */}
          {hasIssues && subjectsNeedingAttention[0] && (
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: COLORS.neutral[50] }}
            >
              <div className="flex items-start space-x-3">
                <FontAwesomeIcon
                  icon={faInfoCircle}
                  className="mt-0.5"
                  style={{ color: COLORS.primary[600] }}
                />
                <div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: COLORS.neutral[700] }}
                  >
                    Any issues
                  </div>
                  <div className="text-sm" style={{ color: COLORS.neutral[600] }}>
                    {subjectsNeedingAttention[0].subject_name} needs additional focus on{" "}
                    {subjectsNeedingAttention[0].coming_up?.[0]?.topic_name ||
                      "upcoming topics"}
                    . Consider extra practice sessions.
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subject Cards Grid */}
          <div className="lg:col-span-2 space-y-6">
            {data.subjects.map((subject) => (
              <SubjectCard key={subject.subject_id} subject={subject} />
            ))}

            {data.subjects.length === 0 && (
              <div
                className="bg-white rounded-2xl p-8 text-center"
                style={{ boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)" }}
              >
                <p style={{ color: COLORS.neutral[600] }}>
                  No subjects set up yet for this child.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Coverage Summary Chart */}
            <CoverageSummary subjects={data.subjects} />

            {/* Quick Stats */}
            <QuickStats
              subjectsOnTrack={subjectsOnTrack}
              totalSubjects={totalSubjects}
              needsAttention={subjectsNeedingAttention.length}
              avgCoverage={avgCoverage}
              weeksUntilExams={weeksUntilExams}
            />

            {/* Recent Activity */}
            <RecentActivity subjects={data.subjects} />
          </div>
        </div>
      </main>
    </div>
  );
}