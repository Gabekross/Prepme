"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useAppTheme } from "@/ui/ThemeClient";
import { usePathname } from "next/navigation";


const Shell = styled.div`
  min-height: 100vh;
  background: ${(p) => p.theme.pageBg};
  background-image: ${(p) => p.theme.pageBg2};
  color: ${(p) => p.theme.text};
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
`;

const Topbar = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(12px);
  background: rgba(255,255,255,0.65);
  border-bottom: 1px solid ${(p) => p.theme.cardBorder};

  ${(p) =>
    p.theme.name === "dark"
      ? `
    background: rgba(12,16,32,0.60);
  `
      : ``}
`;

const TopbarInner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Brand = styled(Link)`
  font-weight: 900;
  letter-spacing: 0.2px;
  color: ${(p) => p.theme.text};
  text-decoration: none;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const NavLink = styled(Link)`
  color: ${(p) => p.theme.text};
  text-decoration: none;
  font-size: 13px;
  padding: 9px 12px;
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.buttonBorder};
  background: ${(p) => p.theme.buttonBg};

  &:hover {
    background: ${(p) => p.theme.buttonHover};
  }
`;

const NavButton = styled.button`
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.buttonBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  font-size: 13px;
  padding: 9px 12px;
  cursor: pointer;
  font-weight: 800;

  &:hover {
    background: ${(p) => p.theme.buttonHover};
  }
`;

const ThemePill = styled.button`
  border-radius: 999px;
  border: 1px solid ${(p) => p.theme.buttonBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  font-size: 13px;
  padding: 9px 12px;
  cursor: pointer;
  font-weight: 900;

  &:hover {
    background: ${(p) => p.theme.buttonHover};
  }
`;

const Main = styled.main`
  max-width: 1100px;
  margin: 0 auto;
  padding: 18px 16px 56px;
`;

const MenuWrap = styled.div`
  position: relative;
`;

const MenuButton = styled.button`
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.buttonBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  cursor: pointer;
  font-weight: 900;

  &:hover {
    background: ${(p) => p.theme.buttonHover};
  }
`;

const MenuPanel = styled.div`
  position: absolute;
  right: 0;
  top: 46px;
  width: 210px;
  border-radius: 16px;
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.cardBg};
  box-shadow: ${(p) => p.theme.shadow};
  padding: 8px;
  display: grid;
  gap: 6px;
  z-index: 50;
`;

const MenuItem = styled(Link)`
  text-decoration: none;
  color: ${(p) => p.theme.text};
  border-radius: 12px;
  padding: 10px 10px;
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.buttonBg};
  font-size: 13px;
  font-weight: 800;

  &:hover {
    background: ${(p) => p.theme.buttonHover};
  }
`;

const MenuAction = styled.button`
  text-decoration: none;
  color: ${(p) => p.theme.text};
  border-radius: 12px;
  padding: 10px 10px;
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.buttonBg};
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    background: ${(p) => p.theme.buttonHover};
  }
`;

export function AppShell({ children }: { children: React.ReactNode }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const { themeName, toggle } = useAppTheme();

  const [signedIn, setSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const inSession = /^\/bank\/[^/]+\/(practice|exam)/.test(pathname);

  const [menuOpen, setMenuOpen] = useState(false);


  async function refresh() {
    const { data } = await sb.auth.getUser();
    const user = data.user;
    if (!user) {
      setSignedIn(false);
      setIsAdmin(false);
      return;
    }
    setSignedIn(true);

    const { data: roles } = await sb.from("user_roles").select("role").eq("user_id", user.id);
    setIsAdmin((roles ?? []).some((r: any) => r.role === "admin"));
  }

  useEffect(() => {
    refresh();
    const { data: sub } = sb.auth.onAuthStateChange(() => refresh());
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await sb.auth.signOut();
  }

  return (
    <Shell>
      <Topbar>
        <TopbarInner>
          <Brand href="/">Exam Platform</Brand>
          <Nav>
  {!inSession ? (
    <>
      <NavLink href="/">Exams</NavLink>
      {isAdmin ? <NavLink href="/admin/questions">Admin</NavLink> : null}
      {!signedIn ? <NavLink href="/login">Login</NavLink> : <NavButton onClick={signOut}>Logout</NavButton>}
      <ThemePill onClick={toggle}>{themeName === "dark" ? "☾ Dark" : "☀ Light"}</ThemePill>
    </>
  ) : (
    <MenuWrap>
      <MenuButton onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">⋯</MenuButton>
      {menuOpen ? (
        <MenuPanel>
          <MenuItem href="/" onClick={() => setMenuOpen(false)}>Back to Exams</MenuItem>
          <MenuAction
            onClick={() => {
              toggle();
              setMenuOpen(false);
            }}
          >
            Toggle Theme
          </MenuAction>
        </MenuPanel>
      ) : null}
    </MenuWrap>
  )}
</Nav>
        </TopbarInner>
      </Topbar>

      <Main>{children}</Main>
    </Shell>
  );
}
