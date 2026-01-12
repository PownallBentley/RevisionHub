// src/components/parentOnboarding/steps/InviteChildStep.tsx

import { useState } from "react";
import type { ChildInviteCreateResult } from "../../../services/invitationService";

interface InviteChildStepProps {
  invite: ChildInviteCreateResult;
  childName: string;
  onDashboard: () => void;
  onSkip: () => void;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    } catch {
      return false;
    }
  }
}

export default function InviteChildStep({
  invite,
  childName,
  onDashboard,
  onSkip,
}: InviteChildStepProps) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const inviteUrl = `${window.location.origin}${invite.invitation_link}`;

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(inviteUrl);
    if (ok) {
      setCopied("link");
      setTimeout(() => setCopied(null), 3000);
    }
  };

  const handleCopyCode = async () => {
    const ok = await copyToClipboard(invite.invitation_code);
    if (ok) {
      setCopied("code");
      setTimeout(() => setCopied(null), 3000);
    }
  };

  const handleSendEmail = async () => {
    const trimmed = email.trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    
    if (!isValid) {
      setEmailError(true);
      setTimeout(() => setEmailError(false), 3000);
      return;
    }

    setSendingEmail(true);
    
    // Simulate sending - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSendingEmail(false);
    setEmailSent(true);
    
    setTimeout(() => {
      setEmailSent(false);
      setEmail("");
    }, 2000);
  };

  return (
    <div>
      {/* Success State */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-accent-green rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-check text-white text-2xl" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Plan created!</h2>
        <p className="text-neutral-500 leading-relaxed">
          {childName}'s revision plan is ready and waiting for them.
        </p>
      </div>

      {/* Invitation Section */}
      <div className="space-y-8">
        {/* Explanation */}
        <div className="bg-primary-50 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <i className="fa-solid fa-mobile-screen-button text-white text-sm" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">
                {childName} needs their own login
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                They'll use this to access their personalized sessions on the mobile app and track their progress.
              </p>
            </div>
          </div>
        </div>

        {/* Invitation Options */}
        <div className="space-y-6">
          {/* Invitation Link */}
          <div className="border border-neutral-200 rounded-xl p-6">
            <h4 className="font-semibold text-neutral-900 mb-3">Share invitation link</h4>
            <div className="flex gap-3">
              <div className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-600 font-mono break-all">
                {inviteUrl}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <i className={`fa-solid ${copied === "link" ? "fa-check" : "fa-copy"} text-sm`} />
                {copied === "link" ? "Copied!" : "Copy link"}
              </button>
            </div>
          </div>

          {/* Invitation Code */}
          <div className="border border-neutral-200 rounded-xl p-6">
            <h4 className="font-semibold text-neutral-900 mb-3">Share invitation code</h4>
            <div className="flex gap-3">
              <div className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-center">
                <span className="text-2xl font-bold text-primary-600 font-mono tracking-widest">
                  {invite.invitation_code}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <i className={`fa-solid ${copied === "code" ? "fa-check" : "fa-copy"} text-sm`} />
                {copied === "code" ? "Copied!" : "Copy code"}
              </button>
            </div>
          </div>

          {/* Email Invitation */}
          <div className="border border-neutral-200 rounded-xl p-6">
            <h4 className="font-semibold text-neutral-900 mb-3">Send invite by email</h4>
            <div className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendEmail()}
                placeholder={`${childName.toLowerCase()}@example.com`}
                className={`flex-1 px-4 py-3 border rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all ${
                  emailError ? "border-accent-red" : "border-neutral-200"
                }`}
              />
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-70"
              >
                {sendingEmail ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin text-sm" />
                    Sending...
                  </>
                ) : emailSent ? (
                  <>
                    <i className="fa-solid fa-check text-sm" />
                    Sent!
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane text-sm" />
                    Send invite
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-8 pt-6 border-t border-neutral-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-5 py-2.5 rounded-full font-medium text-primary-600 border border-primary-600 hover:bg-primary-50 transition-all text-sm"
          >
            Copy link
          </button>
          <button
            type="button"
            onClick={handleCopyCode}
            className="px-5 py-2.5 rounded-full font-medium text-primary-600 border border-primary-600 hover:bg-primary-50 transition-all text-sm"
          >
            Copy code
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-medium text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={onDashboard}
            className="px-8 py-3 rounded-full font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-sm hover:shadow-md"
          >
            Open dashboard
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      <div
        className={`fixed top-6 right-6 bg-neutral-900 text-white px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 z-50 ${
          copied ? "translate-x-0" : "translate-x-[calc(100%+24px)]"
        }`}
      >
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-check-circle text-accent-green" />
          <span className="font-medium">Copied to clipboard!</span>
        </div>
      </div>
    </div>
  );
}