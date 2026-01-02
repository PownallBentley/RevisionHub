// src/pages/child/Today.tsx
// Refactored with gamification support (v3.3)

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { fetchTodayData } from "../../services/todayService";
import {
  TodayHeader,
  TodayProgressCard,
  SessionList,
  UpcomingSection,
  EmptyState,
  LoadingState,
  ErrorState,
} from "../../components/child/today";
import type { TodayData } from "../../types/today";

export default function Today() {
  const navigate = useNavigate();
  const { user, activeChildId, isParent, profile, loading: authLoading } = useAuth();

  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [redirected, setRedirected] = useState(false);

  const childId = useMemo(() => {
    if (activeChildId) return activeChildId;
    const ls = localStorage.getItem("active_child_id");
    return ls || null;
  }, [activeChildId]);

  const childName =
    profile?.preferred_name ||
    profile?.first_name ||
    profile?.full_name?.split(" ")[0] ||
    "there";

  // Handle redirects
  useEffect(() => {
    if (authLoading || redirected) return;
    if (isParent) {
      setRedirected(true);
      navigate("/parent", { replace: true });
    }
  }, [authLoading, isParent, navigate, redirected]);

  // Load data
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      if (authLoading) return;

      if (!childId) {
        setData(null);
        if (user) {
          setError("Loading your profile...");
        } else {
          setError("Please log in to see your sessions.");
        }
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const result = await fetchTodayData(childId);

      if (!mounted) return;

      if (result.error) {
        setError(result.error);
        setData(null);
      } else {
        setData(result.data);
        setError("");
      }

      setLoading(false);
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [authLoading, user, childId]);

  const handleStartSession = (plannedSessionId: string) => {
    navigate(`/child/session/${plannedSessionId}`);
  };

  // Extract data for rendering
  const todaySessions = data?.todaySessions ?? [];
  const upcomingDays = data?.upcomingDays ?? [];
  const gamification = data?.gamification ?? null;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header with gamification badges */}
        <TodayHeader childName={childName} gamification={gamification} />

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : todaySessions.length === 0 ? (
          <EmptyState upcomingDays={upcomingDays} gamification={gamification} />
        ) : (
          <>
            {/* Progress card with achievement teaser */}
            <TodayProgressCard
              sessions={todaySessions}
              gamification={gamification}
            />

            {/* Session list */}
            <SessionList
              sessions={todaySessions}
              onStartSession={handleStartSession}
            />

            {/* Upcoming section */}
            <UpcomingSection upcomingDays={upcomingDays} />
          </>
        )}
      </div>
    </div>
  );
}