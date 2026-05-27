"use client";

import React from "react";

export default function ResultsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "50vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 32,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
        Unable to load results
      </h2>
      <p style={{ fontSize: 14, color: "#888", margin: 0, textAlign: "center", maxWidth: 400 }}>
        This can happen if the exam was submitted before a recent update.
        Try again, or retake the exam for a fresh score.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={reset}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "1px solid #333",
            background: "#1a1a2e",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
        <a
          href="/dashboard"
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "1px solid #333",
            background: "transparent",
            color: "#888",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}
