"use client";

import React, { useState, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import Link from "next/link";
import { requireAdminServer } from "@/src/admin/requireAdmin";
import { supabaseBrowser } from "@/lib/supabase/browser";

/* ── animations ─────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── layout ─────────────────────────────────────────────────────────────── */

const Page = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 20px 64px;
  animation: ${fadeUp} 400ms ease both;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const BackLink = styled(Link)`
  font-size: 13px;
  color: ${(p) => p.theme.muted};
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;

  &:hover {
    color: ${(p) => p.theme.accent};
  }
`;

const Title = styled.h1`
  font-size: 26px;
  font-weight: 900;
  color: ${(p) => p.theme.text};
  margin: 0 0 4px;
  letter-spacing: -0.4px;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: ${(p) => p.theme.muted};
  margin: 0;
`;

/* ── search ─────────────────────────────────────────────────────────────── */

const SearchRow = styled.form`
  display: flex;
  gap: 10px;
  margin-bottom: 28px;
`;

const SearchInput = styled.input`
  flex: 1;
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  color: ${(p) => p.theme.text};
  outline: none;
  transition: border-color 160ms;

  &::placeholder {
    color: ${(p) => p.theme.muted};
  }

  &:focus {
    border-color: ${(p) => p.theme.accent}80;
  }
`;

const SearchBtn = styled.button`
  background: ${(p) => p.theme.accent};
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 160ms;

  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* ── user cards ─────────────────────────────────────────────────────────── */

const UserList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const UserCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 14px;
  padding: 18px 20px;
`;

const UserTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
`;

const UserEmail = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: ${(p) => p.theme.text};
  word-break: break-all;
`;

const UserMeta = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.muted};
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 14px;
`;

const RolesRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const Badge = styled.span<{ $color: string }>`
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 6px;
  background: ${(p) => p.$color}18;
  color: ${(p) => p.$color};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const RoleBtn = styled.button<{ $danger?: boolean }>`
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 8px;
  border: 1px solid
    ${(p) => (p.$danger ? (p.theme.error ?? "#ef4444") : p.theme.accent)}40;
  background: transparent;
  color: ${(p) => (p.$danger ? p.theme.error ?? "#ef4444" : p.theme.accent)};
  cursor: pointer;
  transition: background 160ms, color 160ms;

  &:hover {
    background: ${(p) =>
      p.$danger ? (p.theme.error ?? "#ef4444") : p.theme.accent};
    color: #fff;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;

    &:hover {
      background: transparent;
      color: ${(p) =>
        p.$danger ? p.theme.error ?? "#ef4444" : p.theme.accent};
    }
  }
`;

/* ── messages ──────────────────────────────────────────────────────────── */

const ErrorMsg = styled.div`
  color: ${(p) => p.theme.error ?? "#ef4444"};
  font-size: 14px;
  padding: 14px 16px;
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 12px;
`;

const InfoMsg = styled.div`
  font-size: 14px;
  color: ${(p) => p.theme.muted};
  padding: 14px 16px;
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 12px;
  text-align: center;
`;

const Toast = styled.div<{ $type: "success" | "error" }>`
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: ${(p) => (p.$type === "success" ? "#22c55e" : "#ef4444")};
  z-index: 9999;
  animation: ${fadeUp} 300ms ease both;
`;

/* ── types ──────────────────────────────────────────────────────────────── */

type UserResult = {
  id: string;
  email: string;
  createdAt: string;
  lastSignIn: string | null;
  roles: string[];
};

/* ── component ──────────────────────────────────────────────────────────── */

