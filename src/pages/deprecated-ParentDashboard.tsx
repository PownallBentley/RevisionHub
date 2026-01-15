// src/pages/ParentDashboard.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../contexts/AuthContext";
import { PageLayout } from "../components/layout";
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
  const { user, profile, activeChildId, parentChildCount, loading: authLoading } = useAuth();

  const [dashboardData, setDashboardData] = useState<ParentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirected, setRedirected] = useState(false);

  // Handle redirects
  useEffect(() => {
    if (authLoading || redirected) return;

    if (!user) {
      setRedirected(true);
      navigate("/", { replace: true });
      return;
    }

    if (activeChildId) {
      setRedirected(true);
      navigate("/child/today", { replace: true });
      return;
    }
  }, [authLoading, user, activeChildId, navigate, redirected]);

  // Handle redirect to onboarding for parents with no children
  useEffect(() => {
    if (authLoading || redirected) return;
    if (!user || !profile) return;

    if (parentChildCount === 0) {
      setRedirected(true);
      navigate("/parent/onboarding", { replace: true });
    }
  }, [authLoading, user, profile, parentChildCount, navigate, redirected]);

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

  // Loading state
  if (authLoading || loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-neutral-600">Loading dashboard...</p>
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
        <div className="max-w-[1120px] mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-accent-red font-medium">Failed to load dashboard</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-accent-red text-white rounded-lg hover:opacity-90"
            >
              Try Again
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Determine overall status
  const getOverallStatus = () => {
    if (!dashboardData || dashboardData.children.length === 0) {
      return { label: "Getting Started", color: "bg-primary-600" };
    }
    const needsAttention = dashboardData.children.some(
      (c) => c.week_sessions_completed < c.prev_week_sessions_completed
    );
    if (needsAttention) {
      return { label: "Needs Attention", color: "bg-accent-amber" };
    }
    return { label: "On Track", color: "bg-accent-green" };
  };

  const status = getOverallStatus();

  return (
    <PageLayout>
      <main className="max-w-[1120px] mx-auto px-6 py-8">
        {/* Hero Card */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl shadow-card p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-primary-900 mb-2">
                  Your family's revision at a glance
                </h1>
                <div className="flex items-center space-x-3">
                  <span className={`px-4 py-2 ${status.color} text-white rounded-full text-sm font-medium`}>
                    {status.label}
                  </span>
                  <span className="text-neutral-600">
                    {dashboardData && dashboardData.children.length > 0
                      ? "Your children are progressing well with their revision plans"
                      : "Set up your first child to get started"}
                  </span>
                </div>
              </div>
              <button className="text-neutral-400 hover:text-neutral-600">
                <FontAwesomeIcon icon={faEllipsis} className="text-lg" />
              </button>
            </div>

            {/* Summary Stats */}
            {dashboardData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-neutral-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary-600 mb-1">
                    {dashboardData.subject_coverage.length}
                  </div>
                  <div className="text-sm text-neutral-500">Active Subjects</div>
                </div>
                <div className="bg-neutral-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary-600 mb-1">
                    {dashboardData.week_summary.total_sessions_completed}
                  </div>
                  <div className="text-sm text-neutral-500">Weekly Sessions</div>
                </div>
                <div className="bg-neutral-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-accent-amber mb-1">
                    {dashboardData.coming_up_next.length}
                  </div>
                  <div className="text-sm text-neutral-500">Upcoming Sessions</div>
                </div>
                <div className="bg-neutral-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-accent-green mb-1">
                    {dashboardData.week_summary.days_active}/7
                  </div>
                  <div className="text-sm text-neutral-500">Days Active</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Children Cards */}
        {dashboardData && dashboardData.children.length > 0 && (
          <section className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dashboardData.children.map((child) => (
                <ChildCard key={child.child_id} child={child} />
              ))}
            </div>
          </section>
        )}

        {/* Activity Cards Grid */}
        {dashboardData && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* This Week's Activity */}
            <WeekSummary summary={dashboardData.week_summary} />
            
            {/* Coming Up Next */}
            <ComingUpNext sessions={dashboardData.coming_up_next} />
            
            {/* Gentle Reminders */}
            <GentleReminders reminders={dashboardData.gentle_reminders} />
          </section>
        )}

        {/* Daily Activity Pattern */}
        {dashboardData && dashboardData.daily_pattern.length > 0 && (
          <section className="mb-8">
            <DailyActivityChart pattern={dashboardData.daily_pattern} />
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
          <div className="bg-white rounded-2xl shadow-card p-8 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-primary-900 mb-2">
              No children set up yet
            </h3>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">
              Get started by adding your first child. You'll be able to set up their subjects, 
              schedule, and generate a personalised revision plan.
            </p>
            <button
              onClick={() => navigate("/parent/onboarding")}
              className="px-6 py-3 bg-primary-600 text-white rounded-full font-medium hover:bg-primary-700 transition-colors"
            >
              Add Your First Child
            </button>
          </div>
        )}
      </main>
    </PageLayout>
  );
}