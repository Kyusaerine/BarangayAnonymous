// src/pages/BarangayOfficials.jsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { officials } from "../data/officials.js";
import {
  FiUsers,
  FiUser,
  FiSearch,
  FiMapPin,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiDownload,
  FiGrid,
  FiList,
  FiFilter,
  FiRotateCw,
  FiHome,
} from "react-icons/fi";
import { FiArrowLeft } from "react-icons/fi";


export default function BarangayOfficials() {
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("All");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("name-asc");
  const [view, setView] = useState("grid");

  const total = officials.length;
  const activeCount = officials.filter((o) => o.status === "Active").length;

  const positions = useMemo(() => {
    const s = new Set(officials.map((o) => o.position).filter(Boolean));
    return ["All", ...Array.from(s)];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = officials.filter((o) => {
      const hit =
        !q ||
        o.name?.toLowerCase().includes(q) ||
        o.position?.toLowerCase().includes(q) ||
        o.purok?.toLowerCase().includes(q);
      const posOk = position === "All" || o.position === position;
      const statOk = status === "All" || o.status === status;
      return hit && posOk && statOk;
    });

    switch (sort) {
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        list.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "status":
        list.sort((a, b) => a.status.localeCompare(b.status));
        break;
      default:
        break;
    }
    return list;
  }, [query, position, status, sort]);

  function resetFilters() {
    setQuery("");
    setPosition("All");
    setStatus("All");
    setSort("name-asc");
  }

  function exportCSV() {
    const headers = ["Name", "Position", "Term", "Status", "Purok", "Photo"];
    const rows = filtered.map((o) => [
      csvSafe(o.name),
      csvSafe(o.position),
      csvSafe(o.term),
      csvSafe(o.status),
      csvSafe(o.purok),
      csvSafe(o.photo),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "barangay_officials.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen text-[var(--color-text)]">
      {/* HERO */}
      <section className="relative overflow-hidden ring-black/10 rounded-m">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)]" />
        <svg
          aria-hidden="true"
          className="absolute inset-0 opacity-10"
          width="100%"
          height="100%"
        >
          <defs>
            <pattern
              id="dots2"
              width="28"
              height="28"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="3" cy="3" r="2" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots2)" />
        </svg>

        <div className="relative px-6 sm:px-8 py-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl grid place-items-center bg-white/20 ring-1 ring-white/40">
                <FiUsers className="text-xl" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold">
                  Barangay Officials Directory
                </h1>
                <p className="text-white/85 text-sm">
                  Meet your barangay’s elected officials
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/dashboard"
                className=" inline-flex items-center gap-2 rounded-xl
                     bg-white/15 ring-1 ring-white/30 px-3 py-2 hover:bg-white/25 text-white"
                title="Go to Home"
              >
                <FiArrowLeft /> Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BODY: sidebar + content */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* SIDEBAR */}
        <aside className="lg:sticky lg:top-4 self-start space-y-3">
          <div className="rounded-2xl bg-white ring-1 ring-black/10 p-4">
            <h3 className="font-semibold text-[var(--color-primary)] flex items-center gap-2">
              <FiFilter /> Refine Results
            </h3>

            <div className="mt-3 space-y-3">
              <label className="block text-xs font-semibold text-black/70">
                Search
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-black/50" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Name, position, purok…"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--color-secondary)] ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <label className="block text-xs font-semibold text-black/70">
                Position
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-secondary)] ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                {positions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <label className="block text-xs font-semibold text-black/70">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-secondary)] ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                {["All", "Active", "Not Active"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <label className="block text-xs font-semibold text-black/70">
                Sort by
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-secondary)] ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="name-asc">Name (A–Z)</option>
                <option value="name-desc">Name (Z–A)</option>
                <option value="status">Status</option>
              </select>

              <div className="pt-1 flex flex-wrap gap-2">
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-black/10 hover:bg-black/5"
                  title="Reset"
                >
                  <FiRotateCw /> Reset
                </button>
                <button
                  onClick={exportCSV}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold
                             bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                  title="Export CSV"
                >
                  <FiDownload /> Export
                </button>
              </div>
            </div>
          </div>

          <div className="hidden lg:block rounded-2xl bg-white ring-1 ring-black/10 p-4">
            <p className="text-xs font-semibold text-black/70">View</p>
            <div className="mt-2 inline-flex rounded-xl ring-1 ring-black/10 overflow-hidden">
              <Toggle
                isActive={view === "grid"}
                onClick={() => setView("grid")}
                icon={<FiGrid />}
                label="Grid"
              />
              <Toggle
                isActive={view === "table"}
                onClick={() => setView("table")}
                icon={<FiList />}
                label="Table"
              />
            </div>
          </div>
        </aside>

        {/* CONTENT */}
        <main className="space-y-4">
          <div className="lg:hidden flex items-center justify-between gap-2">
            <div className="text-sm text-black/60">
              {filtered.length} result(s)
            </div>
            <div className="inline-flex rounded-xl ring-1 ring-black/10 overflow-hidden">
              <Toggle
                isActive={view === "grid"}
                onClick={() => setView("grid")}
                icon={<FiGrid />}
                label="Grid"
              />
              <Toggle
                isActive={view === "table"}
                onClick={() => setView("table")}
                icon={<FiList />}
                label="Table"
              />
            </div>
          </div>

          {view === "grid" && (
            <>
              {filtered.length === 0 ? (
                <Empty />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((o, i) => (
                    <OfficialCard key={`${o.id}-${i}`} o={o} />
                  ))}
                </div>
              )}
            </>
          )}

          {view === "table" && (
            <div className="rounded-2xl bg-white ring-1 ring-black/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[var(--color-primary)] text-white">
                    <tr>
                      <Th>Photo</Th>
                      <Th>Name</Th>
                      <Th>Position</Th>
                      <Th>Term</Th>
                      <Th>Status</Th>
                      <Th>Purok</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {filtered.map((o, i) => (
                      <tr key={`${o.id}-${i}`} className="hover:bg-black/2">
                        <Td>
                          {/* ICON ONLY — now green like Profile page */}
                          <div
                            className="h-10 w-10 rounded-full grid place-items-center
                                          bg-[var(--color-primary)] text-white ring-1 ring-black/10"
                          >
                            <FiUser className="text-base" />
                          </div>
                        </Td>
                        <Td className="font-medium">{o.name}</Td>
                        <Td className="inline-flex items-center gap-1">
                          <FiBriefcase className="opacity-60" /> {o.position}
                        </Td>
                        <Td className="inline-flex items-center gap-1">
                          <FiCalendar className="opacity-60" /> {o.term}
                        </Td>
                        <Td>
                          <StatusBadge status={o.status} />
                        </Td>
                        <Td className="inline-flex items-center gap-1">
                          <FiMapPin className="opacity-60" /> {o.purok}
                        </Td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-8 text-center text-black/60"
                        >
                          No matching officials found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </section>
    </div>
  );
}

/* ---------------- subcomponents ---------------- */

function HeroStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 ring-1 ring-white/30 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-white/85">
        {label}
      </div>
      <div className="text-white font-semibold text-lg">{value}</div>
    </div>
  );
}

function Toggle({ isActive, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={
        "inline-flex items-center gap-2 px-3 py-2 text-sm " +
        (isActive
          ? "bg-[var(--color-primary)] text-white"
          : "bg-white text-[var(--color-text)] hover:bg.black/5")
      }
      title={label}
      aria-pressed={isActive}
    >
      {icon} <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function OfficialCard({ o }) {
  return (
    <article className="rounded-2xl ring-1 ring-black/10 bg-white overflow-hidden group">
      <div className="h-16 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)]" />
      <div className="px-5 pb-5 -mt-8">
        {/* ICON-ONLY avatar — green like Profile */}
        <div
          className="h-20 w-20 rounded-full grid place-items-center -mt-6
                        bg-[var(--color-primary)] text-white ring-4 ring-white shadow"
        >
          <FiUser className="text-2xl" />
        </div>

        <div className="mt-3">
          <h3 className="font-semibold text-[var(--color-primary)]">
            {o.name}
          </h3>
          <div className="mt-0.5 text-sm text.black/80 inline-flex items-center gap-1">
            <FiBriefcase className="opacity-60" /> {o.position}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge icon={<FiCalendar />} text={o.term} />
          <Badge icon={<FiMapPin />} text={o.purok} />
        </div>
      </div>
    </article>
  );
}

function Badge({ icon, text }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ring-1 ring-black/10 bg-[var(--color-secondary)]">
      {icon}
      {text}
    </span>
  );
}

function StatusBadge({ status }) {
  const active = status === "Active";
  const cls = active
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : "bg-rose-50 text-rose-700 ring-rose-200";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ring-1 ${cls}`}
    >
      {active ? <FiCheckCircle /> : <FiXCircle />} {status}
    </span>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-black/10 p-10 text-center">
      <div
        className="mx-auto h-12 w-12 rounded-full grid place-items-center
                      bg-[var(--color-secondary)] text-[var(--color-primary)] ring-1 ring-black/10"
      >
        <FiUsers />
      </div>
      <h3 className="mt-3 font-semibold text-[var(--color-primary)]">
        No matching officials
      </h3>
      <p className="text-sm text-black/70">
        Try adjusting your search or filters.
      </p>
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="text-left px-4 py-2 text-[13px] font-semibold">
      {children}
    </th>
  );
}
function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}

/* ---------------- utils ---------------- */
function csvSafe(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
