import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen } from '@fortawesome/free-solid-svg-icons';

export default function ParentOnboardingPage() {
  const navigate = useNavigate();
  const [childName, setChildName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      navigate('/parent');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-neutral-bg p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-brand-purple rounded-2xl items-center justify-center mb-4 shadow-lg">
            <FontAwesomeIcon icon={faBookOpen} className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Set up your child's revision plan</h1>
          <p className="text-gray-600">A few steps. You can change things later.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="childName" className="block text-sm font-medium text-gray-700 mb-2">
                Child's name
              </label>
              <input
                id="childName"
                type="text"
                required
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-purple focus:border-transparent outline-none transition-all"
                placeholder="Enter your child's name"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-purple text-white py-3 px-6 rounded-xl font-semibold hover:bg-brand-purple-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting up...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
