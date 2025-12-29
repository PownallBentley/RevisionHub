// src/pages/Landing.tsx

import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";

export default function Landing() {
  return (
    <div className="bg-gradient-to-br from-brand-purple-light via-brand-purple to-brand-purple-dark min-h-[calc(100vh-73px)]">
      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="text-white">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Calm, confidence-building revision.
              <span className="block text-purple-100 mt-2">Built around your child.</span>
            </h1>

            <p className="text-purple-100 mt-5 max-w-xl">
              Create a realistic schedule, keep sessions short, and help your child show up each day without stress.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white text-brand-purple font-semibold hover:bg-purple-50"
              >
                Start as a parent
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/15"
              >
                I already have an account
              </Link>
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex items-start gap-3">
                <FontAwesomeIcon icon={faCheckCircle} className="text-white mt-1" />
                <p className="text-purple-100">Parents set the plan. Children simply follow today's sessions.</p>
              </div>
              <div className="flex items-start gap-3">
                <FontAwesomeIcon icon={faCheckCircle} className="text-white mt-1" />
                <p className="text-purple-100">Sessions pull the right topics automatically from your subject choices.</p>
              </div>
              <div className="flex items-start gap-3">
                <FontAwesomeIcon icon={faCheckCircle} className="text-white mt-1" />
                <p className="text-purple-100">Invite link for children at the end of onboarding.</p>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-7 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900">How it works</h2>
            <ol className="mt-4 space-y-3 text-gray-700 text-sm">
              <li>
                <span className="font-semibold">1)</span> Parent signs up and completes onboarding.
              </li>
              <li>
                <span className="font-semibold">2)</span> We generate a revision plan and today's sessions.
              </li>
              <li>
                <span className="font-semibold">3)</span> Parent invites the child with a secure code link.
              </li>
              <li>
                <span className="font-semibold">4)</span> Child sets a password and lands on "Today".
              </li>
            </ol>

            <div className="mt-6 flex gap-2">
              <Link
                to="/signup"
                className="flex-1 px-4 py-3 rounded-xl bg-brand-purple text-white font-semibold text-center hover:opacity-95"
              >
                Create parent account
              </Link>
              <Link
                to="/login"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-800 font-semibold text-center hover:bg-gray-50"
              >
                Log in
              </Link>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              RevisionHub — helping families prepare for exams with less stress.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 pb-8 text-purple-100 text-xs">
        © {new Date().getFullYear()} RevisionHub
      </footer>
    </div>
  );
}