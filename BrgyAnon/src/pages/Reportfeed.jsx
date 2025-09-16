// src/pages/ReportFeed.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiMapPin,
  FiClock,
  FiUser,
  FiImage,
  FiRefreshCw,
  FiX,
  FiTrash2,
  FiUpload,
  FiHome,
  FiEdit2,
  FiCheckCircle,
  FiArrowLeft,
} from "react-icons/fi";
import { Link } from "react-router-dom";


/** Reaction definitions */
const REACTIONS = [
  { key: "like",  emoji: "👍", label: "Like"  },
  { key: "love",  emoji: "❤️", label: "Love"  },
  { key: "haha",  emoji: "😂", label: "Haha"  },
  { key: "wow",   emoji: "😮", label: "Wow"   },
  { key: "sad",   emoji: "😢", label: "Sad"   },
  { key: "angry", emoji: "😡", label: "Angry" },
];
const EMPTY_REACTIONS = { like:0, love:0, haha:0, wow:0, sad:0, angry:0 };

const STATUS_OPTIONS = [
  "Waiting Approval",
  "Received",
  "In Progress",
  "Resolved",
];

const LS_POSTS = "brgy_posts";
const LS_MY_REACTS = "brgy_my_reacts"; // { [postId]: "like" | "love" | ... }

export default function ReportFeed() {
  const [posts, setPosts] = useState([]);
  const [myReacts, setMyReacts] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // ✅ Must be here


  const ensureShape = (p) => ({
  ...p,
  reactions: { ...EMPTY_REACTIONS, ...(p.reactions || {}) },
  comments: Array.isArray(p.comments) ? p.comments : [],
  status: normalizeStatus(p.status) || "Waiting Approval",
  statusUpdatedAt: p.statusUpdatedAt ?? p.createdAt ?? Date.now(),
  });

  const load = () => {
    try {
      const all = JSON.parse(localStorage.getItem(LS_POSTS) || "[]")
        .map(ensureShape)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setPosts(all);
    } catch {
      setPosts([]);
    }
    try {
      const mine = JSON.parse(localStorage.getItem(LS_MY_REACTS) || "{}");
      setMyReacts(mine);
    } catch {
      setMyReacts({});
    }
  };

  useEffect(() => {
    load();
    const onStorage = (e) => {
      if (e.key === LS_POSTS || e.key === LS_MY_REACTS) load();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persistPosts = (next) => {
    localStorage.setItem(LS_POSTS, JSON.stringify(next));
    setPosts(next);
  };
  const persistMyReacts = (next) => {
    localStorage.setItem(LS_MY_REACTS, JSON.stringify(next));
    setMyReacts(next);
  };

  function handleSaved(newPost) {
    const next = [ensureShape(newPost), ...posts];
    persistPosts(next);
    setShowForm(false);
  }

  function handleUpdated(updatedPost) {
    const next = posts.map((p) =>
      p.id === updatedPost.id ? ensureShape(updatedPost) : p
    );
    persistPosts(next);
    setEditing(null);
  }

  // DELETE flow (confirm modal)
  function requestDelete(id) {
    setConfirmId(id);
  }
  function confirmDelete() {
    if (!confirmId) return;
    const next = posts.filter((p) => p.id !== confirmId);
    persistPosts(next);
    if (myReacts[confirmId]) {
      const { [confirmId]: _, ...rest } = myReacts;
      persistMyReacts(rest);
    }
    setConfirmId(null);
  }
  function cancelDelete() {
    setConfirmId(null);
  }

  function handleReact(id, key) {
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) return;

    const current = myReacts[id];
    const nextPosts = posts.map((p, i) =>
      i === idx ? { ...p, reactions: { ...p.reactions } } : p
    );

    if (current && nextPosts[idx].reactions[current] > 0) {
      nextPosts[idx].reactions[current] -= 1;
    }

    let nextMyReacts;
    if (current === key) {
      const { [id]: _, ...rest } = myReacts;
      nextMyReacts = rest;
    } else {
      nextPosts[idx].reactions[key] += 1;
      nextMyReacts = { ...myReacts, [id]: key };
    }

    persistPosts(nextPosts);
    persistMyReacts(nextMyReacts);
  }

  function handleAddComment(id, text, userName = "Guest") {
    const value = (text || "").trim();
    if (value.length < 2) return;

    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) return;

    const nextPosts = posts.map((p, i) =>
      i === idx
        ? {
            ...p,
            comments: [
              ...p.comments,
              {
                id: crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
                userName,
                text: value,
                createdAt: Date.now(),
              },
            ],
          }
        : p
    );

    persistPosts(nextPosts);
  }

  return (
    <div className="min-h-screen bg-[var(--color-secondary)] text-[var(--color-text)]">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end">
          {/* Back to Home */}
        
          {/* Title */}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-primary)]">
              Community Report Feed
            </h1>
            <p className="text-black/70 text-sm">React, comment, edit, and track status.</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 justify-end">
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-white ring-1 ring-black/10 px-3 py-2 hover:bg-black/5"
                title="Back to Home"
              >
                <FiArrowLeft /> Back to Dashboard
              </Link>
            </div>

            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-xl bg-white ring-1 ring-black/10 px-3 py-2 hover:bg-black/5"
              title="Refresh"
            >
              <FiRefreshCw /> Refresh
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold
                         bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
            >
              New Report
            </button>
          </div>
        </div>

        {/* Content */}
        {posts.length === 0 ? (
          <EmptyState onNew={() => setShowForm(true)} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <ReportCard
                key={p.id}
                post={p}
                myReaction={myReacts[p.id]}
                onReact={(key) => handleReact(p.id, key)}
                onAddComment={(txt) => handleAddComment(p.id, txt)}
                onDelete={() => requestDelete(p.id)}
                onEdit={() => setEditing(p)}
              />
            ))}
          </div>
        )}
      </div>

       {/* Modal: New report */}
      {showForm && (
        <NewReportModal
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Modal: Edit report */}
      {editing && (
        <EditReportModal
          post={editing}
          onClose={() => setEditing(null)}
          onSaved={handleUpdated}
        />
      )}

      {/* Confirm delete dialog */}
      {confirmId && (
        <ConfirmDelete onCancel={cancelDelete} onConfirm={confirmDelete} />
      )}
    </div>
  );
}

