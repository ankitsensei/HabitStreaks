import type { ReactNode } from "react";
import { ChartIcon, FlameIcon, ShieldIcon, SparkIcon } from "../Icons";

const features = [
  {
    icon: FlameIcon,
    title: "Keep your streak alive",
    description: "Daily check-ins that make consistency feel effortless.",
  },
  {
    icon: ChartIcon,
    title: "See real progress",
    description: "Monthly and yearly reports that actually motivate you.",
  },
  {
    icon: ShieldIcon,
    title: "Private by default",
    description: "Your habit data belongs to you and nobody else.",
  },
];

const streakDays = [
  1, 1, 1, 0, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 0, 1, 1,
  1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1,
];

const BrandMark = ({ compact = false }: { compact?: boolean }) => (
  <div className="flex items-center gap-2.5">
    <span
      className={`grid place-items-center rounded-[12px] bg-[#0A84FF] text-white shadow-[0_0_24px_rgba(10,132,255,0.45)] ${
        compact ? "h-9 w-9" : "h-10 w-10"
      }`}
    >
      <FlameIcon className={compact ? "h-[18px] w-[18px]" : "h-5 w-5"} />
    </span>
    <span
      className={`font-semibold tracking-tight ${
        compact ? "text-[16px] text-[#f5f5f7]" : "text-[17px] text-white"
      }`}
    >
      HabitStreaks
    </span>
  </div>
);

interface AuthShellProps {
  children: ReactNode;
}

const AuthShell = ({ children }: AuthShellProps) => {
  return (
    <div className="relative min-h-svh overflow-hidden bg-black px-3 py-3 sm:px-5 sm:py-5">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#0A84FF]/20 blur-[130px]" />
        <div className="absolute -bottom-40 right-0 h-[480px] w-[480px] rounded-full bg-[#BF5AF2]/10 blur-[130px]" />
      </div>

      <main className="relative mx-auto flex min-h-[calc(100svh-1.5rem)] w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#1c1c1e]/80 shadow-[0_40px_90px_-45px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:min-h-[calc(100svh-2.5rem)]">
        <aside className="relative hidden w-[46%] max-w-[540px] shrink-0 flex-col overflow-hidden bg-[#141416] p-10 lg:flex xl:p-12">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#0A84FF]/25 blur-3xl" />
            <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-[#BF5AF2]/15 blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-1 flex-col">
            <BrandMark />

            <div className="mt-14">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-[11px] font-medium tracking-wide text-[rgba(235,235,245,0.7)] backdrop-blur">
                <SparkIcon className="h-3.5 w-3.5 text-[#FF9F0A]" />
                Free forever · No credit card
              </span>

              <h2 className="mt-5 text-[34px] font-bold leading-[1.08] tracking-tight text-white xl:text-[40px]">
                Build habits that{" "}
                <span className="bg-gradient-to-r from-[#0A84FF] via-[#64D2FF] to-[#BF5AF2] bg-clip-text text-transparent">
                  actually stick.
                </span>
              </h2>

              <p className="mt-4 max-w-sm text-[14.5px] leading-relaxed text-[rgba(235,235,245,0.6)]">
                Track your daily wins, protect your momentum, and turn small
                actions into a year of change.
              </p>
            </div>

            <ul className="mt-10 space-y-5">
              {features.map((feature) => (
                <li key={feature.title} className="flex items-start gap-3.5">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[12px] border border-white/[0.08] bg-white/[0.06] text-[#409AFF]">
                    <feature.icon className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-[13.5px] font-semibold text-white">
                      {feature.title}
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-[rgba(235,235,245,0.5)]">
                      {feature.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-10">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-5 backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[rgba(235,235,245,0.7)]">
                    <FlameIcon className="h-4 w-4 text-[#FF9F0A]" />
                    Current streak
                  </span>
                  <span className="text-[13px] font-semibold text-white">
                    21 days
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-7 gap-1.5">
                  {streakDays.map((active, index) => (
                    <span
                      key={index}
                      className={`aspect-square rounded-[5px] ${
                        active
                          ? "bg-[#0A84FF] shadow-[0_0_6px_rgba(10,132,255,0.5)]"
                          : "bg-white/[0.08]"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-3 text-[11.5px] text-[rgba(235,235,245,0.4)]">
                  Every small win adds up.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10 lg:px-12">
          <div className="w-full max-w-[400px]">
            <div className="mb-10 lg:hidden">
              <BrandMark compact />
            </div>
            {children}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AuthShell;
