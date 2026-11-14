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
 className={`grid place-items-center rounded-lg bg-white text-[#0a0a0a] ${
 compact ? "h-9 w-9" : "h-10 w-10"
 }`}
 >
 <FlameIcon className={compact ? "h-[18px] w-[18px]" : "h-5 w-5"} />
 </span>
 <span
 className={`font-medium tracking-[-0.01em] ${
 compact ? "text-[16px] text-white" : "text-[17px] text-white"
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
 <div className="relative min-h-svh overflow-hidden bg-[#0a0a0a] blueprint-grid px-3 py-3 sm:px-5 sm:py-5">
 <main className="relative mx-auto flex min-h-[calc(100svh-1.5rem)] w-full max-w-6xl overflow-hidden rounded-lg border border-[#313131] bg-[#141414] sm:min-h-[calc(100svh-2.5rem)]">
 <aside className="relative hidden w-[46%] max-w-[540px] shrink-0 flex-col overflow-hidden bg-[#0a0a0a] p-10 lg:flex xl:p-12">
 <div className="relative z-10 flex flex-1 flex-col">
 <BrandMark />

 <div className="mt-14">
 <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-[#a7a7a7]">
 <SparkIcon className="h-3.5 w-3.5 text-[#6798ff]" />
 Free forever · No credit card
 </span>

 <h2 className="mt-5 text-[34px] font-medium leading-[1.08] tracking-[-0.02em] text-white xl:text-[40px]">
 Build habits that{" "}
 <span className="inline-block rounded-full bg-white px-4 py-0.5 text-[#0a0a0a]">actually stick.</span>
 </h2>

 <p className="mt-4 max-w-sm text-[14.5px] leading-relaxed text-[#a7a7a7]">
 Track your daily wins, protect your momentum, and turn small
 actions into a year of change.
 </p>
 </div>

 <ul className="mt-10 space-y-5">
 {features.map((feature) => (
 <li key={feature.title} className="flex items-start gap-3.5">
 <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#313131] bg-[#0a0a0a] text-[#6798ff]">
 <feature.icon className="h-[18px] w-[18px]" />
 </span>
 <div>
 <p className="text-[13.5px] font-medium text-white">
 {feature.title}
 </p>
 <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#a7a7a7]">
 {feature.description}
 </p>
 </div>
 </li>
 ))}
 </ul>

 <div className="mt-auto pt-10">
 <div className="rounded-lg border border-[#313131] bg-[#0a0a0a] p-5">
 <div className="flex items-center justify-between">
 <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#a7a7a7]">
 <FlameIcon className="h-4 w-4 text-[#6798ff]" />
 Current streak
 </span>
 <span className="text-[13px] font-medium text-white">
 21 days
 </span>
 </div>
 <div className="mt-4 grid grid-cols-7 gap-1.5">
 {streakDays.map((active, index) => (
 <span
 key={index}
 className={`aspect-square rounded-[5px] ${
 active
 ? "bg-[#6798ff]"
 : "bg-[#1e1e1e]"
 }`}
 />
 ))}
 </div>
 <p className="mt-3 text-[11.5px] text-[#a7a7a7]">
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
