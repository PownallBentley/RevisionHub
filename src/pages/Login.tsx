// src/pages/Login.tsx

import { useState, type FormEvent, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookOpen } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        setError(error.message ?? "Login failed");
        setSubmitting(false);
        return;
      }

      // signIn now sets user/session state directly
      // Navigate to home gate which will route based on role
      // Use setTimeout to ensure React has processed the state update
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 0);
    } catch (e: any) {
      setError(e?.message ?? "Login failed");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gradient-to-br from-brand-purple-light via-brand-purple to-brand-purple-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-white rounded-2xl items-center justify-center mb-4 shadow-lg">
            <FontAwesomeIcon
              icon={faBookOpen}
              className="text-brand-purple text-2xl"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">RevisionHub</h1>
          <p className="text-purple-100">
            Calm, confidence-building revision for your children
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome back</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                autoComplete="email"
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
                autoComplete="current-password"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-purple focus:border-transparent outline-none transition-all"
                placeholder="Enter your password"
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-purple text-white py-3 px-6 rounded-xl font-semibold hover:bg-brand-purple-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="text-brand-purple font-semibold hover:text-brand-purple-dark"
            >
              Sign up
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