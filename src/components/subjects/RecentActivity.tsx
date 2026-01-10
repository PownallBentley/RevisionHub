// src/components/subjects/RecentActivity.tsx

import type { SubjectProgress } from "../../types/subjectProgress";

interface RecentActivityProps {
  subjects: SubjectProgress[];
}

export default function RecentActivity({ subjects }: RecentActivityProps) {
  // Gather recent activities from all subjects
  const activities: Array<{
    id: string;
    type: "completed" | "submitted" | "needs_practice";
    subject: string;
    topic: string;
    color: string;
    timeAgo: string;
  }> = [];

  subjects.forEach((subject) => {
    // Add recently covered topics as "completed" activities
    subject.recently_covered.slice(0, 1).forEach((topic) => {
      activities.push({
        id: `${subject.subject_id}-${topic.topic_id}`,
        type: "completed",
        subject: subject.subject_name,
        topic: topic.topic_name,
        color: subject.subject_color,
        timeAgo: formatDaysAgo(topic.days_since),
      });
    });
  });

  // Add some placeholder activities if we don't have enough
  if (activities.length < 3) {
    subjects.forEach((subject) => {
      if (subject.completion_percentage < 50 && activities.length < 3) {
        activities.push({
          id: `${subject.subject_id}-practice`,
          type: "needs_practice",
          subject: subject.subject_name,
          topic: subject.coming_up[0]?.topic_name || "upcoming topics",
          color: subject.subject_color,
          timeAgo: "soon",
        });
      }
    });
  }

  // Sort by most recent first and take top 3
  const recentActivities = activities.slice(0, 3);

  if (recentActivities.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <h3 className="text-lg font-semibold text-neutral-700 mb-4">Recent Activity</h3>
        <p className="text-sm text-neutral-500 text-center py-4">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6">
      <h3 className="text-lg font-semibold text-neutral-700 mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {recentActivities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div
              className="w-2 h-2 rounded-full mt-2"
              style={{ backgroundColor: getActivityColor(activity.type, activity.color) }}
            />
            <div>
              <div className="text-sm font-medium text-neutral-700">
                {getActivityTitle(activity.type, activity.subject)}
              </div>
              <div className="text-xs text-neutral-500">
                {activity.topic} • {activity.timeAgo}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDaysAgo(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  return `${Math.floor(days / 7)} weeks ago`;
}

function getActivityColor(type: string, subjectColor: string): string {
  switch (type) {
    case "completed":
      return "#1EC592"; // accent-green
    case "submitted":
      return "#5B2CFF"; // primary-600
    case "needs_practice":
      return "#FFB547"; // accent-amber
    default:
      return subjectColor;
  }
}

function getActivityTitle(type: string, subject: string): string {
  switch (type) {
    case "completed":
      return `${subject} session completed`;
    case "submitted":
      return `${subject} work submitted`;
    case "needs_practice":
      return `${subject} practice needed`;
    default:
      return `${subject} activity`;
  }
}