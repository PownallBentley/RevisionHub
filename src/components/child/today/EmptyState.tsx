// src/components/child/today/EmptyState.tsx

import UpcomingSection from "./UpcomingSection";
import type { UpcomingDay } from "../../../types/today";
import type { ChildGamificationData } from "../../../types/today";
import { getStreakMessage } from "../../../services/gamificationService";

type EmptyStateProps = {
  upcomingDays: UpcomingDay[];
  gamification: ChildGamificationData | null;
};

export default function EmptyState({ upcomingDays, gamification }: EmptyStateProps) {
  const streak = gamification?.streak;
  const hasStreak = streak && streak.current > 0;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          You're all done for today!
        </h3>
        <p className="text-gray-600">No sessions scheduled. Enjoy your break! 🎉</p>

        {/* Streak encouragement */}
        {hasStreak && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full">
              <span className="text-2xl">🔥</span>
              <span className="text-orange-700 font-medium">
                {getStreakMessage(streak.current)}
              </span>
            </div>
          </div>
        )}
      </div>

      <UpcomingSection upcomingDays={upcomingDays} />
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-600">Loading your sessions...</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-6 h-6 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <p className="text-red-700 font-medium mb-1">Something went wrong</p>
      <p className="text-sm text-red-600">{message}</p>
    </div>
  );
}