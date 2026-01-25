export type AppThemeName = "light" | "dark";

export type AppTheme = {
  name: AppThemeName;

  // layout
  pageBg: string;
  pageBg2: string;
  text: string;
  muted: string;

  // surfaces
  cardBg: string;
  cardBorder: string;
  shadow: string;

  // interactive
  buttonBg: string;
  buttonHover: string;
  buttonBorder: string;

  // accents (professional, colorful)
  accent: string;
  accentSoft: string;
};

export const lightTheme: AppTheme = {
  name: "light",
  pageBg: "linear-gradient(180deg, #f7f9fc 0%, #ffffff 60%, #ffffff 100%)",
  pageBg2: "radial-gradient(900px 420px at 15% 0%, rgba(59,130,246,0.12), transparent 55%), radial-gradient(900px 420px at 85% 0%, rgba(168,85,247,0.12), transparent 55%)",
  text: "#0f172a",
  muted: "rgba(15,23,42,0.70)",
  cardBg: "#ffffff",
  cardBorder: "rgba(15,23,42,0.10)",
  shadow: "0 10px 28px rgba(2, 6, 23, 0.06)",
  buttonBg: "#ffffff",
  buttonHover: "#f3f6fb",
  buttonBorder: "rgba(15,23,42,0.12)",
  accent: "#2563eb",
  accentSoft: "rgba(37,99,235,0.14)",
};

export const darkTheme: AppTheme = {
  name: "dark",
  pageBg: "linear-gradient(180deg, #070a12 0%, #0b1020 55%, #0b1020 100%)",
  pageBg2:
    "radial-gradient(900px 420px at 15% 0%, rgba(59,130,246,0.22), transparent 55%), radial-gradient(900px 420px at 85% 0%, rgba(168,85,247,0.22), transparent 55%)",
  text: "rgba(255,255,255,0.92)",
  muted: "rgba(255,255,255,0.72)",
  cardBg: "rgba(255,255,255,0.05)",
  cardBorder: "rgba(255,255,255,0.10)",
  shadow: "0 14px 36px rgba(0,0,0,0.35)",
  buttonBg: "rgba(255,255,255,0.06)",
  buttonHover: "rgba(255,255,255,0.10)",
  buttonBorder: "rgba(255,255,255,0.12)",
  accent: "#60a5fa",
  accentSoft: "rgba(96,165,250,0.18)",
};
