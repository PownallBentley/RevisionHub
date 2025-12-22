import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPlay } from '@fortawesome/free-solid-svg-icons';

export default function SessionOverview() {
  const { plannedSessionId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-bg p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/child/today')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Back to Today
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Session Overview</h1>
          <p className="text-gray-600 mb-6">Session ID: {plannedSessionId}</p>

          <button
            onClick={() => navigate(`/child/session/${plannedSessionId}/run`)}
            className="w-full bg-brand-purple text-white py-4 px-6 rounded-xl font-semibold hover:bg-brand-purple-dark transition-colors flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faPlay} className="mr-2" />
            Start Session
          </button>
        </div>
      </div>
    </div>
  );
}
