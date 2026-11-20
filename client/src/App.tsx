import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Route-level code splitting: only the code for the visited route ships.
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Habits = lazy(() => import("./pages/Habits"));
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Manage = lazy(() => import("./pages/Manage"));
const NewHabit = lazy(() => import("./pages/NewHabit"));
const Register = lazy(() => import("./pages/Register"));
const Statistics = lazy(() => import("./pages/Statistics"));
const VerifyOtp = lazy(() => import("./pages/VerifyOtp"));

// Static skeleton shown while a route chunk downloads (matches the app's
// dark palette; respects prefers-reduced-motion via Tailwind's
// motion-safe: prefix below).
const RouteFallback = () => (
  <div className="min-h-svh bg-[#0a0a0a]" aria-hidden="true">
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-5 sm:py-8">
      <div className="h-8 w-40 animate-pulse rounded bg-[#1e1e1e] motion-reduce:animate-none" />
      <div className="mt-4 h-4 w-64 animate-pulse rounded bg-[#141414] motion-reduce:animate-none" />
      <div className="mt-8 space-y-2.5">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg border border-[#313131] bg-[#141414] motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/newhabit" element={<NewHabit />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/manage" element={<Manage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
