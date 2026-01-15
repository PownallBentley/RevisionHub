// src/pages/parent/ParentDashboardV2.tsx
// Parent Dashboard v2 - Multi-child family dashboard (FEAT-009)

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getParentDashboard } from "../../services/parent/parentDashboardService";
import { HeroStatusBanner } from "../../components/parent/dashboard/HeroStatusBanner";
import { ChildHealthCardGrid } from "../../components/parent/dashboard/ChildHealthCardGrid";
import { WeeklyFocusStrip } from "../../components/parent/dashboard/WeeklyFocusStrip";
import { ComingUpCard } from "../../components/parent/dashboard/ComingUpCard";
import { ProgressMomentsCard } from "../../components/parent/dashboard/ProgressMomentsCard";
import { SupportTipCard } from "../../components/parent/dashboard/SupportTipCard";
import { QuickActionsSection } from "../../components/parent/dashboard/QuickActionsSection";
import { FamilyOverviewCard } from "../../components/parent/dashboard/FamilyOverviewCard";
import { WeeklyRhythmChart } from "../../components/parent/dashboard/WeeklyRhythmChart";
import { ResourcesSection } from "../../components/parent/dashboard/ResourcesSection";
import type { ParentDashboardData } from "../../types/parent/parentDashboardTypes";

function HeroSkeleton() {
  return (
    <div className="bg-gradient-to-br from-primary-50 via-primary-100/50 to-neutral-0 rounded-2xl shadow-card p-8 border border-primary-200/30 animate-pulse mb-10">
      <div className="h-8 bg-primary-200/50 rounded w-2/3 mb-4"></div>
      <div className="h-4 bg-primary-200/30 rounded w-1/2 mb-6"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-neutral-0 rounded-xl p-5 h-28"></div>
        ))}
      </div>
    </div>
  );
}

function ChildCardsSkeleton() {
  return (
    <div className="mb-10">
      <div className="h-8 bg-neutral-200 rounded w-48 mb-6"></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-neutral-0 rounded-2xl shadow-card p-6 border border-neutral-200/50 animate-pulse">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-neutral-200"></div>
              <div>
                <div className="h-6 bg-neutral-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-neutral-100 rounded w-24"></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[1, 2, 3].map((j) => (
                <div key={j} className="bg-neutral-100 rounded-xl p-4 h-20"></div>
              ))}
            </div>
            <div className="bg-neutral-100 rounded-xl p-4 h-16 mb-5"></div>
            <div className="bg-neutral-200 rounded-xl h-12"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-accent-red/5 border border-accent-red/20 rounded-2xl p-8 text-center">
      <div className="w-16 h-16 bg-accent-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <i className="fa-solid fa-exclamation-triangle text-accent-red text-2xl"></i>
      </div>
      <h3 className="text-lg font-bold text-primary-900 mb-2">Something went wrong</h3>
      <p className="text-neutral-600 mb-4">{message}</p>
      <button 
        onClick={onRetry}
        className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

export function ParentDashboardV2() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [data, setData] = useState<ParentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to navigate and scroll to top
  const navigateWithScroll = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const dashboardData = await getParentDashboard();
      setData(dashboardData);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Navigation handlers - all use navigateWithScroll
  const handleViewTodaySessions = () => {
    const today = new Date().toISOString().split('T')[0];
    navigateWithScroll(`/parent/timetable?date=${today}`);
  };

  const handleViewInsights = () => {
    navigateWithScroll("/parent/insights");
  };

  const handleGoToToday = (childId: string) => {
    const today = new Date().toISOString().split('T')[0];
    navigateWithScroll(`/parent/timetable?date=${today}&child=${childId}`);
  };

  const handleViewChildInsights = (childId: string) => {
    navigateWithScroll(`/parent/insights?child=${childId}`);
  };

  const handleViewFullSchedule = () => {
    navigateWithScroll("/parent/timetable");
  };

  const handleSeeWhy = () => {
    navigateWithScroll("/parent/insights");
  };

  const handleViewDetailedBreakdown = () => {
    navigateWithScroll("/parent/insights");
  };

  const handleAddChild = () => {
    // Navigate to onboarding page to add a new child
    navigateWithScroll("/parent/onboarding?mode=add-child");
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-content mx-auto px-6 py-8">
        <HeroSkeleton />
        <ChildCardsSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-content mx-auto px-6 py-8">
        <ErrorState message={error} onRetry={fetchData} />
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="max-w-content mx-auto px-6 py-8">
        <ErrorState message="No data available" onRetry={fetchData} />
      </div>
    );
  }

  return (
    <main className="max-w-content mx-auto px-6 py-8">
      {/* Hero Status Banner (includes nudges as 4th card + Add Child button) */}
      <HeroStatusBanner
        weekSummary={data.week_summary}
        comingUpCount={data.coming_up_next.length}
        onViewTodaySessions={handleViewTodaySessions}
        onViewInsights={handleViewInsights}
        reminders={data.gentle_reminders}
        onAddChild={handleAddChild}
      />

      {/* Child Health Cards */}
      <ChildHealthCardGrid
        children={data.children}
        onGoToToday={handleGoToToday}
        onViewInsights={handleViewChildInsights}
      />

      {/* Quick Actions (moved up) */}
      <QuickActionsSection />

      {/* Two-column layout for cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Left column */}
        <div className="space-y-6">
          <ComingUpCard
            sessions={data.coming_up_next}
            onViewFullSchedule={handleViewFullSchedule}
          />
          <ProgressMomentsCard moments={data.progress_moments} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <FamilyOverviewCard
            weekSummary={data.week_summary}
            subjectCoverage={data.subject_coverage}
            childrenCount={data.children.length}
          />
          <SupportTipCard />
        </div>
      </div>

      {/* Weekly Focus Strip (moved down) */}
      {data.daily_pattern.length > 0 && (
        <WeeklyFocusStrip
          dailyPattern={data.daily_pattern}
          onSeeWhy={handleSeeWhy}
        />
      )}

      {/* Weekly Rhythm Chart */}
      <div className="mb-10">
        <WeeklyRhythmChart
          dailyPattern={data.daily_pattern}
          onViewDetailedBreakdown={handleViewDetailedBreakdown}
        />
      </div>

      {/* Resources */}
      <ResourcesSection />
    </main>
  );
}

export default ParentDashboardV2;