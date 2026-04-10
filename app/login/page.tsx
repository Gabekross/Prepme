import { Suspense } from "react";
import LoginClient from "./LoginClient";

// Ensure Vercel/CDN always serves the latest version (no stale cache)
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginClient />
    </Suspense>
  );
}
