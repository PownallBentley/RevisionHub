// src/components/gamification/SessionCompleteWithGamification.tsx

import { useState, useEffect } from "react";
import PointsDisplay from "./PointsDisplay";
import { StreakCelebration } from "./StreakCounter";
import AchievementUnlockModal from "./AchievementUnlockModal";
import type { SessionGamificationResult, NewlyEarnedAchievement } from "../../types/gamification";

type SessionCompleteWithGamificationProps = {
  subjectName: string;
  topicName: string;
  topicCount: number;
  gamification: SessionGamificationResult | null;
  onExit: () => void;
  onMarkAchievementsNotified?: () => void;
};

export default function SessionCompleteWithGamification({
  subjectName,
  topicName,
  topicCount,
  gamification,
  onExit,
  onMarkAchievementsNotified,
}: SessionCompleteWithGamificationProps) {
  const [showAchievements, setShowAchievements] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  const points = gamification?.points;
  const streak = gamification?.streak;
  const achievements = gamification?.achievements;

  const hasNewAchievements =
    achievements?.newly_earned && achievements.newly_earned.length > 0;

  // Show achievement modal after a short delay
  useEffect(() => {
    if (hasNewAchievements) {
      const timer = setTimeout(() => setShowAchievements(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [hasNewAchievements]);

  // Hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleCloseAchievements = () => {
    setShowAchievements(false);
    onMarkAchievementsNotified?.();
  };

  const isNewStreakRecord =
    streak && streak.current_streak === streak.longest_streak && streak.current_streak > 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-indigo-50 relative overflow-hidden">
      {/* Confetti animation */}
      {showConfetti && <ConfettiEffect />}

      {/* Main content */}
      <div className="max-w-lg mx-auto px-6 py-12">
        {/* Success icon */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-in">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">Well Done! 🎉</h1>
          <p className="text-xl text-gray-600">
            You completed your {subjectName} session
          </p>
          <p className="text-gray-500 mt-1">
            {topicCount > 1
              ? `${topicCount} topics covered`
              : topicName}
          </p>
        </div>

        {/* Gamification results */}
        {gamification && (
          <div className="space-y-4 mb-8">
            {/* Points earned card */}
            {points && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Points earned</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-amber-600">
                        +{points.points_awarded}
                      </span>
                      {points.focus_bonus > 0 && (
                        <span className="text-sm text-purple-600 font-medium">
                          (includes +{points.focus_bonus} focus bonus!)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-4xl">✨</div>
                </div>

                {/* New balance */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Total points</span>
                    <PointsDisplay
                      balance={points.new_balance}
                      lifetime={points.lifetime_points}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Streak card */}
            {streak && streak.current_streak > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <StreakCelebration
                  streak={streak.current_streak}
                  isNewRecord={isNewStreakRecord}
                />
              </div>
            )}

            {/* Achievement preview (if any unlocked) */}
            {hasNewAchievements && (
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white/80 text-sm mb-1">
                      Achievement{achievements.newly_earned.length > 1 ? "s" : ""} unlocked!
                    </div>
                    <div className="text-xl font-bold">
                      {achievements.newly_earned.length === 1
                        ? achievements.newly_earned[0].name
                        : `${achievements.newly_earned.length} new achievements`}
                    </div>
                  </div>
                  <div className="text-4xl">🏆</div>
                </div>
                <button
                  onClick={() => setShowAchievements(true)}
                  className="mt-4 w-full py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
                >
                  View {achievements.newly_earned.length > 1 ? "all" : "achievement"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Continue button */}
        <button
          onClick={onExit}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold text-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg"
        >
          Continue
        </button>

        {/* Motivational message */}
        <p className="text-center text-gray-500 mt-6 text-sm">
          Every session counts. You're building great habits! 💪
        </p>
      </div>

      {/* Achievement unlock modal */}
      {showAchievements && hasNewAchievements && (
        <AchievementUnlockModal
          achievements={achievements.newly_earned}
          onClose={handleCloseAchievements}
          onMarkNotified={onMarkAchievementsNotified}
        />
      )}
    </div>
  );
}

// Simple confetti effect
function ConfettiEffect() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-confetti-fall"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
            backgroundColor: [
              "#FFD700",
              "#FF6B6B",
              "#4ECDC4",
              "#A855F7",
              "#3B82F6",
              "#10B981",
              "#F59E0B",
            ][Math.floor(Math.random() * 7)],
          }}
        />
      ))}
    </div>
  );
}