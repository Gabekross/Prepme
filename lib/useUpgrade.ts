"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";

/**
 * Hook that triggers Stripe Checkout for Pro upgrade.
 * Returns { startCheckout, loading } — call startCheckout() from any upgrade button.
 *
 * If the user is not signed in, redirects to /login.
 */
export function useUpgrade() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const startCheckout = useCallback(async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      console.error("Checkout error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { startCheckout, loading };
}
