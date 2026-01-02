// src/components/child/today/UpcomingSection.tsx

import UpcomingDayCard from "./UpcomingDayCard";
import type { UpcomingDay } from "../../../types/today";

type UpcomingSectionProps = {
  upcomingDays: UpcomingDay[];
};

export default function UpcomingSection({ upcomingDays }: UpcomingSectionProps) {
  if (upcomingDays.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Coming up</h2>
      <div className="space-y-4">
        {upcomingDays.map((day) => (
          <UpcomingDayCard key={day.date} day={day} />
        ))}
      </div>
    </div>
  );
}