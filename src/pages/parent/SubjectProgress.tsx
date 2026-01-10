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
      <div className="min-h-[calc(100vh-73px)] bg-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-neutral-600">Loading subject progress...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) return null;

  // Error state
  if (error) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-neutral-100">
        <div className="max-w-content mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-accent-red font-medium">Failed to load subject progress</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-accent-red text-white rounded-lg hover:opacity-90"
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
      <div className="min-h-[calc(100vh-73px)] bg-neutral-100">
        <div className="max-w-content mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl shadow-card p-8 text-center">
            <p className="text-neutral-600">No children found. Please add a child first.</p>
            <button
              onClick={() => navigate("/parent/onboarding")}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-pill hover:bg-primary-700"
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
  const subjectsOnTrack = data.subjects.filter((s) => s.status === "in_progress").length;
  const avgSessionsPerWeek = data.child.sessions_this_week || 0;
  const totalRevisionPeriods = data.subjects.reduce(
    (sum, s) => sum + s.topics_covered_total,
    0
  );

  // Find any issues
  const subjectsNeedingAttention = data.subjects.filter(
    (s) => s.completion_percentage < 50
  );
  const hasIssues = subjectsNeedingAttention.length > 0;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-neutral-100">
      <main className="max-w-content mx-auto px-6 py-8">
        {/* Hero Card */}
        <section className="bg-white rounded-2xl shadow-card p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-primary-900">Subjects Overview</h1>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-neutral-500">Child:</span>
              <button className="flex items-center space-x-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-pill border border-primary-200 hover:bg-primary-100 transition-colors">
                <select
                  value={selectedChildId || ""}
                  onChange={(e) => handleChildChange(e.target.value)}
                  className="bg-transparent border-none font-medium focus:outline-none cursor-pointer"
                >
                  {children.map((child) => (
                    <option key={child.child_id} value={child.child_id}>
                      {child.child_name}
                    </option>
                  ))}
                </select>
                <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 ${hasIssues ? "bg-accent-amber" : "bg-accent-green"} rounded-full`} />
              <div>
                <div className={`text-sm font-medium ${hasIssues ? "text-accent-amber" : "text-accent-green"}`}>
                  {hasIssues ? "Needs attention" : "Subjects on track"}
                </div>
                <div className="text-xs text-neutral-500">Overall status</div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-primary-900">{totalSubjects}</div>
              <div className="text-sm text-neutral-500">Total subjects</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-primary-900">{avgSessionsPerWeek}</div>
              <div className="text-sm text-neutral-500">Avg sessions/week</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-primary-900">{totalRevisionPeriods}</div>
              <div className="text-sm text-neutral-500">Total revision periods</div>
            </div>
          </div>

          {/* Alert Box */}
          {hasIssues && (
            <div className="bg-neutral-50 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <FontAwesomeIcon icon={faInfoCircle} className="text-primary-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-neutral-700">Any issues</div>
                  <div className="text-sm text-neutral-600">
                    {subjectsNeedingAttention[0]?.subject_name} needs additional focus on{" "}
                    {subjectsNeedingAttention[0]?.coming_up[0]?.topic_name || "upcoming topics"}.
                    Consider extra practice sessions.
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
              avgCoverage={Math.round(
                data.subjects.reduce((sum, s) => sum + s.completion_percentage, 0) /
                  data.subjects.length || 0
              )}
              weeksUntilExams={12}
            />

            {/* Recent Activity */}
            <RecentActivity subjects={data.subjects} />
          </div>
        </div>
      </main>
    </div>
  );
}