"use client";

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useAppTheme } from "@/ui/ThemeClient";
import { usePathname } from "next/navigation";
import { LocalAttemptStorage } from "@/src/exam-engine/core/storage";
import { supabaseBrowser } from "@/lib/supabase/browser";

const Shell = styled.div`
  min-height: 100vh;
  background: ${(p) => p.theme.pageBg};
  background-image: ${(p) => p.theme.pageBg2};
  color: ${(p) => p.theme.text};
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const Topbar = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  background: ${(p) =>
    p.theme.name === "dark"
      ? "rgba(6,9,15,0.75)"
      : "rgba(255,255,255,0.80)"};
  border-bottom: 1px solid ${(p) => p.theme.divider};
  transition: background 200ms ease;
`;

const TopbarInner = styled.div`
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 16px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;

  @media (min-width: 480px) {
    padding: 0 20px;
    height: 58px;
    gap: 12px;
  }
`;

const BrandLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 9px;
  text-decoration: none;
  flex-shrink: 0;
`;

const BrandIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, ${(p) => p.theme.accent} 0%, #7c3aed 100%);
  display: grid;
  place-items: center;
  font-size: 16px;
  box-shadow: 0 2px 8px ${(p) => p.theme.accentSoft};
  flex-shrink: 0;
`;

const BrandName = styled.span`
  font-weight: 800;
  font-size: 14px;
  letter-spacing: -0.2px;
  color: ${(p) => p.theme.text};
  white-space: nowrap;
  display: none;

  @media (min-width: 400px) {
    display: inline;
    font-size: 15px;
  }
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;

  @media (min-width: 480px) {
    gap: 6px;
  }
`;

const NavLink = styled(Link)`
  color: ${(p) => p.theme.mutedStrong};
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 6px;
  border-radius: 10px;
  white-space: nowrap;
  transition: color 150ms ease, background 150ms ease;

  &:hover {
    color: ${(p) => p.theme.text};
    background: ${(p) => p.theme.buttonHover};
  }

  @media (min-width: 480px) {
    font-size: 13.5px;
    padding: 7px 14px;
  }
`;

const NavDivider = styled.div`
  width: 1px;
  height: 20px;
  background: ${(p) => p.theme.divider};
  margin: 0 1px;

  @media (min-width: 480px) {
    margin: 0 4px;
  }
`;

const NavButton = styled.button`
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.buttonBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.mutedStrong};
  font-size: 12px;
  font-weight: 600;
  padding: 6px 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: color 150ms ease, background 150ms ease;

  &:hover {
    color: ${(p) => p.theme.text};
    background: ${(p) => p.theme.buttonHover};
  }

  @media (min-width: 480px) {
    font-size: 13.5px;
    padding: 7px 14px;
  }
`;

const ThemePill = styled.button`
  border-radius: 999px;
  border: 1px solid ${(p) => p.theme.buttonBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  font-size: 13px;
  font-weight: 700;
  padding: 6px 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  transition: background 150ms ease, border-color 150ms ease;

  &:hover {
    background: ${(p) => p.theme.buttonHover};
    border-color: ${(p) => p.theme.accent};
  }

  @media (min-width: 480px) {
    padding: 7px 14px;
  }
`;

const Main = styled.main`
  max-width: 1180px;
  margin: 0 auto;
  padding: 16px 14px 64px;

  @media (min-width: 480px) {
    padding: 20px 16px 72px;
  }

  @media (min-width: 768px) {
    padding: 28px 20px 80px;
  }
`;

/* ── Session (practice / exam) header ─────────────────────────────────── */

const SessionBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SessionBadge = styled.div<{ $mode: "practice" | "exam" }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  background: ${(p) =>
    p.$mode === "practice"
      ? p.theme.successSoft
      : p.theme.accentSoft};
  color: ${(p) =>
    p.$mode === "practice"
      ? p.theme.success
      : p.theme.accent};
  border: 1px solid ${(p) =>
    p.$mode === "practice"
      ? p.theme.successBorder
      : p.theme.accentSoft};
