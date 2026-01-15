// src/pages/parent/SubjectProgress.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faBook,
  faCalendarCheck,
  faLayerGroup,
  faCheckCircle,
  faExclamationCircle,
  faChartLine,
  faArrowRight,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../contexts/AuthContext";
import { PageLayout } from "../../components/layout";
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

  // Handle Add Subject click (placeholder for now)
  const handleAddSubject = () => {
    // TODO: Open subject selection modal
    console.log("Add Subject clicked");
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-neutral-600">Loading subject progress...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!user || !profile) return null;

  // Error state
  if (error) {
    return (
      <PageLayout>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="rounded-2xl p-6 text-center bg-red-50 border border-red-200">
            <p className="font-medium text-accent-red">Failed to load subject progress</p>
            <p className="text-sm mt-1 text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 text-white rounded-lg hover:opacity-90 bg-accent-red"
            >
              Try Again
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // No data state
  if (!data || !data.child) {
    return (
      <PageLayout>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl shadow-card p-8 text-center">
            <p className="text-neutral-600">No children found. Please add a child first.</p>
            <button
              onClick={() => navigate("/parent/onboarding")}
              className="mt-4 px-4 py-2 text-white rounded-full hover:opacity-90 bg-primary-600"
            >
              Add Child
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Calculate stats
  const totalSubjects = data.subjects.length;
  const subjectsOnTrack = data.subjects.filter(
    (s) => s.status === "in_progress" || s.status === "completed"
  ).length;
  const sessionsThisWeek = data.child.sessions_this_week || 0;
  const topicsCoveredThisWeek = data.child.topics_covered_this_week || 0;

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

  // Determine headline and message based on status
  const getHeadlineContent = () => {
    if (totalSubjects === 0) {
      return {
        headline: "Let's get started",
        message: "Add subjects to begin tracking your child's revision progress.",
        status: "neutral",
      };
    }
    if (hasIssues) {
      return {
        headline: "Some subjects need attention",
        message: `${subjectsNeedingAttention.length} subject${subjectsNeedingAttention.length > 1 ? "s" : ""} could use a little extra focus. Consider scheduling additional sessions.`,
        status: "attention",
      };
    }
    return {
      headline: "All subjects on track",
      message: "Great progress! All subjects are being covered as planned.",
      status: "good",
    };
  };

  const headlineContent = getHeadlineContent();

  return (
    <PageLayout>
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero Card - Dashboard Style */}
        <section className="bg-gradient-to-br from-primary-50 to-white rounded-2xl shadow-card p-8 mb-8 relative overflow-hidden">
          {/* Decorative background icon */}
          <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center opacity-60">
            <FontAwesomeIcon icon={faChartLine} className="text-2xl text-primary-600" />
          </div>

          {/* Header with title and child selector */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-primary-900">
                  {headlineContent.headline}
                </h1>
                {headlineContent.status === "attention" && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-amber-100 text-accent-amber">
                    Needs Attention
                  </span>
                )}
                {headlineContent.status === "good" && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-accent-green">
                    On Track
                  </span>
                )}
              </div>
              <p className="text-neutral-600 max-w-xl">
                {headlineContent.message}
              </p>
            </div>

            {/* Child Selector */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-neutral-500">Child:</span>
              <div className="relative flex items-center px-4 py-2 rounded-full border cursor-pointer bg-white border-primary-200 shadow-sm">
                <select
                  value={selectedChildId || ""}
                  onChange={(e) => handleChildChange(e.target.value)}
                  className="appearance-none bg-transparent border-none font-medium focus:outline-none cursor-pointer pr-6 text-primary-600"
                >
                  {children.map((child) => (
                    <option key={child.child_id} value={child.child_id}>
                      {child.child_name}
                    </option>
                  ))}
                </select>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="absolute right-4 text-xs pointer-events-none text-primary-600"
                />
              </div>
            </div>
          </div>

          {/* Mini Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Total Subjects Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faBook} className="text-primary-600" />
                </div>
                <FontAwesomeIcon icon={faArrowRight} className="text-neutral-300 text-sm" />
              </div>
              <div className="text-2xl font-bold text-primary-900">{totalSubjects}</div>
              <div className="text-sm text-neutral-500">Total Subjects</div>
            </div>

            {/* Sessions This Week Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faCalendarCheck} className="text-accent-green" />
                </div>
                <FontAwesomeIcon icon={faArrowRight} className="text-neutral-300 text-sm" />
              </div>
              <div className="text-2xl font-bold text-primary-900">{sessionsThisWeek}</div>
              <div className="text-sm text-neutral-500">Sessions This Week</div>
            </div>

            {/* Topics Covered Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faLayerGroup} className="text-blue-600" />
                </div>
                <FontAwesomeIcon icon={faArrowRight} className="text-neutral-300 text-sm" />
              </div>
              <div className="text-2xl font-bold text-primary-900">{topicsCoveredThisWeek}</div>
              <div className="text-sm text-neutral-500">Topics This Week</div>
            </div>

            {/* Coverage Status Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${hasIssues ? "bg-amber-100" : "bg-green-100"}`}>
                  <FontAwesomeIcon
                    icon={hasIssues ? faExclamationCircle : faCheckCircle}
                    className={hasIssues ? "text-accent-amber" : "text-accent-green"}
                  />
                </div>
                <FontAwesomeIcon icon={faArrowRight} className="text-neutral-300 text-sm" />
              </div>
              <div className="text-2xl font-bold text-primary-900">
                {hasIssues ? `${subjectsNeedingAttention.length} need${subjectsNeedingAttention.length === 1 ? "s" : ""} focus` : "All good!"}
              </div>
              <div className="text-sm text-neutral-500">Coverage Status</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate("/parent/dashboard")}
              className="px-6 py-3 bg-primary-600 text-white font-medium rounded-full hover:bg-primary-700 transition-colors shadow-sm"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => navigate("/parent/schedule")}
              className="px-6 py-3 bg-white text-primary-600 font-medium rounded-full border-2 border-primary-200 hover:border-primary-300 transition-colors"
            >
              View Schedule
            </button>

            {/* Add Subject Button - Right aligned */}
            <button
              onClick={handleAddSubject}
              className="ml-auto flex items-center gap-2 px-4 py-2 text-primary-600 font-medium hover:text-primary-700 transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="text-sm" />
              Add Subject
            </button>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subject Cards Grid */}
          <div className="lg:col-span-2 space-y-6">
            {data.subjects.map((subject) => (
              <SubjectCard key={subject.subject_id} subject={subject} />
            ))}

            {data.subjects.length === 0 && (
              <div className="bg-white rounded-2xl shadow-soft p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faBook} className="text-2xl text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-primary-900 mb-2">No subjects yet</h3>
                <p className="text-neutral-600 mb-4">Add subjects to start tracking revision progress.</p>
                <button
                  onClick={handleAddSubject}
                  className="px-6 py-2 bg-primary-600 text-white font-medium rounded-full hover:bg-primary-700 transition-colors"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  Add First Subject
                </button>
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
    </PageLayout>
  );
}