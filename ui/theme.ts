export type AppThemeName = "light" | "dark";

export type AppTheme = {
  name: AppThemeName;

  // layout
  pageBg: string;
  pageBg2: string;
  text: string;
  muted: string;
  mutedStrong: string;
  fontBody: string;
  fontDisplay: string;

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
  // Calm residential palette inspired by the reference site.
  pageBg: "#edf4f3",
  pageBg2:
    "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 280px)",
  text: "#17282d",
  muted: "rgba(23,40,45,0.58)",
  mutedStrong: "rgba(23,40,45,0.76)",
  fontBody: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
  fontDisplay: 'Georgia, "Times New Roman", serif',

  cardBg: "#ffffff",
  cardBg2: "#f7f8f7",
  cardBorder: "rgba(23,40,45,0.12)",
  shadow: "0 1px 2px rgba(23,40,45,0.04), 0 10px 28px rgba(23,40,45,0.07)",
  shadowSm: "0 1px 2px rgba(23,40,45,0.05)",
  shadowLg: "0 2px 6px rgba(23,40,45,0.06), 0 20px 54px rgba(23,40,45,0.12)",

  buttonBg: "#ffffff",
  buttonHover: "#e2eeec",
  buttonActive: "#d4e5e2",
  buttonBorder: "rgba(23,100,117,0.28)",

  accent: "#176475",
  accentHover: "#0f4f5d",
  accentSoft: "rgba(23,100,117,0.10)",
  accentText: "#ffffff",

  success: "#2f6f4e",
  successSoft: "rgba(47,111,78,0.10)",
  successBorder: "rgba(47,111,78,0.30)",
  error: "#b91c1c",
  errorSoft: "rgba(185,28,28,0.08)",
  errorBorder: "rgba(185,28,28,0.28)",
  warning: "#8a5a19",
  warningSoft: "rgba(138,90,25,0.10)",
  warningBorder: "rgba(138,90,25,0.30)",

  inputBg: "#f7f8f7",
  inputBorder: "rgba(23,40,45,0.16)",
  inputFocus: "rgba(23,100,117,0.42)",

  divider: "rgba(23,40,45,0.10)",
  overlay: "rgba(23,40,45,0.40)",
};

export const darkTheme: AppTheme = {
  name: "dark",
  pageBg: "#101b1f",
  pageBg2:
    "linear-gradient(180deg, rgba(23,100,117,0.16) 0%, rgba(23,100,117,0) 340px)",
  text: "rgba(247,248,247,0.94)",
  muted: "rgba(247,248,247,0.58)",
  mutedStrong: "rgba(247,248,247,0.76)",
  fontBody: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
  fontDisplay: 'Georgia, "Times New Roman", serif',

  cardBg: "rgba(247,248,247,0.06)",
  cardBg2: "rgba(247,248,247,0.035)",
  cardBorder: "rgba(247,248,247,0.12)",
  shadow: "0 1px 3px rgba(0,0,0,0.20), 0 8px 32px rgba(0,0,0,0.30)",
  shadowSm: "0 1px 3px rgba(0,0,0,0.20)",
  shadowLg: "0 4px 6px rgba(0,0,0,0.20), 0 20px 60px rgba(0,0,0,0.40)",

  buttonBg: "rgba(247,248,247,0.07)",
  buttonHover: "rgba(247,248,247,0.12)",
  buttonActive: "rgba(247,248,247,0.16)",
  buttonBorder: "rgba(247,248,247,0.14)",

  accent: "#7cc2cf",
  accentHover: "#9ad5df",
  accentSoft: "rgba(124,194,207,0.16)",
  accentText: "#ffffff",

  success: "#86d19e",
  successSoft: "rgba(134,209,158,0.14)",
  successBorder: "rgba(134,209,158,0.40)",
  error: "#f87171",
  errorSoft: "rgba(248,113,113,0.14)",
  errorBorder: "rgba(248,113,113,0.40)",
  warning: "#e4bd74",
  warningSoft: "rgba(228,189,116,0.14)",
  warningBorder: "rgba(228,189,116,0.40)",

  inputBg: "rgba(247,248,247,0.06)",
  inputBorder: "rgba(247,248,247,0.14)",
  inputFocus: "rgba(124,194,207,0.50)",

  divider: "rgba(247,248,247,0.10)",
  overlay: "rgba(0,0,0,0.60)",
};
