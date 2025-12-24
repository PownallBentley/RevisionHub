import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface SessionHeaderProps {
  subjectName: string;
  subjectIcon?: string;
  sessionInfo?: string;
  showBack?: boolean;
  showExit?: boolean;
  onExit?: () => void;
}

export default function SessionHeader({
  subjectName,
  subjectIcon,
  sessionInfo,
  showBack = false,
  showExit = false,
  onExit,
}: SessionHeaderProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const childName = profile?.preferred_name || profile?.first_name || profile?.full_name || profile?.email?.split("@")[0] || "Student";
  const avatarUrl = profile?.avatar_url;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {subjectIcon && (
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <span className="text-2xl">{subjectIcon}</span>
            </div>
          )}

          <div>
            <h1 className="text-lg font-semibold text-gray-900">{subjectName}</h1>
            {sessionInfo && <p className="text-sm text-gray-600">{sessionInfo}</p>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Help"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {showExit && (
            <button
              onClick={onExit || (() => navigate("/child/today"))}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Exit session
            </button>
          )}

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={childName}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                {childName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-medium text-gray-900">{childName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
