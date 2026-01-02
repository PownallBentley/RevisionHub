// src/components/dashboard/GentleReminders.tsx

import { useNavigate } from "react-router-dom";
import type { GentleReminder } from "../../types/parentDashboard";

interface GentleRemindersProps {
  reminders: GentleReminder[];
}

export default function GentleReminders({ reminders }: GentleRemindersProps) {
  const navigate = useNavigate();

  if (reminders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Gentle Reminders</h2>
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600">All caught up! No reminders right now.</p>
        </div>
      </div>
    );
  }

  // Get icon and colors based on reminder type
  const getReminderStyle = (type: GentleReminder["type"]) => {
    switch (type) {
      case "mocks_coming_up":
        return {
          icon: "📅",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-100",
          textColor: "text-orange-700",
          subtextColor: "text-orange-600",
        };
      case "topic_to_revisit":
        return {
          icon: "🔄",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-100",
          textColor: "text-blue-700",
          subtextColor: "text-blue-600",
        };
      case "building_momentum":
        return {
          icon: "🔥",
          bgColor: "bg-green-50",
          borderColor: "border-green-100",
          textColor: "text-green-700",
          subtextColor: "text-green-600",
        };
      case "subject_neglected":
        return {
          icon: "📚",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-100",
          textColor: "text-yellow-700",
          subtextColor: "text-yellow-600",
        };
      default:
        return {
          icon: "💡",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-100",
          textColor: "text-gray-700",
          subtextColor: "text-gray-600",
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Gentle Reminders</h2>
      <div className="space-y-3">
        {reminders.map((reminder, index) => {
          const style = getReminderStyle(reminder.type);
          
          return (
            <div
              key={`${reminder.type}-${reminder.child_id}-${index}`}
              className={`p-4 rounded-xl ${style.bgColor} border ${style.borderColor}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{style.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${style.textColor}`}>
                    {reminder.type === "mocks_coming_up" && "Mocks coming up"}
                    {reminder.type === "topic_to_revisit" && "Topic to revisit"}
                    {reminder.type === "building_momentum" && "Building momentum"}
                    {reminder.type === "subject_neglected" && "Subject needs attention"}
                  </p>
                  <p className={`text-sm ${style.subtextColor} mt-0.5`}>
                    {reminder.message}
                  </p>
                  {reminder.action_label && reminder.action_route && (
                    <button
                      onClick={() => navigate(reminder.action_route!)}
                      className={`text-sm font-medium ${style.textColor} mt-2 flex items-center gap-1 hover:underline`}
                    >
                      {reminder.action_label}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}