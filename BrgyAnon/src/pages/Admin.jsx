// src/pages/Admin.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiChevronDown,
  FiSearch,
  FiMapPin,
  FiClock,
  FiCheck,
  FiX,
  FiEye,
  FiLogOut,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const LS_POSTS = "brgy_posts";
const LS_ROLE = "brgy_role";
const LS_IS_ADMIN = "brgy_is_admin";

export const STATUSES = [
  "Awaiting Approval",
  "Received",
  "In Progress",
  "Resolved",
  "Rejected",
];



const handleArchiveUser = async (user) => {
try {
    // Step 1: Restore to active users
    await setDoc(doc(db, "users", user.id), {
      ...user,
      restoredAt: serverTimestamp(),
      isActive: true,
      archived: false,
    });

    // Step 2: Delete from archive
    await deleteDoc(doc(db, "archiveUsers", user.id));

    showNotification(`${user.displayName || "User"} restored successfully!`);

    // Step 3: Update UI
    setArchivedUsers((prev) => prev.filter((u) => u.id !== user.id));
    setUsers((prev) => [
      ...prev.filter((u) => u.id !== user.id),
      { ...user, isActive: true },
    ]);
  } catch (error) {
    console.error("Error restoring user:", error);
  }
};

function normalizeStatus(s) {
  if (!s) return "Awaiting Approval"; // default safeguard
  const v = String(s).toLowerCase();
  if (v.includes("await")) return "Awaiting Approval";
  if (v.includes("progress")) return "In Progress";
  if (v.includes("resolve")) return "Resolved";
  if (v.includes("receive")) return "Received";
  if (v.includes("reject")) return "Rejected";
  return "Awaiting Approval"; // fallback to Awaiting if unknown
}

