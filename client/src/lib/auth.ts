import { useEffect, useState } from "react";

export const TOKEN_STORAGE_KEY = "habitstreaks_token";
const AUTH_CHANGE_EVENT = "habitstreaks:authchange";

export interface AuthUser {
  userId: string | number;
  email: string;
  exp?: number;
}

function decodeTokenPayload(token: string): AuthUser | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      Math.ceil(normalized.length / 4) * 4,
      "=",
    );
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );

    return JSON.parse(json) as AuthUser;
  } catch {
    return null;
  }
}

export const getToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);

export const getAuthUser = (): AuthUser | null => {
  const token = getToken();
  if (!token) return null;

  const user = decodeTokenPayload(token);
  if (!user) return null;

  if (user.exp && user.exp * 1000 <= Date.now()) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }

  return user;
};

const notifyAuthChange = () => {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  notifyAuthChange();
};

export const clearToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  notifyAuthChange();
};

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(() => getAuthUser());

  useEffect(() => {
    const sync = () => setUser(getAuthUser());

    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return {
    user,
    isAuthenticated: Boolean(user),
    signOut: clearToken,
  };
};
