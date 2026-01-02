// src/components/gamification/AchievementUnlockModal.tsx

import { useState, useEffect } from "react";
import { getAchievementIcon } from "../../services/gamificationService";
import type { NewlyEarnedAchievement } from "../../types/gamification";

type AchievementUnlockModalProps = {
  achievements: NewlyEarnedAchievement[];
  onClose: () => void;
  onMarkNotified?: () => void;
};

export default function AchievementUnlockModal({
  achievements,
  onClose,
  onMarkNotified,
}: AchievementUnlockModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  const currentAchievement = achievements[currentIndex];
  const hasMore = currentIndex < achievements.length - 1;
  const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0);

  useEffect(() => {
    // Reset animation when changing achievement
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 600);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const handleNext = () => {
    if (hasMore) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onMarkNotified?.();
      onClose();
    }
  };

  if (!currentAchievement) return null;

  const icon = getAchievementIcon(currentAchievement.icon);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Confetti background effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-confetti-1" />
          <div className="absolute top-0 left-1/2 w-2 h-2 bg-purple-400 rounded-full animate-confetti-2" />
          <div className="absolute top-0 left-3/4 w-2 h-2 bg-green-400 rounded-full animate-confetti-3" />
          <div className="absolute top-0 left-1/3 w-2 h-2 bg-pink-400 rounded-full animate-confetti-4" />
          <div className="absolute top-0 left-2/3 w-2 h-2 bg-blue-400 rounded-full animate-confetti-5" />
        </div>

        {/* Header gradient */}
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-6 pt-8 pb-16 text-center">
          <div className="text-white/80 text-sm font-medium mb-2">
            🎉 Achievement Unlocked!
          </div>
          {achievements.length > 1 && (
            <div className="text-white/60 text-xs">
              {currentIndex + 1} of {achievements.length}
            </div>
          )}
        </div>

        {/* Achievement card */}
        <div className="px-6 -mt-12 pb-6">
          <div
            className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center ${
              isAnimating ? "animate-achievement-pop" : ""
            }`}
          >
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
              {icon}
            </div>

            {/* Name */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {currentAchievement.name}
            </h3>

            {/* Description */}
            <p className="text-gray-600 mb-4">{currentAchievement.description}</p>

            {/* Points earned */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full">
              <span className="text-amber-500">✦</span>
              <span className="font-bold text-amber-700">
                +{currentAchievement.points} points
              </span>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleNext}
            className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
          >
            {hasMore ? "Next Achievement" : "Awesome!"}
          </button>

          {/* Total points if multiple */}
          {achievements.length > 1 && currentIndex === achievements.length - 1 && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Total earned: <span className="font-semibold text-amber-600">+{totalPoints} points</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Single achievement badge (for lists)
export function AchievementBadge({
  name,
  icon,
  earned,
}: {
  name: string;
  icon: string;
  earned?: boolean;
}) {
  const iconEmoji = getAchievementIcon(icon);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
        earned
          ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200"
          : "bg-gray-50 border-gray-200 opacity-50"
      }`}
    >
      <span className="text-2xl">{iconEmoji}</span>
      <span className={`font-medium ${earned ? "text-gray-900" : "text-gray-500"}`}>
        {name}
      </span>
      {earned && <span className="ml-auto text-green-500">✓</span>}
    </div>
  );
}