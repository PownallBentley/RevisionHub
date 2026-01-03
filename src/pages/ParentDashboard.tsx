// src/pages/ParentDashboard.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { fetchParentDashboard } from "../services/parentDashboardService";
import type { ParentDashboardData } from "../types/parentDashboard";
import {
  ChildCard,
  WeekSummary,
  DailyActivityChart,
  GentleReminders,
  ComingUpNext,
  SubjectCoverage,
} from "../components/dashboard";

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { user, profile, activeChildId, parentChildCount, loading: authLoading, hydrating } = useAuth();

  const [dashboardData, setDashboardData] = useState<ParentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirected, setRedirected] = useState(false);

  // Handle redirects
  useEffect(() => {
    if (authLoading || redirected) return;

    // Not logged in - go to landing
    if (!user) {
      setRedirected(true);
      navigate("/", { replace: true });
      return;
    }

    // This is a child - redirect to child area
    if (activeChildId) {
      setRedirected(true);
      navigate("/child/today", { replace: true });
      return;
    }
  }, [authLoading, user, activeChildId, navigate, redirected]);

  // Handle redirect to onboarding for parents with no children
  // IMPORTANT: Only redirect if parentChildCount is EXACTLY 0, not null
  // null means we're still loading the count
  useEffect(() => {
    if (authLoading || hydrating || redirected) return;
    if (!user || !profile) return;

    // Only redirect if we KNOW there are 0 children (not null/loading)
    if (parentChildCount === 0) {
      setRedirected(true);
      navigate("/parent/onboarding", { replace: true });
    }
  }, [authLoading, hydrating, user, profile, parentChildCount, navigate, redirected]);

  // Load dashboard data
  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      if (!user || !profile) return;

      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await fetchParentDashboard(user.id);

      if (!mounted) return;

      if (fetchError) {
        setError(fetchError);
        setDashboardData(null);
      } else {
        setDashboardData(data);
      }

      setLoading(false);
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [user, profile]);

  // Loading state - also wait for hydrating to complete
  if (authLoading || hydrating || loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-neutral-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading dashboard...</p>
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
            <p className="text-red-700 font-medium">Failed to load dashboard</p>
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

  // Get first name for greeting
  const firstName = profile.full_name?.split(" ")[0] || "there";

  return (
    <div className="min-h-[calc(100vh-73px)] bg-neutral-bg">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Here's how revision is going this week
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {/* TODO: Export report */}}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Report
            </button>
            <button
              onClick={() => navigate("/parent/onboarding")}
              className="px-4 py-2 bg-brand-purple text-white rounded-lg font-medium hover:opacity-95 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Child
            </button>
          </div>
        </div>

        {/* Children Cards */}
        {dashboardData && dashboardData.children.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Children</h2>
            <div className={`grid gap-6 ${
              dashboardData.children.length === 1 
                ? "grid-cols-1 max-w-lg" 
                : "grid-cols-1 md:grid-cols-2"
            }`}>
              {dashboardData.children.map((child) => (
                <ChildCard key={child.child_id} child={child} />
              ))}
            </div>
          </section>
        )}

        {/* Week Summary */}
        {dashboardData && (
          <section className="mb-8">
            <WeekSummary summary={dashboardData.week_summary} />
          </section>
        )}

        {/* Daily Activity Pattern */}
        {dashboardData && dashboardData.daily_pattern.length > 0 && (
          <section className="mb-8">
            <DailyActivityChart pattern={dashboardData.daily_pattern} />
          </section>
        )}

        {/* Two Column Layout: Reminders + Coming Up */}
        {dashboardData && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <GentleReminders reminders={dashboardData.gentle_reminders} />
            <ComingUpNext sessions={dashboardData.coming_up_next} />
          </section>
        )}

        {/* Subject Coverage */}
        {dashboardData && (
          <section className="mb-8">
            <SubjectCoverage coverage={dashboardData.subject_coverage} />
          </section>
        )}

        {/* Empty State - No Children */}
        {dashboardData && dashboardData.children.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No children set up yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Get started by adding your first child. You'll be able to set up their subjects, 
              schedule, and generate a personalised revision plan.
            </p>
            <button
              onClick={() => navigate("/parent/onboarding")}
              className="px-6 py-3 bg-brand-purple text-white rounded-xl font-medium hover:opacity-95"
            >
              Add Your First Child
            </button>
          </div>
        )}
      </div>
    </div>
  );
}