export default function AdminUsersClient() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // Check admin on mount
  const [checked, setChecked] = useState(false);
  React.useEffect(() => {
    requireAdminServer().then((r) => {
      if (!r.ok) {
        const msgs: Record<string, string> = {
          not_signed_in: "You must be signed in to view this page.",
          not_admin: "You do not have admin access.",
          verification_failed: "Could not verify admin role.",
        };
        setAuthError(msgs[r.reason] ?? "Access denied.");
      }
      setChecked(true);
    });
  }, []);

  const showToast = useCallback(
    (msg: string, type: "success" | "error") => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
    },
    []
  );

  async function getToken() {
    const sb = supabaseBrowser();
    const { data } = await sb.auth.getSession();
    return data.session?.access_token;
  }

  async function searchUsers(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || query.trim().length < 2) return;

    setLoading(true);
    setSearched(true);

    try {
      const token = await getToken();
      if (!token) {
        setAuthError("Session expired.");
        return;
      }

      const res = await fetch(
        `/api/admin/users?email=${encodeURIComponent(query.trim())}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        const json = await res.json();
        showToast(json.error ?? "Search failed", "error");
        return;
      }

      const data = await res.json();
      setUsers(data.users);
    } catch {
      showToast("Search failed", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleRole(
    userId: string,
    role: string,
    action: "grant" | "revoke"
  ) {
    const key = `${userId}-${role}-${action}`;
    setActionLoading(key);

    try {
      const token = await getToken();
      if (!token) {
        showToast("Session expired", "error");
        return;
      }

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, role, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error ?? "Action failed", "error");
        return;
      }

      showToast(data.message, "success");

      // Update local state
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          const roles =
            action === "grant"
              ? [...new Set([...u.roles, role])]
              : u.roles.filter((r) => r !== role);
          return { ...u, roles };
        })
      );
    } catch {
      showToast("Action failed", "error");
    } finally {
      setActionLoading(null);
    }
  }

  if (!checked) {
    return (
      <Page>
        <InfoMsg>Loading...</InfoMsg>
      </Page>
    );
  }

  if (authError) {
    return (
      <Page>
        <ErrorMsg>{authError}</ErrorMsg>
      </Page>
    );
  }

  const roleColor = (role: string) => {
    if (role === "admin") return "#ef4444";
    if (role === "pro") return "#8b5cf6";
    return "#6b7280";
  };

  const formatDate = (d: string | null) => {
    if (!d) return "Never";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Page>
      <Header>
        <BackLink href="/admin">&larr; Back to Dashboard</BackLink>
        <Title>User Management</Title>
        <Subtitle>
          Search users by email and manage their roles.
        </Subtitle>
      </Header>

      <SearchRow onSubmit={searchUsers}>
        <SearchInput
          type="text"
          placeholder="Search by email address..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <SearchBtn type="submit" disabled={loading || query.trim().length < 2}>
          {loading ? "Searching..." : "Search"}
        </SearchBtn>
      </SearchRow>

      {searched && users.length === 0 && !loading && (
        <InfoMsg>No users found matching &quot;{query}&quot;</InfoMsg>
      )}

      <UserList>
        {users.map((u) => (
          <UserCard key={u.id}>
            <UserTop>
              <UserEmail>{u.email}</UserEmail>
            </UserTop>

            <UserMeta>
              <span>Joined: {formatDate(u.createdAt)}</span>
              <span>Last sign-in: {formatDate(u.lastSignIn)}</span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 11,
                  opacity: 0.5,
                }}
              >
                {u.id.slice(0, 8)}...
              </span>
            </UserMeta>

            <RolesRow>
              {/* Current roles */}
              {u.roles.length > 0 ? (
                u.roles.map((r) => (
                  <Badge key={r} $color={roleColor(r)}>
                    {r}
                  </Badge>
                ))
              ) : (
                <Badge $color="#6b7280">free</Badge>
              )}

              {/* Divider */}
              <span
                style={{
                  width: 1,
                  height: 20,
                  background: "currentColor",
                  opacity: 0.15,
                  margin: "0 4px",
                }}
              />

              {/* Action buttons */}
              {!u.roles.includes("admin") && (
                <RoleBtn
                  onClick={() => handleRole(u.id, "admin", "grant")}
                  disabled={actionLoading === `${u.id}-admin-grant`}
                >
                  {actionLoading === `${u.id}-admin-grant`
                    ? "..."
                    : "+ Admin"}
                </RoleBtn>
              )}
              {u.roles.includes("admin") && (
                <RoleBtn
                  $danger
                  onClick={() => handleRole(u.id, "admin", "revoke")}
                  disabled={actionLoading === `${u.id}-admin-revoke`}
                >
                  {actionLoading === `${u.id}-admin-revoke`
                    ? "..."
                    : "- Admin"}
                </RoleBtn>
              )}

              {!u.roles.includes("pro") && (
                <RoleBtn
                  onClick={() => handleRole(u.id, "pro", "grant")}
                  disabled={actionLoading === `${u.id}-pro-grant`}
                >
                  {actionLoading === `${u.id}-pro-grant` ? "..." : "+ Pro"}
                </RoleBtn>
              )}
              {u.roles.includes("pro") && (
                <RoleBtn
                  $danger
                  onClick={() => handleRole(u.id, "pro", "revoke")}
                  disabled={actionLoading === `${u.id}-pro-revoke`}
                >
                  {actionLoading === `${u.id}-pro-revoke` ? "..." : "- Pro"}
                </RoleBtn>
              )}
            </RolesRow>
          </UserCard>
        ))}
      </UserList>

      {toast && <Toast $type={toast.type}>{toast.msg}</Toast>}
    </Page>
  );
}
