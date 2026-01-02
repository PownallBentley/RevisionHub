// src/components/child/today/SessionList.tsx

import SessionCard from "./SessionCard";
import type { SessionRow } from "../../../types/today";

type SessionListProps = {
  sessions: SessionRow[];
  onStartSession: (plannedSessionId: string) => void;
};

export default function SessionList({ sessions, onStartSession }: SessionListProps) {
  // Determine which session can be started (first non-completed)
  const nextSessionIndex = sessions.findIndex((s) => s.status !== "completed");

  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Your sessions</h2>
      <div className="space-y-4">
        {sessions.map((session, idx) => (
          <SessionCard
            key={session.planned_session_id}
            session={session}
            sessionNumber={idx + 1}
            isNext={idx === nextSessionIndex}
            isLocked={idx > nextSessionIndex && nextSessionIndex >= 0}
            onStart={() => onStartSession(session.planned_session_id)}
          />
        ))}
      </div>
    </div>
  );
}