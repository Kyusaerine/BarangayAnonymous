// src/components/AuthHeader.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiRss,
  FiLogOut,
  FiUsers,
  FiBell,
  FiX,
  FiCheckCircle,
} from "react-icons/fi";

const LS_POSTS = "brgy_posts";
const LS_NOTIF_READ_AT = "brgy_notif_read_at";

export default function AuthHeader() {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [posts, setPosts] = useState([]);
  const [readAt, setReadAt] = useState(() => Number(localStorage.getItem(LS_NOTIF_READ_AT) || 0));

  // ---- load posts + keep fresh on storage changes ----
  const loadPosts = useCallback(() => {
    try {
      const all = JSON.parse(localStorage.getItem(LS_POSTS) || "[]");
      setPosts(Array.isArray(all) ? all : []);
    } catch {
      setPosts([]);
    }
  }, []);
  useEffect(() => {
    loadPosts();
    const onStorage = (e) => e.key === LS_POSTS && loadPosts();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [loadPosts]);

  // ---- notifications derived from posts ----
  const notifications = useMemo(() => {
    const list = posts.map((p) => ({
      id: p.id,
      issue: p.issue || "Issue",
      status: normalizeStatus(p.status),
      when: Number(p.statusUpdatedAt || p.createdAt || 0),
    }));
    // newest first
    return list.sort((a, b) => (b.when || 0) - (a.when || 0));
  }, [posts]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => (n.when || 0) > readAt).length,
    [notifications, readAt]
  );

  function markAllRead() {
    const now = Date.now();
    localStorage.setItem(LS_NOTIF_READ_AT, String(now));
    setReadAt(now);
  }

  // ---- logout confirm ----
  const doLogout = useCallback(() => {
    try {
      localStorage.removeItem("guest_session");
      // localStorage.removeItem("auth_token");
    } catch {}
    setShowConfirm(false);
    navigate("/login", { replace: true });
  }, [navigate]);

  // ESC closes overlays
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setShowConfirm(false);
        setShowNotif(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-black/10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16">
          {/* Left: brand */}
          <Link to="/dashboard" className="flex items-center gap-2 justify-self-start">
            <div className="h-8 w-8 rounded-full grid place-items-center bg-[var(--color-primary)] text-white font-bold">
              B
            </div>
            <span className="hidden sm:block font-semibold text-[var(--color-text)]">
              Barangay Portal
            </span>
          </Link>

          {/* Center: nav */}
          <nav
            aria-label="Primary"
            className="justify-self-center rounded-full bg-[var(--color-secondary)] ring-1 ring-black/10 p-1 flex items-center gap-2"
          >
            <PillLink to="/dashboard/reportfeed" icon={FiRss} label="Report Feed" />
            <PillLink to="/dashboard/profile" icon={FiUser} label="Profile" />
            <PillLink to="/dashboard/officials" icon={FiUsers} label="Barangay Officials" />
          </nav>

          {/* Right: actions */}
          <div className="justify-self-end flex items-center gap-2">
            {/* Notifications */}
            <button
              onClick={() => setShowNotif((s) => !s)}
              title="Notifications"
              aria-label="Notifications"
              className="relative h-10 w-10 grid place-items-center rounded-xl
                         text-[var(--color-text)] ring-1 ring-black/10 hover:bg-black/5 transition
                         outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              <FiBell className="text-base" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 rounded-full text-[10px] font-semibold
                                 grid place-items-center bg-[var(--color-primary)] text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={() => setShowConfirm(true)}
              title="Log out"
              aria-label="Log out"
              className="h-10 w-10 grid place-items-center rounded-xl
                         text-[var(--color-text)] ring-1 ring-black/10
                         hover:bg-black/5 transition
                         outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              <FiLogOut className="text-base" />
            </button>
          </div>
        </div>
      </div>

      {/* -------- Notifications Panel (top-right) -------- */}
      {showNotif &&
        createPortal(
          <>
            {/* click-away overlay */}
            <div className="fixed inset-0 z-[1000]" onClick={() => setShowNotif(false)} />
            {/* panel */}
            <div className="fixed right-4 top-16 z-[1001] w-[22rem] max-w-[90vw]">
              <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
                  <h3 className="font-semibold text-[var(--color-primary)]">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <span className="text-xs text-black/60">{unreadCount} new</span>
                    )}
                    <button
                      onClick={markAllRead}
                      className="text-xs font-semibold rounded-lg px-2 py-1 ring-1 ring-black/10 hover:bg-black/5"
                      title="Mark all as read"
                    >
                      Mark all as read
                    </button>
                    <button
                      onClick={() => setShowNotif(false)}
                      className="h-9 w-9 grid place-items-center rounded-xl hover:bg-black/5"
                      aria-label="Close"
                      title="Close"
                    >
                      <FiX />
                    </button>
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-black/60">
                    No notifications yet.
                  </div>
                ) : (
                  <ul className="max-h-[60vh] overflow-auto divide-y divide-black/5">
                    {notifications.slice(0, 12).map((n) => (
                      <li key={`${n.id}-${n.when}`} className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <StatusDot status={n.status} />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm">
                              <span className="font-semibold">{n.issue}</span>{" "}
                              <span className="text-black/70">is</span>{" "}
                              <StatusBadgeInline status={n.status} />
                            </div>
                            <div className="text-[11px] text-black/60 mt-0.5">
                              {n.when ? new Date(n.when).toLocaleString() : "—"}
                            </div>
                          </div>
                          {(n.when || 0) > readAt && (
                            <span className="shrink-0 mt-1 inline-flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30">
                              New
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="px-4 py-3 border-t border-black/10 flex items-center justify-between">
                  <span className="text-xs text-black/60">Statuses set by admin</span>
                  <Link
                    to="/dashboard/reportfeed"
                    onClick={() => setShowNotif(false)}
                    className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-semibold
                               bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                  >
                    View Feed
                  </Link>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}

      {/* -------- Logout Confirm (centered) -------- */}
      {showConfirm &&
        createPortal(
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={() => setShowConfirm(false)} />
            <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white ring-1 ring-black/10 shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
                <h2 className="font-semibold text-[var(--color-primary)]">Confirm Logout</h2>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="h-9 w-9 grid place-items-center rounded-xl hover:bg-black/5"
                  aria-label="Close"
                  title="Close"
                >
                  <FiX />
                </button>
              </div>
              <div className="px-5 py-4 text-sm text-black/80 text-center">
                Do you want to continue logging out?
              </div>
              <div className="px-5 pb-5 flex gap-2 justify-end">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="inline-flex justify-center rounded-xl px-4 py-2 font-semibold ring-1 ring-black/10 hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  onClick={doLogout}
                  className="inline-flex justify-center rounded-xl px-4 py-2 font-semibold
                             bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}

/* ---------------- helpers ---------------- */

function PillLink({ to, icon: Icon, label, exact = false }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        [
          "group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition",
          "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
          isActive ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-text)] hover:bg-black/5",
        ].join(" ")
      }
      aria-label={label}
      title={label}
    >
      <Icon className="text-base" aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </NavLink>
  );
}

function normalizeStatus(s) {
  const v = String(s || "").toLowerCase();
  if (v.includes("progress")) return "In Progress";
  if (v.includes("resolve")) return "Resolved";
  if (v) return s; // keep custom values
  return "Received";
}

function StatusDot({ status }) {
  const { bg, ring } = statusColors(status);
  return <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${bg} ring-2 ${ring} ring-offset-2 ring-offset-white`} />;
}

function StatusBadgeInline({ status }) {
  const { text, bg, ring } = statusColors(status);
  return (
    <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 ${bg} ${ring} ${text}`}>
      <FiCheckCircle className="opacity-80" />
      {status}
    </span>
  );
}

function statusColors(status) {
  switch (normalizeStatus(status)) {
    case "In Progress":
      return { text: "text-amber-800", bg: "bg-amber-50", ring: "ring-1 ring-amber-200" };
    case "Resolved":
      return { text: "text-emerald-800", bg: "bg-emerald-50", ring: "ring-1 ring-emerald-200" };
    default: // Received
      return { text: "text-sky-800", bg: "bg-sky-50", ring: "ring-1 ring-sky-200" };
  }
}
