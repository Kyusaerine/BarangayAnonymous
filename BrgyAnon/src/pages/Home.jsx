// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiMapPin,
  FiUsers,
  FiAlertTriangle,
  FiCheckCircle,
  FiImage,
  FiAlertCircle,
  FiCheckCircle as FiCheck,
} from "react-icons/fi";
import AuthHeader from "../components/AuthHeader.jsx"; // keep if you want the dashboard-style header

export default function Home() {
  const [counts, setCounts] = useState({ reports: 0, officials: 5 });
  const [showForm, setShowForm] = useState(false); // ⬅️ toggle state

  // quick-report state
  const [form, setForm] = useState({
    userName: "",
    issue: "",
    location: "",
    desc: "",
    imagePreview: "",
    imageDataUrl: "",
  });
  const [msg, setMsg] = useState({ type: "", text: "" });

  const issues = [
    "Road Damage",
    "Waste Management",
    "Street Lighting",
    "Water/Sanitation",
    "Noise/Disturbance",
    "Safety",
    "Others",
  ];

  useEffect(() => {
    try {
      const posts = JSON.parse(localStorage.getItem("brgy_posts") || "[]");
      setCounts((c) => ({ ...c, reports: posts.length }));
    } catch {}
  }, []);

  function handleImg(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const preview = URL.createObjectURL(f);
    const reader = new FileReader();
    reader.onload = () =>
      setForm((s) => ({ ...s, imagePreview: preview, imageDataUrl: reader.result }));
    reader.readAsDataURL(f);
  }

  function submitQuickReport(e) {
    e.preventDefault();
    if (!form.issue) return setMsg({ type: "error", text: "Please select an issue." });
    if (!form.desc || form.desc.trim().length < 10)
      return setMsg({ type: "error", text: "Please describe the issue (min 10 chars)." });

    const key = "brgy_posts";
    const prev = JSON.parse(localStorage.getItem(key) || "[]");
    const post = {
      id: (crypto?.randomUUID?.() || Date.now().toString()),
      userId: "guest",
      userName: form.userName || "Guest",
      issue: form.issue,
      location: form.location,
      desc: form.desc.trim(),
      imageUrl: form.imageDataUrl,
      createdAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify([post, ...prev]));
    setCounts((c) => ({ ...c, reports: c.reports + 1 }));
    setMsg({ type: "success", text: "Report submitted! View it in the feed." });

    setForm((s) => ({
      ...s,
      issue: "",
      location: "",
      desc: "",
      imagePreview: "",
      imageDataUrl: "",
    }));
  }

  return (
    <div className="min-h-screen bg-[var(--color-secondary)] text-[var(--color-text)]">
      {/* Optional: dashboard-style header */}
      <AuthHeader />

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 sm:pt-14">
        <div className="relative overflow-hidden rounded-3xl ring-1 ring-black/10">
          <img
            src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1920&auto=format&fit=crop"
            alt="Community view"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/70 to-[var(--color-primary-hover)]/60 mix-blend-multiply" />
          <div className="relative px-6 sm:px-12 py-12 sm:py-16 text-white">
            <div className="max-w-3xl space-y-4">
              <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs tracking-wide">
                Official Online Services
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
                Welcome to the <span className="underline decoration-white/40">Barangay Portal</span>
              </h1>
              <p className="text-white/90 sm:text-lg">
                Fast, transparent, and citizen-first services. Report issues, view announcements,
                and connect with your barangay—anytime, anywhere.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                {/* ⬇️ Toggle the form */}
                <button
                  type="button"
                  onClick={() => setShowForm((s) => !s)}
                  aria-expanded={showForm}
                  className="rounded-xl px-5 py-3 font-semibold bg-white text-[var(--color-primary)]
                             hover:bg-white/90 outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {showForm ? "Close Form" : "Report an Issue"}
                </button>

                <Link
                  to="/dashboard/reportfeed"
                  className="rounded-xl px-5 py-3 font-semibold bg-white/10 text-white ring-1 ring-white/40
                             hover:bg-white/15 outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  View Report Feed
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            color="bg-emerald-600"
            value={counts.reports}
            label="Community Reports"
            icon={<FiAlertTriangle />}
          />
          <StatCard
            color="bg-[var(--color-primary)]"
            value={counts.officials}
            label="Barangay Officials"
            icon={<FiUsers />}
          />
          <StatCard color="bg-yellow-500" value="24/7" label="Online Access" icon={<FiCheckCircle />} />
          <StatCard color="bg-sky-600" value="Local" label="Service Coverage" icon={<FiMapPin />} />
        </div>
      </section>

      {/* REPORT FORM — toggled */}
      {showForm && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-8 sm:pb-12">
          {/* Alert */}
          {msg.text && (
            <div
              className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
                msg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                  : "bg-rose-50 text-rose-800 ring-1 ring-rose-200"
              }`}
            >
              {msg.type === "success" ? <FiCheck className="shrink-0" /> : <FiAlertCircle className="shrink-0" />}
              <span className="flex-1">{msg.text}</span>
              {msg.type === "success" && (
                <Link
                  to="/dashboard/feed"
                  className="rounded-lg px-2.5 py-1.5 font-medium bg-white/60 hover:bg-white/80"
                >
                  Go to Feed
                </Link>
              )}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Form card */}
            <form
              onSubmit={submitQuickReport}
              className="rounded-2xl bg-white ring-1 ring-black/10 p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[var(--color-primary)]">Report an Issue</h2>
                <Link
                  to="/dashboard/new-report"
                  className="text-sm font-semibold text-[var(--color-primary)] hover:underline"
                >
                  Open full form
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Your Name</label>
                  <input
                    value={form.userName}
                    onChange={(e) => setForm((s) => ({ ...s, userName: e.target.value }))}
                    placeholder="e.g., Juan Dela Cruz"
                    className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Issue *</label>
                  <select
                    value={form.issue}
                    onChange={(e) => setForm((s) => ({ ...s, issue: e.target.value }))}
                    className="appearance-none w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="" disabled>Choose…</option>
                    {issues.map((i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Location</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))}
                  placeholder="e.g., Purok 2, Barangay…"
                  className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Description *</label>
                <textarea
                  value={form.desc}
                  onChange={(e) => setForm((s) => ({ ...s, desc: e.target.value }))}
                  rows={4}
                  placeholder="Briefly describe the issue…"
                  className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Photo (optional)</label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 rounded-xl px-4 py-2 ring-1 ring-black/10 hover:bg-black/5 cursor-pointer">
                    <FiImage />
                    <span>Upload image</span>
                    <input type="file" accept="image/*" hidden onChange={handleImg} />
                  </label>
                  {form.imagePreview && (
                    <img
                      src={form.imagePreview}
                      alt="Preview"
                      className="h-16 w-20 object-cover rounded-lg ring-1 ring-black/10"
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  className="rounded-xl px-5 py-2 font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                >
                  Submit Quick Report
                </button>
              </div>
            </form>

            {/* Visual card */}
            <div className="rounded-2xl overflow-hidden ring-1 ring-black/10">
              <div className="relative h-72 sm:h-full min-h-[18rem]">
                <img
                  src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600&auto=format&fit=crop"
                  alt="Neighbors collaborating"
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/30 to-[var(--color-primary-hover)]/20" />
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-white">
                  <h3 className="text-lg font-bold">Help keep our community safe and clean</h3>
                  <p className="text-white/90 text-sm">
                    Submitting a quick report alerts barangay staff and speeds up response time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ABOUT + IMAGE */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-10 sm:pb-14">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-center">
          <div className="order-2 lg:order-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)]">
              About the Barangay Portal
            </h2>
            <p className="mt-3 text-black/80">
              This website simplifies citizen services and communication. Submit reports with photos,
              track your requests, view barangay announcements, and access essential information—from
              officials to certificates—all in one place.
            </p>
            <ul className="mt-4 space-y-2 text-sm sm:text-base">
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                Quick reporting with location & photos
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                Transparent updates from your barangay
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                Mobile-friendly and accessible design
              </li>
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/dashboard/officials"
                className="rounded-xl px-4 py-2 font-semibold ring-1 ring-black/10 hover:bg-black/5"
              >
                Meet the Officials
              </Link>
             
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-2xl ring-1 ring-black/10">
              <img
                src="citizen.png"
                alt="Citizens at the barangay hall"
                className="h-72 sm:h-96 w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-primary)]/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY STRIP */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
  <h3 className="text-lg sm:text-xl font-bold mb-4">Barangay Projects</h3>
  <div className="grid gap-4 sm:grid-cols-3">
    {[
      {
        src: "road-repair-3.jpg",
        alt: "Barangay road repair and pothole patching",
        caption: "Road Repair & Patching",
      },
      {
        src: "community.jpeg",
        alt: "Community clean-up drive with volunteers",
        caption: "Community Clean-up Drive",
      },
      {
        src: "clinic.jpg",
        alt: "Barangay health outreach and clinic services",
        caption: "Health Outreach & Clinic",
      },
    ].map(({ src, alt, caption }, i) => (
      <figure
        key={i}
        className="relative overflow-hidden rounded-2xl ring-1 ring-black/10"
      >
        <img
          src={src}
          alt={alt}
          className="h-48 w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-[var(--color-primary)]/10" />
        <figcaption className="absolute bottom-2 left-2 rounded px-2 py-1 text-xs sm:text-sm font-semibold text-white bg-black/40 backdrop-blur">
          {caption}
        </figcaption>
      </figure>
    ))}
  </div>
</section>


      {/* CTA STRIP */}
      <section className="bg-white/60 border-t border-black/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10 grid gap-4 sm:grid-cols-2 items-center">
          <div>
            <h4 className="text-xl font-bold text-[var(--color-primary)]">Need help or have a suggestion?</h4>
            <p className="text-black/70">
              We’re here to serve. Send a report or reach out to the barangay office.
            </p>
          </div>
          <div className="flex justify-start sm:justify-end gap-3">
            <Link
              to="/dashboard/profile"
              className="rounded-xl px-4 py-2 font-semibold ring-1 ring-black/10 hover:bg-black/5"
            >
              View My Reports
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- small components ---------- */

function StatCard({ color, value, label, icon }) {
  return (
    <div className={`rounded-2xl p-5 text-white ${color}`}>
      <div className="flex items-center justify-between">
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-2xl opacity-90">{icon}</div>
      </div>
      <div className="mt-2 text-sm">{label}</div>
    </div>
  );
}
