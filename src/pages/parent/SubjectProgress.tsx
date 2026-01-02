// src/pages/parent/SubjectProgress.tsx

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { 
  fetchSubjectProgress, 
  fetchChildrenForParent 
} from "../../services/subjectProgressService";
import type { SubjectProgressData, ChildOption } from "../../types/subjectProgress";
import {
  ChildInfoBanner,
  OverviewCards,
  SubjectCard,
  CoverageSummary,
  ReassuranceCard,
  FocusAreasCard,
  TimelineView,
  SuggestionsCard,
  QuickActions,
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
      <div className="min-h-[calc(100vh-73px)] bg-neutral-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading subject progress...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) return null;

  // Error state
  if (error) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-neutral-bg">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-red-700 font-medium">Failed to load subject progress</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
      <div className="min-h-[calc(100vh-73px)] bg-neutral-bg">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-gray-600">No children found. Please add a child first.</p>
            <button
              onClick={() => navigate("/parent/onboarding")}
              className="mt-4 px-4 py-2 bg-brand-purple text-white rounded-lg hover:opacity-95"
            >
              Add Child
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Derived values for reassurance card
  const hasActiveSubjects = data.subjects.some(s => s.status === "in_progress");
  const hasRevisitedTopics = data.overview?.topics_revisited_count ? data.overview.topics_revisited_count > 0 : false;
  const hasUpcomingTopics = data.overview?.next_week_topics_count ? data.overview.next_week_topics_count > 0 : false;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-neutral-bg">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Link to="/parent" className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900">Subject Progress</h1>
          </div>
          <p className="text-sm text-gray-500 ml-8">
            Overview of what's been covered and what's coming next
          </p>
        </div>

        {/* Child Info Banner */}
        <section className="mb-8">
          <ChildInfoBanner
            child={data.child}
            children={children}
            selectedChildId={selectedChildId || ""}
            onChildChange={handleChildChange}
          />
        </section>

        {/* Overview Cards */}
        {data.overview && (
          <section className="mb-8">
            <OverviewCards overview={data.overview} />
          </section>
        )}

        {/* Subject Cards */}
        {data.subjects.length > 0 && (
          <section className="space-y-6 mb-8">
            {data.subjects.map((subject) => (
              <SubjectCard key={subject.subject_id} subject={subject} />
            ))}
          </section>
        )}

        {/* Coverage Summary */}
        {data.subjects.length > 0 && (
          <section className="mb-8">
            <CoverageSummary subjects={data.subjects} />
          </section>
        )}

        {/* Two Column: Reassurance + Focus Areas */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ReassuranceCard
            child={data.child}
            hasActiveSubjects={hasActiveSubjects}
            hasRevisitedTopics={hasRevisitedTopics}
            hasUpcomingTopics={hasUpcomingTopics}
          />
          <FocusAreasCard
            focusAreas={data.focus_areas}
            childName={data.child.child_name}
          />
        </section>

        {/* Suggestions */}
        <section className="mb-8">
          <SuggestionsCard suggestions={data.suggestions} />
        </section>

        {/* Timeline */}
        <section className="mb-8">
          <TimelineView timeline={data.timeline} />
        </section>

        {/* Quick Actions */}
        <section className="mb-8">
          <QuickActions
            onAddTopic={() => {/* TODO: Implement */}}
            onRequestReview={() => {/* TODO: Implement */}}
            onExportProgress={() => {/* TODO: Implement */}}
          />
        </section>

        {/* Support Banner */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Everything is on track</h3>
                <p className="text-blue-100 mb-4">
                  {data.child.child_name} is building confidence steadily across all subjects. 
                  Coverage is happening at a comfortable pace with regular review sessions to reinforce learning.
                </p>
                <button 
                  onClick={() => navigate("/revision-plan")}
                  className="px-5 py-2.5 bg-white text-blue-500 font-medium rounded-lg hover:bg-blue-50 transition-colors"
                >
                  View Full Revision Plan
                </button>
              </div>
              <div className="hidden lg:block ml-8">
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-12 h-12 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}