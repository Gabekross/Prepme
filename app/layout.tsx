import type { Metadata, Viewport } from "next";
import StyledComponentsRegistry from "@/lib/styled-registry";
import { AppShell } from "@/ui/AppShell";
import { ThemeClient } from "@/ui/ThemeClient";
import { AuthProvider } from "@/lib/auth/AuthProvider";

export const metadata: Metadata = {
  title: {
    default: "PMP Practice Exam Simulator | PMP Mock Tests & Practice Questions",
    template: "%s | PMP Mastery Lab",
  },
  description:
    "Prepare for the PMP exam with realistic PMP-style exam simulations, timed mock tests, practice questions, performance analytics, and structured study tools designed for effective exam preparation.",
  keywords: [
    "PMP practice exam",
    "PMP mock exam",
    "PMP exam simulator",
    "PMP practice questions",
    "PMP exam prep",
    "PMP simulation exam",
    "PMP timed exam",
    "PMP exam questions",
    "PMP readiness test",
    "PMP study platform",
    "PMI exam preparation",
    "Project Management Professional exam prep",
    "current PMP Exam Content Outline",
    "PMP certification prep",
    "PMP mock test",
  ],
  authors: [{ name: "PMP Mastery Lab" }],
  openGraph: {
    title: "PMP Practice Exam Simulator | PMP Mock Tests & Practice Questions",
    description:
      "Prepare for the PMP exam with realistic timed simulations, mock exams, practice questions, and performance analytics. Free to start.",
    type: "website",
    siteName: "PMP Mastery Lab",
  },
  twitter: {
    card: "summary_large_image",
    title: "PMP Practice Exam Simulator | PMP Mock Tests & Practice Questions",
    description:
      "Realistic PMP exam simulations, timed mock tests, and targeted practice questions to help you prepare effectively for the PMP certification exam.",
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
        <meta name="mobile-web-app-capable" content="yes" />
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
