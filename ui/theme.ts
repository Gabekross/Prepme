export type AppThemeName = "light" | "dark";

export type AppTheme = {
  name: AppThemeName;

  // layout
  pageBg: string;
  pageBg2: string;
  text: string;
  muted: string;
  mutedStrong: string;

  // surfaces
  cardBg: string;
  cardBg2: string;
  cardBorder: string;
  shadow: string;
  shadowSm: string;
  shadowLg: string;

  // interactive
  buttonBg: string;
  buttonHover: string;
  buttonActive: string;
  buttonBorder: string;

  // accents
  accent: string;
  accentHover: string;
  accentSoft: string;
  accentText: string;

  // semantic colors
  success: string;
  successSoft: string;
  successBorder: string;
  error: string;
  errorSoft: string;
  errorBorder: string;
  warning: string;
  warningSoft: string;
  warningBorder: string;

  // input
  inputBg: string;
  inputBorder: string;
  inputFocus: string;

  // misc
  divider: string;
  overlay: string;
};

export const lightTheme: AppTheme = {
  name: "light",
  // Warm stone page — subtle warmth, not cold/blue, not blinding white
  pageBg: "linear-gradient(180deg, #e8eaf0 0%, #edeef4 50%, #f0f2f7 100%)",
  pageBg2:
    "radial-gradient(900px 500px at 10% 0%, rgba(59,130,246,0.05), transparent 55%), radial-gradient(900px 500px at 90% 0%, rgba(168,85,247,0.05), transparent 55%)",
  // Crisp dark navy — enough contrast without feeling harsh
  text: "#111827",
  muted: "rgba(17,24,39,0.46)",
  mutedStrong: "rgba(17,24,39,0.65)",

  // Pure white cards pop cleanly against the muted page bg
  cardBg: "#ffffff",
  cardBg2: "#f3f5f9",
  cardBorder: "rgba(17,24,39,0.08)",
  shadow: "0 1px 2px rgba(0,0,0,0.04), 0 6px 20px rgba(17,24,39,0.06)",
  shadowSm: "0 1px 2px rgba(0,0,0,0.04)",
  shadowLg: "0 2px 4px rgba(0,0,0,0.04), 0 16px 40px rgba(17,24,39,0.10)",

  // Buttons: warm neutral tint — clearly interactive, not harsh
  buttonBg: "#eaedf4",
  buttonHover: "#dde1ed",
  buttonActive: "#cfd4e4",
  buttonBorder: "rgba(17,24,39,0.11)",

  accent: "#2563eb",
  accentHover: "#1d4ed8",
  accentSoft: "rgba(37,99,235,0.09)",
  accentText: "#ffffff",

  // Semantic: rich but not garish on the warm bg
  success: "#166534",
  successSoft: "rgba(22,101,52,0.08)",
  successBorder: "rgba(22,101,52,0.28)",
  error: "#b91c1c",
  errorSoft: "rgba(185,28,28,0.08)",
  errorBorder: "rgba(185,28,28,0.28)",
  warning: "#92400e",
  warningSoft: "rgba(146,64,14,0.08)",
  warningBorder: "rgba(146,64,14,0.28)",

  inputBg: "#f6f7fb",
  inputBorder: "rgba(17,24,39,0.13)",
  inputFocus: "rgba(37,99,235,0.40)",

  divider: "rgba(17,24,39,0.07)",
  overlay: "rgba(17,24,39,0.40)",
};

export const darkTheme: AppTheme = {
  name: "dark",
  pageBg: "linear-gradient(180deg, #06090f 0%, #0b1120 50%, #0b1120 100%)",
  pageBg2:
    "radial-gradient(900px 500px at 10% 0%, rgba(59,130,246,0.18), transparent 55%), radial-gradient(900px 500px at 90% 0%, rgba(168,85,247,0.18), transparent 55%)",
  text: "rgba(255,255,255,0.93)",
  muted: "rgba(255,255,255,0.55)",
  mutedStrong: "rgba(255,255,255,0.75)",

  cardBg: "rgba(255,255,255,0.04)",
  cardBg2: "rgba(255,255,255,0.02)",
  cardBorder: "rgba(255,255,255,0.08)",
  shadow: "0 1px 3px rgba(0,0,0,0.20), 0 8px 32px rgba(0,0,0,0.30)",
  shadowSm: "0 1px 3px rgba(0,0,0,0.20)",
  shadowLg: "0 4px 6px rgba(0,0,0,0.20), 0 20px 60px rgba(0,0,0,0.40)",

  buttonBg: "rgba(255,255,255,0.06)",
  buttonHover: "rgba(255,255,255,0.10)",
  buttonActive: "rgba(255,255,255,0.14)",
  buttonBorder: "rgba(255,255,255,0.10)",

  accent: "#3b82f6",
  accentHover: "#60a5fa",
  accentSoft: "rgba(59,130,246,0.16)",
  accentText: "#ffffff",

  success: "#22c55e",
  successSoft: "rgba(34,197,94,0.14)",
  successBorder: "rgba(34,197,94,0.40)",
  error: "#f87171",
  errorSoft: "rgba(248,113,113,0.14)",
  errorBorder: "rgba(248,113,113,0.40)",
  warning: "#fbbf24",
  warningSoft: "rgba(251,191,36,0.14)",
  warningBorder: "rgba(251,191,36,0.40)",

  inputBg: "rgba(255,255,255,0.04)",
  inputBorder: "rgba(255,255,255,0.12)",
  inputFocus: "rgba(59,130,246,0.50)",

  divider: "rgba(255,255,255,0.07)",
  overlay: "rgba(0,0,0,0.60)",
};
