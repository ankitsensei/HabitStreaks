import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell";
import { AlertIcon, GoogleIcon } from "../components/Icons";
import { googleAuth } from "../lib/api";
import { setToken } from "../lib/auth";
import { AUTH_STATE_KEY } from "../lib/google";

// Auth0 lands here with ?code=...&state=... after the Google consent screen.
// The state must match what we stored before redirecting (CSRF check), then
// the code goes to the backend, which swaps it for an app session token.
const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    // Guards against React StrictMode running the effect twice — the code is
    // one-time use, so a second attempt would fail.
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    const finishSignIn = async () => {
      const authError = searchParams.get("error");
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const expectedState = sessionStorage.getItem(AUTH_STATE_KEY);
      sessionStorage.removeItem(AUTH_STATE_KEY);

      if (authError) {
        setError(
          authError === "access_denied"
            ? "Google sign-in was cancelled. You can try again whenever you're ready."
            : "Google sign-in failed before reaching the app. Please try again.",
        );
        return;
      }

      if (!code || !state || state !== expectedState) {
        setError(
          "This sign-in link isn't valid anymore. Please start again from the sign-in page.",
        );
        return;
      }

      try {
        const result = await googleAuth(
          code,
          `${window.location.origin}/auth/callback`,
        );
        setToken(result.token);
        navigate("/", { replace: true });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
        );
      }
    };

    void finishSignIn();
  }, [navigate, searchParams]);

  return (
    <AuthShell>
      {error ? (
        <div className="animate-fade-up">
          <div className="flex items-start gap-2.5 rounded-xl bg-[#FF453A]/10 px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-[#FF6961] ring-1 ring-[#FF453A]/25">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Link
            to="/login"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#0A84FF] px-4 py-3 text-[14.5px] font-semibold text-white shadow-[0_0_24px_rgba(10,132,255,0.35)] transition hover:bg-[#3395FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/60"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.06] ring-1 ring-white/[0.08]">
            <GoogleIcon className="h-6 w-6" />
          </span>
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-[#0A84FF]" />
          <p className="text-[14px] font-medium text-[rgba(235,235,245,0.7)]">
            Signing you in with Google…
          </p>
        </div>
      )}
    </AuthShell>
  );
};

export default AuthCallback;