/* ---------- Confirm Delete Modal ---------- */
function ConfirmDelete({ onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white ring-1 ring-black/10 shadow-2xl">
        <div className="px-5 py-4 border-b border-black/10 flex items-center gap-2">
          <FiAlertTriangle className="text-[var(--color-primary)]" />
          <h3 className="font-semibold">Confirm Deletion</h3>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-black/80">
            Are you sure you want to delete this post?
          </p>
          <p className="text-xs text-black/60">This action cannot be undone.</p>
          <div className="mt-2 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              onClick={onCancel}
              className="inline-flex justify-center rounded-xl px-4 py-2 text-sm font-semibold ring-1 ring-black/10 hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="inline-flex justify-center rounded-xl px-4 py-2 text-sm font-semibold
                         bg-rose-600 text-white hover:bg-rose-700"
            >
              Delete Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Modal Form ---------- */
const googleUser = JSON.parse(localStorage.getItem("googlename") || "{}");

function NewReportModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    userName: googleUser.fullname || "Guest",
    issue: "",
    location: "",
    desc: "",
    imagePreview: "",
    imageDataUrl: "",
  });
  const [error, setError] = useState("");

  function validate() {
    if (!form.issue) return "Please select an issue.";
    if (!form.desc || form.desc.trim().length < 10)
      return "Please describe the issue (at least 10 characters).";
    return "";
  }

  function handleImg(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const preview = URL.createObjectURL(f);
    const reader = new FileReader();
    reader.onload = () =>
      setForm((s) => ({ ...s, imagePreview: preview, imageDataUrl: reader.result }));
    reader.readAsDataURL(f);
  }

  function removeImg() {
    setForm((s) => ({ ...s, imagePreview: "", imageDataUrl: "" }));
  }

  function submit(e) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    const newPost = {
      id: crypto?.randomUUID?.() || Date.now().toString(),
      userId: "guest",
      userName: googleUser.userName || "Guest",
      issue: form.issue,
      location: form.location,
      desc: form.desc.trim(),
      imageUrl: form.imageDataUrl,
      createdAt: Date.now(),
      reactions: { ...EMPTY_REACTIONS },
      comments: [],
    };
    onSaved?.(newPost);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white ring-1 ring-black/10 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
          <h2 className="text-lg font-bold text-[var(--color-primary)]">New Report</h2>
          <button
            onClick={onClose}
            className="h-9 w-9 grid place-items-center rounded-xl hover:bg-black/5"
            title="Close"
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="rounded-xl px-3 py-2 text-sm bg-rose-50 text-rose-800 ring-1 ring-rose-200">
              {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Your Name</label>
                <div className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3 outline-none
                           ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
                >{googleUser.fullname || "Guest"}
            </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Issue *</label>
              <select
                value={form.issue}
                onChange={(e) => setForm((s) => ({ ...s, issue: e.target.value }))}
                className="appearance-none w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3 outline-none
                           ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
                required
              >
                <option value="" disabled>Choose…</option>
                {[
                  "Road Damage",
                  "Waste Management",
                  "Street Lighting",
                  "Water/Sanitation",
                  "Noise/Disturbance",
                  "Safety",
                  "Others",
                ].map((i) => (
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
              placeholder="e.g., Purok 2, near barangay hall"
              className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3 outline-none
                         ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Description *</label>
              <span className="text-xs text-black/60">{form.desc.length}/500</span>
            </div>
            <textarea
              value={form.desc}
              onChange={(e) =>
                e.target.value.length <= 500 &&
                setForm((s) => ({ ...s, desc: e.target.value }))
              }
              rows={5}
              placeholder="Briefly describe the issue, when/where it happens, and any other details…"
              className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3 outline-none
                         ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Photo (optional)</label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-xl px-4 py-2 ring-1 ring-black/10 hover:bg-black/5 cursor-pointer">
                <FiUpload />
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

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-xl px-5 py-2 font-semibold ring-1 ring-black/10 hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              className="inline-flex justify-center rounded-xl px-5 py-2 font-semibold
                         bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]
                         focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              Post Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Modal: Edit Report ---------- */
function EditReportModal({ post, onClose, onSaved }) {
  const [form, setForm] = useState({
    userName: post.userName || "Guest",
    issue: post.issue || "",
    location: post.location || "",
    desc: post.desc || "",
    imagePreview: post.imageUrl || "",
    imageDataUrl: "",
    status: normalizeStatus(post.status) || "Waiting Approval",
  });
  const [error, setError] = useState("");

  function validate() {
    if (!form.issue) return "Please select an issue.";
    if (!form.desc || form.desc.trim().length < 10)
      return "Please describe the issue (at least 10 characters).";
    return "";
  }

  function handleImg(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const preview = URL.createObjectURL(f);
    const reader = new FileReader();
    reader.onload = () =>
      setForm((s) => ({
        ...s,
        imagePreview: preview,
        imageDataUrl: reader.result,
      }));
    reader.readAsDataURL(f);
  }
  function removeImg() {
    setForm((s) => ({ ...s, imagePreview: "", imageDataUrl: "" }));
  }

  function submit(e) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    const nextStatus = normalizeStatus(form.status) || "Waiting Approval";
    const changed = nextStatus !== normalizeStatus(post.status);

    const updated = {
      ...post,
      userName: form.userName || "Guest",
      issue: form.issue,
      location: form.location,
      desc: form.desc.trim(),
      imageUrl: form.imageDataUrl ? form.imageDataUrl : form.imagePreview || "",
      status: nextStatus,
      statusUpdatedAt: changed
        ? Date.now()
        : post.statusUpdatedAt ?? post.createdAt,
    };
    onSaved?.(updated);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white ring-1 ring-black/10 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
          <h2 className="text-lg font-bold text-[var(--color-primary)]">
            Edit Report
          </h2>
          <button
            onClick={onClose}
            className="h-9 w-9 grid place-items-center rounded-xl hover:bg-black/5"
            title="Close"
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="rounded-xl px-3 py-2 text-sm bg-rose-50 text-rose-800 ring-1 ring-rose-200">
              {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <TextField
              label="Your Name"
              placeholder="e.g., Juan Dela Cruz"
              value={form.userName}
              onChange={(v) => setForm((s) => ({ ...s, userName: v }))}
            />

            <SelectField
              label="Issue *"
              required
              value={form.issue}
              onChange={(v) => setForm((s) => ({ ...s, issue: v }))}
              options={[
                "Road Damage",
                "Waste Management",
                "Street Lighting",
                "Water/Sanitation",
                "Noise/Disturbance",
                "Safety",
                "Others",
              ]}
            />
          </div>

          <TextField
            label="Location"
            placeholder="e.g., Purok 2, near barangay hall"
            value={form.location}
            onChange={(v) => setForm((s) => ({ ...s, location: v }))}
          />

          <TextareaField
            label="Description *"
            value={form.desc}
            onChange={(v) =>
              v.length <= 500 && setForm((s) => ({ ...s, desc: v }))
            }
            hint={`${form.desc.length}/500`}
            required
          />

          <SelectField
            label="Status"
            value={form.status}
            onChange={(v) => setForm((s) => ({ ...s, status: v }))}
            options={STATUS_OPTIONS}
          />

          {/* Image upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Photo (optional)</label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-xl px-4 py-2 ring-1 ring-black/10 hover:bg-black/5 cursor-pointer">
                <FiUpload />
                <span>Upload image</span>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImg}
                />
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

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-xl px-5 py-2 font-semibold ring-1 ring-black/10 hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              className="inline-flex justify-center rounded-xl px-5 py-2 font-semibold
                         bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]
                         focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Card with Reactions + Comments ---------- */

function ReportCard({ post, myReaction, onReact, onAddComment, onDelete }) {
  const time = fmt(post.createdAt);
  const [openComments, setOpenComments] = useState(false);
  const [text, setText] = useState("");

  const totalReacts =
    (post.reactions?.like || 0) +
    (post.reactions?.love || 0) +
    (post.reactions?.haha || 0) +
    (post.reactions?.wow || 0) +
    (post.reactions?.sad || 0) +
    (post.reactions?.angry || 0);

  function submitComment(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onAddComment?.(text.trim());
    setText("");
    setOpenComments(true);

  }
  const { badgeBg, badgeRing, badgeText } = statusColors(post.status);

    return (
    <article className="rounded-2xl bg-white ring-1 ring-black/10 overflow-hidden hover:shadow transition">
      {/* Media */}
      <div className="relative h-40 bg-black/5">
        {post.imageUrl ? (
          <img
            src={post.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-black/40">
            <FiImage />
          </div>
        )}

        {/* Issue badge */}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-white/85 ring-1 ring-black/10">
          <FiAlertTriangle className="text-[var(--color-primary)]" />
          {post.issue || "Issue"}
        </span>

        {/* Status badge */}
        <span
          className={`absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full ${badgeBg} ${badgeRing} ${badgeText}`}
          title={`Status last updated: ${
            post.statusUpdatedAt
              ? new Date(post.statusUpdatedAt).toLocaleString()
              : "—"
          }`}
        >
          <FiCheckCircle className="opacity-80" />
          {normalizeStatus(post.status)}
        </span>

        {/* Edit */}
        <button
          onClick={onEdit}
          title="Edit report"
          aria-label="Edit report"
          className="absolute bottom-2 right-12 h-9 w-9 grid place-items-center rounded-lg
                     bg-white/90 ring-1 ring-black/10 text-[var(--color-text)] hover:bg-black/5 transition"
        >
          <FiEdit2 />
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          title="Delete report"
          aria-label="Delete report"
          className="absolute bottom-2 right-2 h-9 w-9 grid place-items-center rounded-lg
                     bg-white/90 ring-1 ring-black/10 text-rose-600 hover:bg-rose-50 transition"
        >
          <FiTrash2 />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Author name={post.userName || "Guest"} />
          <time className="text-xs text-black/60 flex items-center gap-1">
            <FiClock className="opacity-70" /> {time}
          </time>
        </div>

        {post.location && (
          <div className="text-sm text-black/70 flex items-center gap-1">
            <FiMapPin className="opacity-70" />
            {post.location}
          </div>
        )}

        {post.desc && <p className="text-sm text-black/80">{post.desc}</p>}

        {/* Reactions */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 flex-wrap">
            {REACTIONS.map(({ key, emoji, label }) => {
              const active = myReaction === key;
              const count = post.reactions?.[key] || 0;
              return (
                <button
                  key={key}
                  onClick={() => onReact?.(key)}
                  aria-pressed={active}
                  title={label}
                  className={[
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm transition",
                    active
                      ? "bg-[var(--color-primary)]/10 ring-1 ring-[var(--color-primary)]"
                      : "hover:bg-black/5 ring-1 ring-black/5",
                  ].join(" ")}
                >
                  <span className="text-base leading-none">{emoji}</span>
                  <span className="min-w-[1ch]">{count || ""}</span>
                </button>
              );
            })}
          </div>
          <span className="text-xs text-black/60">
            {totalReacts || 0} total
          </span>
        </div>

        {/* Comment composer */}
        <form onSubmit={submitComment} className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment…"
            className="flex-1 rounded-xl bg-[var(--color-secondary)] px-3 py-2 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
          />
          <button className="rounded-xl px-3 py-2 text-sm font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]">
            Post
          </button>
        </form>

        {/* Comments list */}
        <div>
          <button
            onClick={() => setOpenComments((s) => !s)}
            className="text-xs text-[var(--color-primary)] hover:underline"
          >
            {openComments ? "Hide" : "Show"} comments (
            {post.comments?.length || 0})
          </button>

          {openComments && (
            <ul className="mt-2 space-y-2 max-h-44 overflow-auto pr-1">
              {(post.comments || []).map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl bg-[var(--color-secondary)] px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">
                      {c.userName || "Guest"}
                    </span>
                    <span className="text-[10px] text-black/50">
                      {fmt(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-black/80">{c.text}</p>
                </li>
              ))}
              {(!post.comments || post.comments.length === 0) && (
                <li className="text-xs text-black/60">No comments yet.</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}

/* ---------- Small fields ---------- */
function TextField({ label, value, onChange, placeholder, required }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3 outline-none
                   ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
      />
    </div>
  );
}
function SelectField({ label, value, onChange, options, required }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="appearance-none w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3 outline-none
                   ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
      >
        {!required && <option value="">—</option>}
        {options.map((i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </select>
    </div>
  );
}
function TextareaField({ label, value, onChange, hint, required }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        {hint && <span className="text-xs text-black/60">{hint}</span>}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        required={required}
        placeholder="Briefly describe the issue, when/where it happens, and any other details…"
        className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3 outline-none
                   ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
      />
    </div>
  );
}

/* ---------- Bits ---------- */

function EmptyState({ onNew }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-black/10 p-10 text-center">
      <div
        className="mx-auto h-12 w-12 rounded-full grid place-items-center
                      bg-[var(--color-secondary)] text-[var(--color-primary)] ring-1 ring-black/10"
      >
        <FiAlertTriangle />
      </div>
      <h2 className="mt-3 text-lg font-semibold text-[var(--color-primary)]">
        No reports yet
      </h2>
      <p className="text-sm text-black/70">
        When someone submits a report, it will show here.
      </p>
      <button
        onClick={onNew}
        className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold
                   bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
      >
        Create your first report
      </button>
    </div>
  );
}

/* ---------- utils ---------- */
function fmt(ts) {
  try {
    return ts ? new Date(ts).toLocaleString() : "—";
  } catch {
    return "—";
  }
}
function normalizeStatus(s) {
  const v = String(s || "").toLowerCase();
  if (v.includes("progress")) return "In Progress";
  if (v.includes("resolve")) return "Resolved";
  if (v.includes("receive")) return "Received";
  if (v.includes("wait")) return "Waiting Approval";
  return s || "Waiting Approval";
}
function statusColors(status) {
  switch (normalizeStatus(status)) {
    case "In Progress":
      return {
        badgeBg: "bg-amber-50",
        badgeRing: "ring-1 ring-amber-200",
        badgeText: "text-amber-800",
      };
    case "Resolved":
      return {
        badgeBg: "bg-emerald-50",
        badgeRing: "ring-1 ring-emerald-200",
        badgeText: "text-emerald-800",
      };
    case "Received":
      return {
        badgeBg: "bg-sky-50",
        badgeRing: "ring-1 ring-sky-200",
        badgeText: "text-sky-800",
      };
    default: // Waiting Approval
      return {
        badgeBg: "bg-slate-50",
        badgeRing: "ring-1 ring-slate-200",
        badgeText: "text-slate-800",
      };
  }
}
