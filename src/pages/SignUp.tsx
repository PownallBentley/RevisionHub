// src/pages/SignUp.tsx

import { useState, type FormEvent, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookOpen } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../contexts/AuthContext";

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Sign up timed out")), ms)
    ),
  ]);
}

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const result = await withTimeout(
        signUp(email.trim().toLowerCase(), password, fullName.trim()),
        8000
      );

      if (result?.error) {
        setError(result.error.message ?? "Sign up failed");
        setSubmitting(false);
        return;
      }

      // signUp now updates auth state immediately, so we can navigate directly
      navigate("/parent/onboarding", { replace: true });
    } catch (e: any) {
      setError(e?.message ?? "Sign up failed");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-purple-light via-brand-purple to-brand-purple-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-white rounded-2xl items-center justify-center mb-4 shadow-lg">
            <FontAwesomeIcon icon={faBookOpen} className="text-brand-purple text-2xl" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">RevisionHub</h1>
          <p className="text-purple-100">
            Calm, confidence-building revision for your children
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Create your parent account
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFullName(e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-purple focus:border-transparent outline-none transition-all"
                placeholder="Jane Smith"
                disabled={submitting}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-purple focus:border-transparent outline-none transition-all"
                placeholder="you@example.com"
                disabled={submitting}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-purple focus:border-transparent outline-none transition-all"
                placeholder="At least 6 characters"
                disabled={submitting}
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-purple text-white py-3 px-6 rounded-xl font-semibold hover:bg-brand-purple-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-brand-purple font-semibold hover:text-brand-purple-dark"
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-purple-100 text-sm mt-6">
          Parent-led, child-used revision planning
        </p>
      </div>
    </div>
  );
}