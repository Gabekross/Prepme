import type { Metadata } from "next";
import StyledComponentsRegistry from "@/lib/styled-registry";
import { AppShell } from "@/ui/AppShell";
import { ThemeClient } from "@/ui/ThemeClient";

export const metadata: Metadata = {
  title: "Exam Platform",
  description: "Universal exam engine",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <ThemeClient>
            <AppShell>{children}</AppShell>
          </ThemeClient>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
