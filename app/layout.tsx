import type { Metadata, Viewport } from "next";
import StyledComponentsRegistry from "@/lib/styled-registry";
import { AppShell } from "@/ui/AppShell";
import { ThemeClient } from "@/ui/ThemeClient";
import { AuthProvider } from "@/lib/auth/AuthProvider";

export const metadata: Metadata = {
  title: {
    default: "PMP Mastery Lab — Pass the PMP on Your First Attempt",
    template: "%s | PMP Mastery Lab",
  },
  description:
    "Free PMP mock exam with adaptive difficulty, real-time weakness targeting, and full timed simulations. 400+ questions, 6 question types, 3 exam simulations. PMBOK 7th Edition aligned.",
  keywords: [
    "PMP exam questions 2026",
    "PMP mock exam free",
    "PMP exam simulator",
    "how to pass PMP first try",
    "PMP practice test",
    "PMP exam preparation",
    "PMP study tool",
    "PMP exam simulation",
    "PMBOK 7th edition",
    "PMP certification prep",
  ],
  authors: [{ name: "PMP Mastery Lab" }],
  openGraph: {
    title: "PMP Mastery Lab — Pass the PMP on Your First Attempt",
    description:
      "Train like the real PMP exam. Adaptive difficulty, weakness targeting, full timed simulations. Free to start.",
    type: "website",
  },
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body style={{ margin: 0, padding: 0, overflowX: "hidden" }}>
        <StyledComponentsRegistry>
          <ThemeClient>
            <AuthProvider>
              <AppShell>{children}</AppShell>
            </AuthProvider>
          </ThemeClient>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
