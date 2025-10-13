// NEW REPORT

import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import {
  FiMapPin,
  FiImage,
  FiTrash2,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
} from "react-icons/fi";
import { onAuthStateChanged } from "firebase/auth";

const LS_PROFILE = "brgy_profile_data";
const LS_POSTS = "brgy_posts";

export default function NewReport() {
  const navigate = useNavigate();
  const locationRef = useRef(null);

  const [form, setForm] = useState({
    userName: "",
    issue: "",
    location: "",
    desc: "",
    imagePreview: "",
    imageDataUrl: "",
    userProfileImage: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [reports, setReports] = useState([]);
  const [editingReportId, setEditingReportId] = useState(null);

  const issues = [
    "Road Damage",
    "Waste Management",
    "Street Lighting",
    "Water/Sanitation",
    "Noise/Disturbance",
    "Safety",
    "Others",
  ];

  // 🔹 Load approved reports
  useEffect(() => {
    const q = query(collection(db, "reports"), where("status", "==", "Approved"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setReports(data);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Sync profile from auth + localStorage
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      const storedProfile = JSON.parse(localStorage.getItem(LS_PROFILE)) || {};

      let displayName = "Guest";
      let profileImage = "";

      if (user) {
        // Logged in via Firebase (email/password or Google)
        displayName = user.displayName || storedProfile.fullName || "Anonymous User";
        profileImage = user.photoURL || storedProfile.profileImage || "";
      } else {
        // Guest / create account
        displayName =
          storedProfile.fullName ||
          storedProfile.googleName ||
          storedProfile.guestName ||
          "Guest";
        profileImage = storedProfile.profileImage || "";
      }

      setForm((prev) => ({
        ...prev,
        userName: displayName,
        userProfileImage: profileImage,
      }));
    });

    const updateProfileFromStorage = () => {
      const updatedProfile = JSON.parse(localStorage.getItem(LS_PROFILE)) || {};
      setForm((prev) => ({
        ...prev,
        userName:
          updatedProfile.fullName ||
          updatedProfile.googleName ||
          updatedProfile.guestName ||
          "Guest",
        userProfileImage: updatedProfile.profileImage || "",
      }));
    };

    window.addEventListener("storage", updateProfileFromStorage);
    updateProfileFromStorage(); // run immediately

    return () => {
      unsubscribeAuth();
      window.removeEventListener("storage", updateProfileFromStorage);
    };
  }, []);

  // 🔹 Edit report
  function handleEdit(report) {
    setForm({
      userName: report.userFullName || report.userName || "Guest",
      issue: report.issue,
      location: report.location,
      desc: report.desc,
      imagePreview: report.imageUrl || "",
      imageDataUrl: report.imageUrl || "",
      userProfileImage: report.userProfileImage || "",
    });
    setEditingReportId(report.id);
  }

  // 🔹 Image handling
  async function handleImg(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

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

  // 🔹 Detect location
  async function detectLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const address =
            data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

          setForm((s) => ({ ...s, location: address }));
          if (locationRef.current) locationRef.current.value = address;
        } catch (err) {
          console.error(err);
        }
      },
      (err) => {
        console.error(err);
        alert("Failed to detect location.");
      }
    );
  }

  // 🔹 Delete & archive report
  async function handleArchiveReport(report) {
    try {
      const reportRef = doc(db, "reports", report.id);
      const reportSnap = await getDoc(reportRef);
      if (!reportSnap.exists()) return;

      const reportData = reportSnap.data();

      await setDoc(doc(db, "archivedReports", report.id), {
        ...reportData,
        archivedAt: serverTimestamp(),
        deletedBy: auth.currentUser?.uid || "admin",
        deletedByName: auth.currentUser?.displayName || "Admin",
      });

      await deleteDoc(reportRef);

      setReports((prev) => prev.filter((r) => r.id !== report.id));
      alert("Report archived successfully!");
    } catch (err) {
      console.error("Error archiving report:", err);
      alert("Failed to archive report.");
    }
  }

  // 🔹 Submit report
  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.issue) {
      setMessage({ type: "error", text: "Please select an issue." });
      return;
    }
    if (!form.desc || form.desc.trim().length < 10) {
      setMessage({
        type: "error",
        text: "Please describe the issue (at least 10 characters).",
      });
      return;
    }

    setSubmitting(true);

    try {
      const currentProfile = JSON.parse(localStorage.getItem(LS_PROFILE)) || {};
      const user = auth.currentUser;

      if (editingReportId) {
        const reportRef = doc(db, "reports", editingReportId);
        const reportSnap = await getDoc(reportRef);

        if (!reportSnap.exists()) {
          setMessage({ type: "error", text: "Report not found." });
          setSubmitting(false);
          return;
        }

        await updateDoc(reportRef, {
          issue: form.issue,
          desc: form.desc,
          location: form.location,
          imageUrl: form.imageDataUrl || "",
          userFullName:
            currentProfile.fullName ||
            currentProfile.googleName ||
            currentProfile.guestName ||
            "Anonymous User",
          userProfileImage: currentProfile.profileImage || "",
          updatedAt: serverTimestamp(),
        });

        setMessage({ type: "success", text: "Report updated successfully!" });
      } else {
        const newReport = {
          id: Date.now(),
          userId: user?.uid || "guest",
          userFullName:
            currentProfile.fullName ||
            currentProfile.googleName ||
            currentProfile.guestName ||
            "Anonymous User",
          userProfileImage: currentProfile.profileImage || "",
          issue: form.issue,
          desc: form.desc,
          location: form.location,
          imageUrl: form.imageDataUrl || "",
          createdAt: serverTimestamp(),
          status: "Awaiting Approval",
          visible: false,
          reason: "",
        };

        await addDoc(collection(db, "reports"), newReport);

        const currentPosts = JSON.parse(localStorage.getItem(LS_POSTS) || "[]");
        currentPosts.push(newReport);
        localStorage.setItem(LS_POSTS, JSON.stringify(currentPosts));

        setReports((prev) => [...prev, newReport]);
      }

      setForm({
        userName:
          currentProfile.fullName ||
          currentProfile.googleName ||
          "Guest",
        issue: "",
        location: "",
        desc: "",
        imagePreview: "",
        imageDataUrl: "",
        userProfileImage: currentProfile.profileImage || "",
      });
      setEditingReportId(null);

      setTimeout(() => navigate("/reportfeed"), 500);
    } catch (err) {
      console.error("Error saving report:", err);
      setMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10">
      {/* Approved reports list */}
      <section>
        {reports.length > 0 &&
          reports.map((r) => (
            <div key={r.id} className="border p-4 rounded mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[var(--color-primary)]">
                  {r.issue}
                </h3>
                <div className="flex items-center gap-2">
                  {r.userProfileImage ? (
                    <img
                      src={r.userProfileImage}
                      alt="Profile"
                      className="h-8 w-8 object-cover rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 grid place-items-center rounded-full bg-gray-200">
                      <FiUser className="text-sm text-gray-500" />
                    </div>
                  )}
                  <span className="text-xs text-black/60">
                    {r.userFullName || r.userName}
                  </span>
                </div>
              </div>
              <p>{r.desc}</p>
              {r.location && (
                <p className="flex items-center gap-1 text-sm text-black/70">
                  <FiMapPin /> {r.location}
                </p>
              )}
              {r.imageUrl && (
                <img
                  src={r.imageUrl}
                  alt="Report"
                  className="mt-2 max-h-40 w-full object-cover rounded-lg ring-1 ring-black/10"
                />
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleEdit(r)}
                  className="rounded-lg bg-blue-600 text-white px-3 py-1 text-sm hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleArchiveReport(r)}
                  className="rounded-lg bg-red-600 text-white px-3 py-1 text-sm hover:bg-red-700"
                >
                  Archive
                </button>
              </div>
            </div>
          ))}
      </section>

      {/* New Report Form */}
      <section>
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
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white ring-1 ring-black/10 p-5 sm:p-6 space-y-5"
        >
          {/* Name & Issue */}
          <div className="flex items-center gap-3">
            {form.userProfileImage ? (
              <img
                src={form.userProfileImage}
                alt="Profile"
                className="h-12 w-12 object-cover rounded-full"
              />
            ) : (
              <div className="h-12 w-12 grid place-items-center rounded-full bg-gray-200">
                <FiUser className="text-xl text-gray-500" />
              </div>
            )}
            <div className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3">
              {form.userName}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Your Name</label>
              <div className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3">
                {form.userName}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Select an issue *</label>
              <select
                value={form.issue}
                onChange={(e) =>
                  setForm((s) => ({ ...s, issue: e.target.value }))
                }
                className="appearance-none w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3"
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

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Location</label>
            <div className="flex gap-2">
              <input
                ref={locationRef}
                type="text"
                placeholder="Type or detect location"
                value={form.location}
                onChange={(e) =>
                  setForm((s) => ({ ...s, location: e.target.value }))
                }
                className="flex-1 rounded-xl border px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={detectLocation}
                className="rounded-xl bg-[var(--color-primary)] text-white px-3 py-2 text-sm hover:bg-[var(--color-primary-hover)]"
              >
                Use GPS
              </button>
            </div>
          </div>

          {/* Description */}
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
              rows={6}
              placeholder="Briefly describe the issue..."
              className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3"
              required
            />
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Photo (optional)</label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-xl px-4 py-2 ring-1 ring-black/10 cursor-pointer">
                <FiImage />
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
                    className="absolute -top-2 -right-2 h-8 w-8 grid place-items-center rounded-full bg-white ring-1 ring-black/10"
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
              className="inline-flex justify-center rounded-xl px-5 py-2 font-semibold ring-1 ring-black/10"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex justify-center rounded-xl px-5 py-2 font-semibold bg-[var(--color-primary)] text-white disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Post Report"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
