import type { Metadata, Viewport } from "next";
import StyledComponentsRegistry from "@/lib/styled-registry";
import { AppShell } from "@/ui/AppShell";
import { ThemeClient } from "@/ui/ThemeClient";

export const metadata: Metadata = {
  title: {
    default: "ExamEngine — Master Your Exam",
    template: "%s | ExamEngine",
  },
  description:
    "A professional exam preparation platform with practice mode, full exam simulations, and immediate answer feedback across multiple question types.",
  keywords: ["exam preparation", "practice test", "exam simulation", "study tool"],
  authors: [{ name: "ExamEngine" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#06090f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ scrollBehavior: "smooth" }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <StyledComponentsRegistry>
          <ThemeClient>
            <AppShell>{children}</AppShell>
          </ThemeClient>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
