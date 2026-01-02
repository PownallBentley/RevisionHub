// src/components/child/today/TodayHeader.tsx

import { formatDateLong, todayIsoDate } from "../../../utils/dateUtils";
import GamificationBar from "./GamificationBar";
import type { ChildGamificationData } from "../../../types/today";

type TodayHeaderProps = {
  childName: string;
  gamification: ChildGamificationData | null;
};

export default function TodayHeader({ childName, gamification }: TodayHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Hey {childName} 👋
          </h1>
          <p className="text-gray-600">{formatDateLong(todayIsoDate())}</p>
        </div>

        {/* Gamification badges */}
        {gamification && <GamificationBar gamification={gamification} />}
      </div>
    </div>
  );
}