// src/pages/NewReport.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMapPin,
  FiImage,
  FiTrash2,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

export default function NewReport() {
  const navigate = useNavigate();

const googleUser = JSON.parse(localStorage.getItem("googlename") || "{}");

const [form, setForm] = useState({
  userName: googleUser.fullname || "Guest", // ✅ Prefill from Google
  issue: "",
  location: "",
  desc: "",
  imagePreview: "",
  imageDataUrl: "",
});

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const issues = [
    "Road Damage",
    "Waste Management",
    "Street Lighting",
    "Water/Sanitation",
    "Noise/Disturbance",
    "Safety",
    "Others",
  ];

  async function handleImg(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const previewUrl = URL.createObjectURL(file);

    // Persistable DataURL (survives reload)
    const toDataURL = (f) =>
      new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsDataURL(f);
      });

    const dataUrl = await toDataURL(file);

    setForm((s) => ({ ...s, imagePreview: previewUrl, imageDataUrl: dataUrl }));
  }

  function removeImg() {
    setForm((s) => ({ ...s, imagePreview: "", imageDataUrl: "" }));
  }

  function validate() {
    if (!form.issue) return "Please select an issue.";
    if (!form.desc || form.desc.trim().length < 10)
      return "Please describe the issue (at least 10 characters).";
    return "";
  }

  function submit(e) {
    e.preventDefault();
    const error = validate();
    if (error) {
      setMessage({ type: "error", text: error });
      return;
    }

    setSubmitting(true);
    try {
      const key = "brgy_posts";
      const prev = JSON.parse(localStorage.getItem(key) || "[]");

      const newPost = {
        id: (crypto?.randomUUID?.() || Date.now().toString()),
        userId: "me", // change when you add real auth
        userName: googleUser.userName || "Guest",
        issue: form.issue,
        location: form.location,
        desc: form.desc.trim(),
        imageUrl: form.imageDataUrl, // DataURL for persistence
        createdAt: Date.now(),
      };

      localStorage.setItem(key, JSON.stringify([newPost, ...prev]));
      setMessage({ type: "success", text: "Report submitted successfully!" });

      // Reset (keep userName for convenience)
      setForm((s) => ({
        ...s,
        issue: "",
        location: "",
        desc: "",
        imagePreview: "",
        imageDataUrl: "",
      }));

      // optional: navigate after short delay
      // setTimeout(() => navigate("/dashboard", { replace: true }), 900);
    } catch (err) {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Top bar */}
      <div className="mb-4 flex items-center gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-black/10 hover:bg-black/5"
        >
          <FiArrowLeft /> Back to Dashboard
        </Link>
        <h1 className="ml-auto text-xl sm:text-2xl font-bold text-[var(--color-primary)]">
          Create a New Report
        </h1>
      </div>

     {/* Alert */}
      {message.text && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
              : "bg-rose-50 text-rose-800 ring-1 ring-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <FiCheckCircle className="shrink-0" />
          ) : (
            <FiAlertCircle className="shrink-0" />
          )}
          <span className="flex-1">{message.text}</span>

          {message.type === "success" && (
            <div className="flex gap-2">
              <Link
                to="/dashboard/reportfeed"
                className="rounded-lg px-2.5 py-1.5 font-medium bg-white/60 hover:bg-white/80"
              >
                View Feed
              </Link>
              <Link
                to="/dashboard/profile"
                className="rounded-lg px-2.5 py-1.5 font-medium bg-white/60 hover:bg-white/80"
              >
                My Reports
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Form card */}
      <form onSubmit={submit} className="rounded-2xl bg-white ring-1 ring-black/10 p-5 sm:p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Your Name</label>
            <div className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]">
            {googleUser.fullname || "Guest"}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Select an issue *</label>
            <select
              value={form.issue}
              onChange={(e) => setForm((s) => ({ ...s, issue: e.target.value }))}
              className="appearance-none w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
              required
            >
              <option value="" disabled>
                Choose…
              </option>
              {issues.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium flex items-center gap-2">
            <FiMapPin className="opacity-70" /> Location
          </label>
          <input
            value={form.location}
            onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))}
            placeholder="e.g., Purok 2, near barangay hall"
            className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Description *</label>
            <span className="text-xs text-black/60">
              {form.desc.length}/500
            </span>
          </div>
          <textarea
            value={form.desc}
            onChange={(e) =>
              e.target.value.length <= 500 &&
              setForm((s) => ({ ...s, desc: e.target.value }))
            }
            rows={6}
            placeholder="Briefly describe the issue, when/where it happens, and any other details…"
            className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
            required
          />
        </div>

        {/* Image upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Photo (optional)</label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 rounded-xl px-4 py-2 ring-1 ring-black/10 hover:bg-black/5 cursor-pointer">
              <FiImage />
              <span>Upload image</span>
              <input type="file" accept="image/*" hidden onChange={handleImg} />
            </label>

            {form.imagePreview && (
              <div className="relative">
                <img
                  src={form.imagePreview}
                  alt="Preview"
                  className="h-20 w-28 object-cover rounded-lg ring-1 ring-black/10"
                />
                <button
                  type="button"
                  onClick={removeImg}
                  className="absolute -top-2 -right-2 h-8 w-8 grid place-items-center rounded-full bg-white ring-1 ring-black/10 hover:bg-black/5"
                  title="Remove image"
                >
                  <FiTrash2 />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-1">
          <Link
            to="/dashboard"
            className="inline-flex justify-center rounded-xl px-5 py-2 font-semibold ring-1 ring-black/10 hover:bg-black/5"
          >
            Cancel
          </Link>
          <button
            disabled={submitting}
            className="inline-flex justify-center rounded-xl px-5 py-2 font-semibold
                       bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]
                       disabled:opacity-60 disabled:cursor-not-allowed
                       focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            {submitting ? "Submitting..." : "Post Report"}
          </button>
        </div>
      </form>
    </div>
  );
}
