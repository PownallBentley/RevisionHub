import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen } from '@fortawesome/free-solid-svg-icons';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-purple-light via-brand-purple to-brand-purple-dark">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex w-20 h-20 bg-white rounded-2xl items-center justify-center mb-6 shadow-2xl">
            <FontAwesomeIcon icon={faBookOpen} className="text-brand-purple text-3xl" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">RevisionHub</h1>
          <p className="text-xl text-purple-100 mb-8">
            Calm, confidence-building revision for your children
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-white text-brand-purple px-8 py-4 rounded-xl font-semibold hover:bg-purple-50 transition-colors shadow-lg"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-brand-purple transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
