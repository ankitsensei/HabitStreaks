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
 <div className="flex items-start gap-2.5 rounded-lg bg-[#141414] px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-white ring-1 ring-[#454545]">
 <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
 <span>{error}</span>
 </div>
 <Link
 to="/login"
 className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-[14.5px] font-medium text-[#0a0a0a] transition hover:bg-[#d4d4d4] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
 >
 Back to sign in
 </Link>
 </div>
 ) : (
 <div className="flex flex-col items-center gap-4 py-16 text-center">
 <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#0a0a0a]">
 <GoogleIcon className="h-6 w-6" />
 </span>
 <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#313131] border-t-[#6798ff]" />
 <p className="text-[14px] font-medium text-[#a7a7a7]">
 Signing you in with Google…
 </p>
 </div>
 )}
 </AuthShell>
 );
};

export default AuthCallback;