`;

const MenuWrap = styled.div`
  position: relative;
`;

const MenuButton = styled.button`
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.buttonBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  cursor: pointer;
  font-size: 18px;
  font-weight: 900;
  transition: background 150ms ease;

  &:hover {
    background: ${(p) => p.theme.buttonHover};
  }
`;

const MenuPanel = styled.div`
  position: fixed;
  right: 14px;
  top: 62px;
  width: min(220px, calc(100vw - 28px));
  border-radius: 16px;
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.name === "dark" ? "rgba(10,15,26,0.97)" : "rgba(255,255,255,0.98)"};
  box-shadow: ${(p) => p.theme.shadowLg};
  padding: 6px;
  display: grid;
  gap: 4px;
  z-index: 200;
  backdrop-filter: blur(20px);

  @media (min-width: 480px) {
    position: absolute;
    right: 0;
    top: 46px;
    width: 220px;
  }
`;

const MenuSectionLabel = styled.div`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: ${(p) => p.theme.muted};
  padding: 8px 10px 4px;
`;

const MenuItem = styled(Link)`
  text-decoration: none;
  color: ${(p) => p.theme.text};
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 13.5px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 120ms ease;

  &:hover {
    background: ${(p) => p.theme.buttonHover};
  }
`;

const MenuAction = styled.button<{ $danger?: boolean }>`
  text-decoration: none;
  color: ${(p) => (p.$danger ? p.theme.error : p.theme.text)};
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  width: 100%;
  transition: background 120ms ease;

  &:hover {
    background: ${(p) => (p.$danger ? p.theme.errorSoft : p.theme.buttonHover)};
  }
`;

const MenuDivider = styled.div`
  height: 1px;
  background: ${(p) => p.theme.divider};
  margin: 4px 0;