export default function Admin() {
  const navigate = useNavigate();
const [users, setUsers] = useState([]);
const [archivedUsers, setArchivedUsers] = useState([]);

  const [posts, setPosts] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Reports");
  const [details, setDetails] = useState(null);
  const [showLogout, setShowLogout] = useState(false);

  // Reject modal state
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // Load posts
 const load = useCallback(() => {
    try {
      const raw = localStorage.getItem(LS_POSTS);
      if (!raw) {
        setPosts([]);
        return;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setPosts([]);
        return;
      }

      const shaped = parsed.map((p) => ({
        ...p,
        status: normalizeStatus(p.status || "Awaiting Approval"),
      }));

      setPosts(
        shaped.sort((a, b) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0))
      );
    } catch (err) {
      console.error("Error loading posts:", err);
      setPosts([]);
    }
  }, []);

  useEffect(() => {
  const isAdmin = localStorage.getItem(LS_IS_ADMIN) === "true";
  if (!isAdmin) {
    navigate("/login", { replace: true });
  }
}, [navigate]);


  useEffect(() => {
    load();
    const onStorage = (e) => e.key === LS_POSTS && load();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [load]);

  // Persist
  const persist = (next) => {
    const sorted = next.sort(
      (a, b) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0)
    );
    localStorage.setItem(LS_POSTS, JSON.stringify(sorted));
    setPosts(sorted);
  };

  // Counts
  const counts = useMemo(() => {
    const c = {
      "Awaiting Approval": 0,
      Received: 0,
      "In Progress": 0,
      Resolved: 0,
      Rejected: 0,
    };
    posts.forEach((p) => {
      const s = normalizeStatus(p.status);
      c[s] = (c[s] || 0) + 1;
    });
    return c;
  }, [posts]);

  // Filtering
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      const status = normalizeStatus(p.status);
      let statusOk = false;

      if (filter === "All") {
        statusOk = true;
      } else if (filter === "Reports") {
        // Reports only shows accepted reports
        statusOk = ["Received", "In Progress", "Resolved"].includes(status);
      } else {
        statusOk = status === filter;
      }

      const hit =
        !q ||
        (p.issue || "").toLowerCase().includes(q) ||
        (p.location || "").toLowerCase().includes(q) ||
        (p.desc || "").toLowerCase().includes(q) ||
        (p.userName || "").toLowerCase().includes(q);

      return statusOk && hit;
    });
  }, [posts, query, filter]);

  // Status updates
  const setStatus = (id, status) => {
    const next = posts.map((p) =>
      p.id === id
        ? { ...p, status: normalizeStatus(status), statusUpdatedAt: Date.now() }
        : p
    );
    persist(next);
  };

   const acceptReport = (id) => setStatus(id, "Received");
  const markResolved = (id) => setStatus(id, "Resolved");

  const rejectReport = (post, reason) => {
    const next = posts.map((p) =>
      p.id === post.id
        ? {
            ...p,
            status: "Rejected",
            rejectionReason: reason,
            statusUpdatedAt: Date.now(),
          }
        : p
    );
    persist(next);
  };

  // Logout
  function handleLogout() {
    try {
      localStorage.removeItem(LS_ROLE);
      localStorage.removeItem(LS_IS_ADMIN);
    } catch {}
    navigate("/login", { replace: true });
  }

    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-slate-100">
      {/* HEADER */}
      <header className="sticky top-0 z-20 backdrop-blur bg-slate-900/80 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 grid place-items-center rounded-lg bg-white/10 ring-1 ring-white/10">
              <span className="text-xs font-bold">ADM</span>
            </div>
            <div>
              <div className="font-semibold">Admin Dashboard</div>
              <div className="text-xs text-white/60 -mt-0.5">
                Manage community reports
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search reports…"
                className="w-64 rounded-xl bg-white/5 text-white placeholder-white/40 px-9 py-2 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-400/60"
              />
            </div>
            <button
              onClick={() => setShowLogout(true)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold bg-amber-400 text-slate-900 hover:bg-amber-300"
            >
              <FiLogOut /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Layout */}
      <div className="mx-auto max-w-7xl grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] px-4 sm:px-6 py-6">
        {/* Sidebar */}
        <aside className="space-y-4 self-start lg:sticky lg:top-20">
          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 font-semibold flex items-center gap-2">
              📊 Dashboard
            </div>
            <nav className="p-2">
              <SideLink
                active={filter === "Reports"}
                onClick={() => setFilter("Reports")}
              >
                Reports
              </SideLink>
              <SideLink
                active={filter === "Awaiting Approval"}
                onClick={() => setFilter("Awaiting Approval")}
              >
                Awaiting Approval
              </SideLink>
              <SideLink
                active={filter === "Received"}
                onClick={() => setFilter("Received")}
              >
                Received
              </SideLink>
              <SideLink
                active={filter === "In Progress"}
                onClick={() => setFilter("In Progress")}
              >
                In Progress
              </SideLink>
              <SideLink
                active={filter === "Resolved"}
                onClick={() => setFilter("Resolved")}
              >
                Resolved
              </SideLink>
              <SideLink
                active={filter === "Rejected"}
                onClick={() => setFilter("Rejected")}
              >
                Rejected
              </SideLink>
              
              <SideLink
                active={filter === "Archive"}
                onClick={() => navigate("/archive")}  // 🔑 redirect sa Archive.jsx
              >
                Archive
              </SideLink>
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="space-y-5">
          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Awaiting"
              value={counts["Awaiting Approval"]}
              grad="from-amber-700 to-amber-500"
              textDark
            />
            <StatCard
              label="Received"
              value={counts["Received"]}
              grad="from-indigo-700 to-indigo-500"
              textDark
            />
            <StatCard
              label="In Progress"
              value={counts["In Progress"]}
              grad="from-emerald-700 to-emerald-600"
              textDark
            />
            <StatCard
              label="Resolved"
              value={counts["Resolved"]}
              grad="from-slate-700 to-slate-400"
              textDark
            />
            <StatCard
              label="Rejected"
              value={counts["Rejected"]}
              grad="from-rose-700 to-rose-500"
              textDark
            />
          </div>
          {/* Report list */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-10 text-center text-white/70">
              No matching reports.
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((p) => (
                <ReportRow
                  key={p.id}
                  post={p}
                  onAccept={() => acceptReport(p.id)}
                  onReject={() => setRejecting(p)}
                  onUpdate={(status) => setStatus(p.id, status)}
                  onResolved={() => markResolved(p.id)}
                  onView={() => setDetails(p)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

    {/* ✅ LOGOUT MODAL FIXED */}
      <AnimatePresence>
        {showLogout && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowLogout(false)}
            />
            <motion.div
              className="relative z-10 w-full max-w-md rounded-2xl bg-slate-900 text-slate-100 p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold text-emerald-400">
                Confirm Logout
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                Are you sure you want to log out?
              </p>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowLogout(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Components ---------------- */

function SideLink({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl px-3 py-2 ${
        active
          ? "bg-emerald-500 text-white ring-1 ring-emerald-300"
          : "text-slate-200 hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value, grad }) {
  return (
    <div className="h-32 rounded-2xl overflow-hidden ring-1 ring-white/10 bg-white/5 flex">
      <div
        className={`flex flex-col justify-center px-6 w-full bg-gradient-to-r ${grad} text-slate-900`}
      >
        <div className="text-4xl font-extrabold">{value}</div>
        <div className="mt-1 text-lg font-medium">{label}</div>
      </div>
    </div>
  );
}

function ReportRow({ post, onAccept, onReject, onUpdate, onResolved, onView }) {
  const current = normalizeStatus(post.status);
  const [nextStatus, setNextStatus] = useState(current);
  const awaiting = current === "Awaiting Approval";
  const inProgress = current === "In Progress";
  const resolved = current === "Resolved";
  const unchanged = nextStatus === current;

  return (
    <article className="rounded-2xl bg-white ring-1 ring-black/10 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:justify-between">
        {/* Left info */}
        <div>
          <h3 className="text-lg font-bold text-slate-900">{post.issue}</h3>
          {post.location && (
            <div className="text-sm text-slate-600 flex items-center gap-1">
              <FiMapPin className="opacity-70" /> {post.location}
            </div>
          )}
          <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            <FiClock className="opacity-70" />{" "}
            {new Date(post.createdAt).toLocaleString()}
          </div>
          <div className="mt-2">
            <span className="text-sm text-slate-600">Status: </span>
            <StatusBadge status={current} lightCard />
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {awaiting ? (
            <>
              <button
                onClick={onAccept}
                className="inline-flex items-center gap-2 w-24 justify-center px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <FiCheck /> Accept
              </button>
              <button
                onClick={onReject}
                className="inline-flex items-center gap-2 w-24 justify-center px-3 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700"
              >
                <FiX /> Reject
              </button>
            </>
          ) : inProgress ? (
            <>
              <button
                onClick={onResolved}
                className="px-5 py-2 rounded-xl bg-slate-600 text-white hover:bg-slate-700"
              >
                ✅ Mark as Resolved
              </button>
              <button
                onClick={onView}
                className="inline-flex gap-2 w-24 justify-center px-3 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700"
              >
                <FiEye /> View
              </button>
            </>
          ) : resolved ? (
            <div className="text-center text-sm text-slate-600 font-medium bg-slate-100 rounded-xl px-4 py-2">
              🟢 This report is Resolved
            </div>
          ) : (
            <>
              <div className="relative">
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  className="w-44 rounded-xl bg-white text-slate-900 pr-9 pl-3 py-2 text-sm ring-1 ring-slate-300 outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {["Received", "In Progress"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
              <button
                onClick={() => !unchanged && onUpdate(nextStatus)}
                disabled={unchanged}
                className="px-3 py-2 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Update
              </button>
              <button
                onClick={onView}
                className="inline-flex gap-2 w-24 justify-center px-3 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700"
              >
                <FiEye /> View
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status, lightCard = false }) {
  const s = normalizeStatus(status);
  const mapLight = {
    "Awaiting Approval": "bg-amber-50 text-amber-800 ring-amber-200",
    Received: "bg-indigo-50 text-indigo-800 ring-indigo-200",
    "In Progress": "bg-emerald-50 text-emerald-800 ring-emerald-200",
    Resolved: "bg-slate-100 text-slate-800 ring-slate-300",
    Rejected: "bg-rose-50 text-rose-800 ring-rose-200",
  };
  const cls = mapLight[s] || "bg-white/10 text-white/70 ring-white/10";
  const dot =
    s === "Awaiting Approval"
      ? "bg-amber-400"
      : s === "Received"
      ? "bg-indigo-400"
      : s === "In Progress"
      ? "bg-emerald-400"
      : s === "Resolved"
      ? "bg-slate-400"
      : "bg-rose-400";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ring-1 ${cls}`}
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {s}
    </span>
  );
}
