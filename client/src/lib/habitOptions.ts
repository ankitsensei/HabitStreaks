import type { HabitCategory } from "./api";

export const ICON_OPTIONS = [
  { emoji: "🏃", label: "Running" },
  { emoji: "💪", label: "Strength" },
  { emoji: "📚", label: "Reading" },
  { emoji: "🧘", label: "Meditation" },
  { emoji: "💧", label: "Water" },
  { emoji: "🥗", label: "Healthy eating" },
  { emoji: "✍️", label: "Writing" },
  { emoji: "🎨", label: "Creativity" },
  { emoji: "💰", label: "Finance" },
  { emoji: "🤝", label: "Social" },
  { emoji: "🌙", label: "Sleep" },
  { emoji: "🎯", label: "Focus" },
  { emoji: "🧠", label: "Learning" },
  { emoji: "🚀", label: "Growth" },
  { emoji: "💻", label: "Coding" },
  { emoji: "🖥️", label: "Desktop" },
  { emoji: "⌨️", label: "Typing" },
  { emoji: "🧑‍💻", label: "Programming" },
  { emoji: "🐛", label: "Debugging" },
  { emoji: "⚙️", label: "Engineering" },
  { emoji: "🧩", label: "Problem solving" },
  { emoji: "🌐", label: "Web" },
  { emoji: "📱", label: "Mobile" },
  { emoji: "🔐", label: "Security" },
  { emoji: "🤖", label: "AI & automation" },
  { emoji: "🧪", label: "Testing" },
  { emoji: "🗄️", label: "Databases" },
  { emoji: "🕹️", label: "Game dev" },
] as const;

export const COLOR_OPTIONS = [
  { name: "Violet", value: "#7C3AED" },
  { name: "Purple", value: "#A855F7" },
  { name: "Fuchsia", value: "#D946EF" },
  { name: "Pink", value: "#EC4899" },
  { name: "Rose", value: "#F43F5E" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Lime", value: "#84CC16" },
  { name: "Green", value: "#22C55E" },
  { name: "Emerald", value: "#10B981" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Sky", value: "#0EA5E9" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Brown", value: "#92400E" },
  { name: "Slate", value: "#64748B" },
  { name: "Charcoal", value: "#1F2937" },
] as const;

export const isLightColor = (hex: string) => {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);

  return (red * 299 + green * 587 + blue * 114) / 1000 > 160;
};

export const CATEGORY_ICONS: Record<HabitCategory, string> = {
  "Health & Fitness": "💪",
  "Learning & Education": "📚",
  Productivity: "⚡",
  Creativity: "🎨",
  Mindfulness: "🧘",
  Social: "🤝",
  Finance: "💰",
  Other: "✨",
};

export const TARGET_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const;