`;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, signOut: authSignOut } = useAuth();
  const signedIn = !!user;
  const { themeName, toggle } = useAppTheme();
  const pathname = usePathname();

  const inPractice = /^\/bank\/[^/]+\/practice/.test(pathname);
  const inExam = /^\/bank\/[^/]+\/exam/.test(pathname);
  const inSession = inPractice || inExam;

  const [menuOpen, setMenuOpen] = useState(false);

  const bankSlugMatch = pathname.match(/^\/bank\/([^/]+)\/(practice|exam)/);
  const bankSlug = bankSlugMatch?.[1] ?? null;
  const sessionMode: "practice" | "exam" = inExam ? "exam" : "practice";

  // Extract set slug from exam URLs like /bank/pmp/exam/set-a
  const setSlugMatch = pathname.match(/^\/bank\/[^/]+\/exam\/([^/]+)/);
  const setSlug = setSlugMatch?.[1] ?? null;
  // Convert URL slug (e.g. "set-a") to internal setId (e.g. "set_a")
  const setId = setSlug ? setSlug.replace(/-/g, "_") : null;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-menu-wrap]")) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  function restartPractice() {
    if (!bankSlug) return;
    const ok = window.confirm(
      "Restart practice?\n\nThis will start a brand-new shuffled attempt and clear your current progress."
    );
    if (!ok) return;
    window.dispatchEvent(new CustomEvent("practice:restart", { detail: { bankSlug } }));
    setMenuOpen(false);
  }

  /**
   * Abandon the current in-progress attempt in both localStorage and Supabase.
   * This prevents the "Resume Session?" modal from showing after an explicit exit.
   */
  async function abandonAttempt(ns: string, mode: "exam" | "practice") {
    const s = new LocalAttemptStorage(ns);
    // Read the attempt ID from localStorage before clearing it
    const attempt = await s.loadLatestAttempt();
    if (s.clearLatest) await s.clearLatest();

    // Mark the attempt as "abandoned" in Supabase so the resume query skips it
    if (attempt?.id && user?.id) {
      try {
        const sb = supabaseBrowser();
        await sb
          .from("attempts")
          .update({ status: "abandoned" })
          .eq("id", attempt.id)
          .eq("user_id", user.id);
      } catch (err) {
        console.warn("[AppShell] Failed to mark attempt abandoned in DB:", err);
      }
    }
  }

  async function exitExam() {
    const ok = window.confirm(
      "Exit exam simulation?\n\nYour current progress will be cleared."
    );
    if (!ok) return;
    if (bankSlug) {
      const ns = setId ? `${bankSlug}__exam__${setId}` : `${bankSlug}__exam`;
      await abandonAttempt(ns, "exam");
    }
    window.location.href = bankSlug ? `/bank/${bankSlug}` : "/";
  }

  async function exitPractice() {
    const ok = window.confirm(
      "Exit practice session?\n\nYour current progress will be cleared."
    );
    if (!ok) return;
    if (bankSlug) {
      await abandonAttempt(`${bankSlug}__practice`, "practice");
    }
    window.location.href = bankSlug ? `/bank/${bankSlug}` : "/";
  }

  return (
    <Shell>
      <Topbar>
        <TopbarInner>
          <BrandLink href={signedIn ? "/bank/pmp" : "/"}>
            <BrandIcon aria-hidden="true">🎓</BrandIcon>
            <BrandName>ExamEngine</BrandName>
          </BrandLink>

          <Nav>
            {!inSession ? (
              <>
                <NavLink href={signedIn ? "/bank/pmp" : "/"}>Exams</NavLink>
                {signedIn && <NavLink href="/dashboard">Dashboard</NavLink>}
                {isAdmin ? <NavLink href="/admin/questions">Admin</NavLink> : null}
                <NavDivider />
                {!signedIn ? (
                  <NavLink href="/login">Sign In</NavLink>
                ) : (
                  <NavButton onClick={authSignOut}>Sign Out</NavButton>
                )}
                <ThemePill onClick={toggle} aria-label="Toggle theme">
                  {themeName === "dark" ? "☾" : "☀︎"}
                </ThemePill>
              </>
            ) : (
              <SessionBar>
                {inSession && (
                  <SessionBadge $mode={sessionMode}>
                    {sessionMode === "practice" ? "● Practice" : "● Exam"}
                  </SessionBadge>
                )}

                <MenuWrap data-menu-wrap="">
                  <MenuButton
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-label="Open menu"
                    aria-expanded={menuOpen}
                  >
                    ⋯
                  </MenuButton>

                  {menuOpen && (
                    <MenuPanel role="menu">
                      <MenuSectionLabel>Navigation</MenuSectionLabel>
                      <MenuItem href="/" onClick={() => setMenuOpen(false)}>
                        ← Back to Exams
                      </MenuItem>
                      {bankSlug && (
                        <MenuItem href={`/bank/${bankSlug}`} onClick={() => setMenuOpen(false)}>
                          ← Bank Overview
                        </MenuItem>
                      )}

                      <MenuDivider />
                      <MenuSectionLabel>Settings</MenuSectionLabel>

                      <MenuAction onClick={() => { toggle(); setMenuOpen(false); }}>
                        {themeName === "dark" ? "☀︎ Switch to Light Mode" : "☾ Switch to Dark Mode"}
                      </MenuAction>

                      <MenuDivider />
                      <MenuSectionLabel>Session</MenuSectionLabel>

                      {inPractice && (
                        <>
                          <MenuAction onClick={restartPractice}>
                            ↺ Restart (New Shuffle)
                          </MenuAction>
                          <MenuAction $danger onClick={exitPractice}>
                            ✕ Exit Practice
                          </MenuAction>
                        </>
                      )}
                      {inExam && (
                        <MenuAction $danger onClick={exitExam}>
                          ✕ Exit Exam
                        </MenuAction>
                      )}
                    </MenuPanel>
                  )}
                </MenuWrap>
              </SessionBar>
            )}
          </Nav>
        </TopbarInner>
      </Topbar>

      <Main>{children}</Main>
    </Shell>
  );
}
