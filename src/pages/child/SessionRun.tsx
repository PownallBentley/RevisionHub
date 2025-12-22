import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

export default function SessionRun() {
  const { plannedSessionId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-bg p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Running Session</h1>
          <p className="text-gray-600 mb-6">Session ID: {plannedSessionId}</p>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 mr-2" />
              <span className="text-green-800">Session in progress...</span>
            </div>

            <button
              onClick={() => navigate('/child/today')}
              className="w-full bg-brand-purple text-white py-4 px-6 rounded-xl font-semibold hover:bg-brand-purple-dark transition-colors"
            >
              Complete Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
