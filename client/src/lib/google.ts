// Shared Google sign-in via Auth0 (used by both Login and Register).
//
// Sends the browser to Auth0's hosted Google page. Auth0 returns the user to
// /auth/callback with a one-time code and the state we stored below; the
// callback page sends the code to POST /api/auth/google, where the backend
// swaps it for tokens and issues the app session. Returns false when the
// env vars are missing so callers can show a "not configured" notice.

export const AUTH_STATE_KEY = "auth0_oauth_state";

export const redirectToGoogleSignIn = (): boolean => {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

  if (!domain || !clientId) {
    return false;
  }

  const state = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  sessionStorage.setItem(AUTH_STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${window.location.origin}/auth/callback`,
    response_type: "code",
    scope: "openid profile email",
    // Straight to Google's consent screen instead of the Auth0 lock screen.
    connection: "google-oauth2",
    state,
  });

  window.location.assign(`https://${domain}/authorize?${params.toString()}`);
  return true;
};
