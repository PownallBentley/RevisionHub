// src/pages/child/ChildSignUp.tsx

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookOpen, faSpinner, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { rpcGetInvitePreview, rpcAcceptInvite, signUpChild } from "../../services/invitationService";
import { useAuth } from "../../contexts/AuthContext";

type InvitationPreviewState = {
  parent_name: string;
  child_name: string;
};

export default function ChildSignUp() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [searchParams] = useSearchParams();
  const code = (searchParams.get("code") || "").trim();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [invitation, setInvitation] = useState<InvitationPreviewState | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setError("");
      setLoading(true);

      if (!code) {
        if (!mounted) return;
        setError("No invitation code provided");
        setInvitation(null);
        setLoading(false);
        return;
      }

      try {
        const preview = await rpcGetInvitePreview(code);
        if (!preview.ok) {
          setError("Invalid or expired invitation code");
          setInvitation(null);
        } else {
          setInvitation({
            parent_name: (preview as any).parent_name || "Your parent",
            child_name: (preview as any).child_first_name || "Student",
          });
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load invitation");
        setInvitation(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [code]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Please enter your email address");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      // 1) Create auth account (and ensure we have a session)
      const signUpResult = await signUpChild(trimmedEmail, password);
      if (!signUpResult.ok) {
        setError(signUpResult.error || "Failed to create account");
        setSubmitting(false);
        return;
      }

      // 2) Link this auth user to the child row via invite code
      const accept = await rpcAcceptInvite(code);
      if (!accept.ok) {
        setError(accept.error || "Failed to link invitation");
        setSubmitting(false);
        return;
      }

      // 3) Refresh AuthContext so child flags resolve
      await refresh();

      // 4) Go to child area
      navigate("/child/today", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Failed to create account");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-bg flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="text-calm-purple text-4xl animate-spin mb-4" />
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-neutral-bg flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/", { replace: true })}
            className="bg-calm-purple hover:bg-calm-purple-dark text-white font-medium py-3 px-6 rounded-xl transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!invitation) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-calm-purple to-calm-purple-dark flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-calm-purple rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faBookOpen} className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to RevisionHub</h1>
          <p className="text-gray-600">{invitation.parent_name} has invited you to start your revision journey</p>
        </div>

        <div className="bg-soft-green bg-opacity-10 border border-soft-green rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <FontAwesomeIcon icon={faCheckCircle} className="text-soft-green text-xl mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-800 mb-1">Account for: {invitation.child_name}</p>
              <p className="text-sm text-gray-600">Use your email address to create a login</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-calm-purple focus:border-transparent transition"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Create password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-calm-purple focus:border-transparent transition"
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-calm-purple focus:border-transparent transition"
              placeholder="Re-enter your password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-calm-purple hover:bg-calm-purple-dark text-white font-medium py-3 px-6 rounded-xl transition duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {submitting ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                <span>Creating account...</span>
              </>
            ) : (
              "Create account and start"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">By creating an account, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}
