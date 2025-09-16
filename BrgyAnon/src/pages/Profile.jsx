// src/pages/Profile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiUser,
  FiMapPin,
  FiAlertTriangle,
  FiClock,
  FiImage,
  FiPlusCircle,
  FiArrowLeft,
} from "react-icons/fi";

const LS_PROFILE_NAME = "brgy_profile_name";

export default function Profile() {
  const [posts, setPosts] = useState([]);
  const [profileName, setProfileName] = useState(() => {
    // load a previously locked name if it exists
    return localStorage.getItem(LS_PROFILE_NAME) || "";
  });

  useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem("brgy_posts") || "[]");
      setPosts(all);
    } catch {
      setPosts([]);
    }
  }, []);

  // Your reports
  const myPosts = useMemo(
    () => posts.filter((p) => p?.userId === "me" || p?.userId === "guest"),
    [posts]
  );

  // Lock the name from the *first ever* report (earliest createdAt).
  // Only runs if there's no locked name yet.
  useEffect(() => {
    if (profileName) return; // already locked
    if (myPosts.length === 0) return;

    const first =
      myPosts
        .slice()
        .sort((a, b) => (a?.createdAt || 0) - (b?.createdAt || 0))[0] || {};
    const name =
      (typeof first.userName === "string" && first.userName.trim()) || "User";

    try {
      localStorage.setItem(LS_PROFILE_NAME, name);
    } catch {}
    setProfileName(name);
  }, [myPosts, profileName]);

  const displayName = profileName || "User";

  // Safer "Last Submitted" (max createdAt)
  const lastSubmitted = useMemo(() => {
    if (myPosts.length === 0) return "—";
    const latest = Math.max(...myPosts.map((p) => Number(p?.createdAt || 0)));
    return latest > 0 ? new Date(latest).toLocaleString() : "—";
  }, [myPosts]);

  return (
    <div className="min-h-screen bg-[var(--color-secondary)] text-[var(--color-text)]">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 sm:py-10">
        {/* Top actions */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-white ring-1 ring-black/10 px-3 py-2 hover:bg-black/5"
            title="Back to Home"
          >
            <FiArrowLeft /> Back to Dashboard
          </Link>
          <Link
            to="/dashboard/newreport"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
            title="Create a new report"
          >
            <FiPlusCircle /> New Report
          </Link>
        </div>

        {/* PROFILE HEADER */}
        <section className="rounded-3xl overflow-hidden ring-1 ring-black/10 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white">
          <div className="px-6 sm:px-10 py-8 sm:py-10 text-center">
            <div className="mx-auto h-24 w-24 rounded-full grid place-items-center bg-white/15 ring-1 ring-white/30">
              <FiUser className="text-4xl" aria-hidden="true" />
            </div>
            <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold">
              {displayName}
            </h1>
            <p className="mt-1 text-white/85">Your Barangay Portal profile</p>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
              <StatPill label="Reports Submitted" value={myPosts.length} />
              <StatPill label="Last Submitted" value={lastSubmitted} />
              <StatPill label="Status" value="Active" />
            </div>
          </div>
        </section>

        {/* REPORT HISTORY */}
        <section className="mt-6 rounded-3xl bg-white ring-1 ring-black/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-black/10 text-center font-semibold text-[var(--color-primary)]">
            Report History
          </div>

          {myPosts.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="p-4 sm:p-6 grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2">
              {myPosts
                .slice()
                .sort((a, b) => (b?.createdAt || 0) - (a?.createdAt || 0))
                .map((p) => (
                  <li key={p.id} className="h-full">
                    <article className="h-full rounded-2xl ring-1 ring-black/10 bg-white p-5 sm:p-6">
                      <div className="flex flex-col items-center text-center h-full">
                        {/* Issue icon */}
                        <div className="h-12 w-12 rounded-full grid place-items-center
                                        bg-[var(--color-secondary)] text-[var(--color-primary)] ring-1 ring-black/10">
                          <FiAlertTriangle aria-hidden="true" />
                        </div>

                        {/* Title & time */}
                        <h3 className="mt-3 text-lg font-semibold text-[var(--color-primary)]">
                          {p.issue || "Issue"}
                        </h3>
                        <div className="mt-1 text-xs text-black/60 inline-flex items-center gap-1">
                          <FiClock className="opacity-70" />
                          {p?.createdAt ? new Date(p.createdAt).toLocaleString() : "—"}
                        </div>

                        {/* Location */}
                        {p.location && (
                          <div className="mt-1 text-sm text-black/70 inline-flex items-center gap-1">
                            <FiMapPin className="opacity-70" />
                            {p.location}
                          </div>
                        )}

                        {/* Description */}
                        {p.desc && (
                          <p className="mt-3 text-sm mx-auto max-w-xl">{p.desc}</p>
                        )}

                        {/* Image */}
                        {p.imageUrl && (
                          <div className="mt-3 w-full">
                            <div className="mx-auto h-6 w-6 grid place-items-center rounded-md bg-black/5">
                              <FiImage className="text-[var(--color-primary)]" />
                            </div>
                            <img
                              src={p.imageUrl}
                              alt="Attachment"
                              className="mt-2 mx-auto h-44 w-full object-cover rounded-lg ring-1 ring-black/10"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="mt-auto" />
                      </div>
                    </article>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/* ---------- small components ---------- */

function StatPill({ label, value }) {
  return (
    <div className="rounded-xl px-4 py-3 bg-white/10 ring-1 ring-white/20 text-white text-center">
      <div className="text-[11px] uppercase tracking-wide text-white/80">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto h-12 w-12 rounded-full grid place-items-center
                      bg-[var(--color-secondary)] text-[var(--color-primary)] ring-1 ring-black/10">
        <FiAlertTriangle />
      </div>
      <h4 className="mt-3 text-lg font-semibold text-[var(--color-primary)]">
        No reports yet
      </h4>
      <p className="text-sm text-black/70">
        When you submit a report, it will appear here.
      </p>
      <Link
        to="/dashboard/newreport"
        className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold
                   bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
      >
        <FiPlusCircle /> Create your first report
      </Link>
    </div>
  );
}
