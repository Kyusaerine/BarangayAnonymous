// src/pages/Profile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiMapPin, FiAlertTriangle, FiClock, FiImage, FiPlusCircle, FiArrowLeft, FiChevronDown, FiX, FiTrash2, FiEye, FiEyeOff, FiArchive, FiRefreshCw } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { addDoc, collection, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

const LS_PROFILE = "brgy_profile_data";
const LS_POSTS = "brgy_posts";
const LS_ARCHIVES = "brgy_archives"; // archive storage

export default function Profile() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [toast, setToast] = useState(""); // toast message

  // archives + modal states
  const [archives, setArchives] = useState([]);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // search + date filter
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // all | today | week | month

  const [profile, setProfile] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(LS_PROFILE)) || {
          firstName: "",
          middleName: "",
          lastName: "",
          password: "",
          profileImage: "", // photo
          lastLogin: new Date().toLocaleString(), // last login
          loginType: "created", // default
          googleName: "",
          guestName: ""
        }
      );
    } catch {
      return {
        firstName: "",
        middleName: "",
        lastName: "",
        password: "",
        profileImage: "",
        lastLogin: new Date().toLocaleString(),
        loginType: "created",
        googleName: "",
        guestName: ""
      };
    }
  });

  // Ensure we persist lastLogin if missing in older saved profiles
  useEffect(() => {
    if (!profile.lastLogin) {
      const updated = { ...profile, lastLogin: new Date().toLocaleString() };
      setProfile(updated);
      try {
        localStorage.setItem(LS_PROFILE, JSON.stringify(updated));
      } catch {}
    }
  }, []); // run once on mount

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  // Delete Account (two-step flow like your original)
  const [showDelete, setShowDelete] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deletePwd, setDeletePwd] = useState("");
  const [showDeletePwd, setShowDeletePwd] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [form, setForm] = useState(profile);
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [error, setError] = useState("");

  // Load reports
  useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem(LS_POSTS) || "[]");
      setPosts(all);
    } catch {
      setPosts([]);
    }
  }, []);

  // Load archives
  useEffect(() => {
    try {
      const arch = JSON.parse(localStorage.getItem(LS_ARCHIVES) || "[]");
      setArchives(arch);
    } catch {
      setArchives([]);
    }
  }, []);

  // User reports
  const myPosts = useMemo(
    () => posts.filter((p) => p?.userId === "me" || p?.userId === "guest"),
    [posts]
  );

  // Profile Name
const displayName = (() => {
  if (profile.loginType === "google" && profile.googleName)
    return profile.googleName;

  if (profile.loginType === "guest" && profile.guestName)
    return profile.guestName;
  
  if (profile.loginType === "email" && profile.fullName) 
    return profile.fullName;

  if (profile.signupType === "created account") {
    const fullName = `${profile.firstName || ""} ${
      profile.lastName || ""
    }`.trim();
    if (fullName) return fullName;
  }
  return "User";
})();

  const lastSubmitted = useMemo(() => {
    if (myPosts.length === 0) return "—";
    const latest = Math.max(...myPosts.map((p) => Number(p?.createdAt || 0)));
    return latest > 0 ? new Date(latest).toLocaleString() : "—";
  }, [myPosts]);

  // Toast helper
  const triggerToast = (msg) => {
    setToast(msg);
    window.clearTimeout(triggerToast._t);
    triggerToast._t = window.setTimeout(() => setToast(""), 3000);
  };

  // Form handlers
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Profile photo upload
  const onImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setForm((f) => ({ ...f, profileImage: String(reader.result || "") }));
    reader.readAsDataURL(file);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (form.password !== confirmPwd) {
      setError("Passwords do not match!");
      return;
    }
    setError("");

    const updated = {
      ...form,
      lastLogin: profile.lastLogin || new Date().toLocaleString(),
      loginType: profile.loginType, 
      email: profile.emailName || user.emailName || "",
      googleName: profile.googleName || user.googleName || "",
      guestName: profile.guestName || fullName.guestName || "",
    };
    try {
      localStorage.setItem(LS_PROFILE, JSON.stringify(updated));
    } catch {}
    setProfile(updated);
    setShowEdit(false);
    triggerToast("Profile updated successfully ✅");
  };

  // Account deletion (archive profile & clear LS)
  const onDelete = () => {
    try {
      const archives = JSON.parse(localStorage.getItem(LS_ARCHIVES) || "[]");
      archives.push({
        ...profile,
        id: crypto.randomUUID?.() || String(Date.now()),
        deletedAt: Date.now(),
      });
      localStorage.setItem(LS_ARCHIVES, JSON.stringify(archives));
    } catch (err) {
      console.error("Failed to archive profile:", err);
    }

    try {
      localStorage.removeItem("brgy_profile_data");
      localStorage.removeItem("brgy_posts");
      localStorage.removeItem("brgy_role");
      localStorage.removeItem("brgy_is_admin");
      localStorage.removeItem("brgy_notifications");
      localStorage.removeItem("brgy_notif_read_at");
      localStorage.removeItem("brgy_profile_name");
    } catch {}

    setProfile({});
    setPosts([]);
    setShowDelete(false);
    setShowConfirmDelete(false);

    triggerToast("Account deleted ❌");
    navigate("/login");
  };

  const archiveReport = (reportId) => {
    try {
      const report = posts.find((p) => p.id === reportId);
      if (!report) return;

      const archives = JSON.parse(localStorage.getItem(LS_ARCHIVES) || "[]");
      archives.push({ ...report, archivedAt: Date.now() });
      localStorage.setItem(LS_ARCHIVES, JSON.stringify(archives));
      setArchives(archives);

      const updatedPosts = posts.filter((p) => p.id !== reportId);
      setPosts(updatedPosts);
      localStorage.setItem(LS_POSTS, JSON.stringify(updatedPosts));

      triggerToast("Report archived 🗄️");
    } catch (err) {
      console.error("Failed to archive report:", err);
    }
  };

  const deleteReport = async (reportId) => {
    try {
      const report = posts.find((p) => p.id === reportId);
      if (!report) return;

      const archivedDoc = await addDoc(collection(db, "archivedReports"), {
        ...report,
        deletedAt: Date.now(),
      });

      const updatedArchives = [
        ...archives,
        { ...report, deletedAt: Date.now(), firebaseId: archivedDoc.id },
      ];
      setArchives(updatedArchives);
      localStorage.setItem(LS_ARCHIVES, JSON.stringify(updatedArchives));

      if (report.firebaseId) {
        await deleteDoc(doc(db, "reports", report.firebaseId));
      }

      const updatedPosts = posts.filter((p) => p.id !== reportId);
      setPosts(updatedPosts);
      localStorage.setItem(LS_POSTS, JSON.stringify(updatedPosts));

      triggerToast("Report archived to Archived Reports ✅");
    } catch (err) {
      console.error("Failed to archive report:", err);
    }
  };

  const restoreReport = async (archiveId) => {
    try {
      const archivedReport = archives.find((a) => a.id === archiveId);
      if (!archivedReport) return;

      const restoredReport = { ...archivedReport };
      delete restoredReport.deletedAt;

      try {
        const newDocRef = await addDoc(collection(db, "reports"), restoredReport);
        restoredReport.firebaseId = newDocRef.id;
      } catch (err) {
        console.error("Failed to restore report to Firebase:", err);
      }

      if (archivedReport.firebaseId) {
        try {
          await deleteDoc(doc(db, "archivedReports", archivedReport.firebaseId));
        } catch (err) {
          console.error("Failed to delete archived report from Firebase:", err);
        }
      }

      const updatedArchives = archives.filter((a) => a.id !== archiveId);
      setArchives(updatedArchives);
      localStorage.setItem(LS_ARCHIVES, JSON.stringify(updatedArchives));

      const updatedPosts = [restoredReport, ...posts];
      setPosts(updatedPosts);
      localStorage.setItem(LS_POSTS, JSON.stringify(updatedPosts));

      triggerToast("Report restored successfully ✅");
    } catch (err) {
      console.error("Failed to restore report:", err);
    }
  };

  const filteredArchives = useMemo(() => {
    const now = new Date();
    return archives.filter((a) => {
      const text =
        (a.issue || "").toLowerCase() + " " + (a.desc || "").toLowerCase();
      if (searchTerm && !text.includes(searchTerm.toLowerCase())) return false;

      const ts = a.deletedAt ?? a.archivedAt ?? 0;
      const d = new Date(ts);
      if (dateFilter === "today") {
        return d.toDateString() === now.toDateString();
      }
      if (dateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      }
      if (dateFilter === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return d >= monthAgo;
      }
      return true;
    });
  }, [archives, searchTerm, dateFilter]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "—";
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    return timestamp.toString();
  };

  return (
    <div className="min-h-screen bg-[var(--color-secondary)] text-[var(--color-text)]">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 sm:py-10">
        {/* Top actions */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-white ring-1 ring-black/10 px-3 py-2 hover:bg-black/5"
          >
            <FiArrowLeft /> Back to Dashboard
          </Link>

          <div className="relative">
            {/* View Archives button */}

            <button
              onClick={() => setDropdownOpen((d) => !d)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
            >
              <FiUser /> Profile <FiChevronDown />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white ring-1 ring-black/10 shadow-md overflow-hidden z-20">
                <button
                  onClick={() => {
                    setShowEdit(true);
                    setForm(profile);
                    setConfirmPwd(profile.password || "");
                    setShowPwd(false);
                    setShowConfirmPwd(false);
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-black/5 text-[var(--color-primary)]"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => {
                    setShowDelete(true);
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <FiTrash2 /> Delete Account
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PROFILE HEADER */}
        <section className="rounded-3xl overflow-hidden ring-1 ring-black/10 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white">
          <div className="px-6 sm:px-10 py-8 sm:py-10 text-center">
            <div className="mx-auto h-24 w-24 rounded-full grid place-items-center bg-white/15 ring-1 ring-white/30 overflow-hidden">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt="Profile"
                  className="h-24 w-24 object-cover rounded-full"
                />
              ) : (
                <FiUser className="text-4xl" />
              )}
            </div>
            <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold">
              {displayName}
            </h1>
            <p className="mt-1 text-white/85">Your Barangay Portal profile</p>
            
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
              <StatPill label="Reports Submitted" value={myPosts.length} />
              <StatPill label="Last Submitted" value={formatTimestamp(lastSubmitted)} />
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
                        <div className="h-12 w-12 rounded-full grid place-items-center bg-[var(--color-secondary)] text-[var(--color-primary)] ring-1 ring-black/10">
                          <FiAlertTriangle />
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-[var(--color-primary)]">
                          {p.issue || "Issue"}
                        </h3>
                        <div className="mt-1 text-xs text-black/60 inline-flex items-center gap-1">
                          <FiClock className="opacity-70" />
                          {p?.createdAt
                            ? new Date(p.createdAt).toLocaleString()
                            : "—"}
                        </div>
                        {p.location && (
                          <div className="mt-1 text-sm text-black/70 inline-flex items-center gap-1">
                            <FiMapPin className="opacity-70" />
                            {p.location}
                          </div>
                        )}
                        {p.desc && (
                          <p className="mt-3 text-sm mx-auto max-w-xl">
                            {p.desc}
                          </p>
                        )}
                        {p.imageUrl && (
                          <div className="mt-3 w-full">
                            <img
                              src={p.imageUrl}
                              alt="Attachment"
                              className="mx-auto h-44 w-full object-cover rounded-lg ring-1 ring-black/10"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="mt-auto flex gap-3 pt-4">
                          {/* ONLY Delete button (Archive button removed as requested) */}
                          <button
                            onClick={() => deleteReport(p.id)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 text-sm"
                          >
                            <FiTrash2 /> Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>

      {/* Confirm Clear All Archives Modal */}
      <AnimatePresence>
        {showConfirmClear && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
              <FiTrash2 className="mx-auto text-4xl text-red-500 mb-3" />
              <h2 className="text-xl font-bold mb-2 text-red-600">
                Clear All Archives?
              </h2>
              <p className="text-sm text-black/70 mb-4">
                This will permanently delete all archived reports.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={clearAllArchives}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
                >
                  Yes, Clear All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT PROFILE MODAL (unchanged layout; has eye toggles) */}
      <AnimatePresence>
        {showEdit && (
          <motion.div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
            <motion.div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
              <button
                onClick={() => setShowEdit(false)}
                className="absolute top-4 right-4 text-black/60 hover:text-black"
              >
                <FiX size={20} />
              </button>
              <h2 className="text-xl font-bold text-center mb-4 text-[var(--color-primary)]">
                Edit Profile
              </h2>
              <form className="space-y-4" onSubmit={onSubmit}>
                {/* Upload Image */}
                <div>
                  <label className="text-sm font-medium mb-1 inline-flex items-center gap-2">
                    <FiImage className="opacity-80" /> Profile Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onImageUpload}
                    className="w-full text-sm"
                  />
                  {form.profileImage && (
                    <img
                      src={form.profileImage}
                      alt="Preview"
                      className="mt-2 h-20 w-20 object-cover rounded-full ring-1 ring-black/10"
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={onChange}
                      className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      name="middleName"
                      value={form.middleName}
                      onChange={onChange}
                      className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={onChange}
                      className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="relative">
                  <label className="block text-sm font-medium">Password</label>
                  <input
                    type={showPwd ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3 pr-12 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-8 p-1 text-black/60 hover:text-black"
                  >
                    {showPwd ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <label className="block text-sm font-medium">
                    Confirm Password
                  </label>
                  <input
                    type={showConfirmPwd ? "text" : "password"}
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3 pr-12 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd((v) => !v)}
                    className="absolute right-3 top-8 p-1 text-black/60 hover:text-black"
                  >
                    {showConfirmPwd ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  className="w-full rounded-xl px-4 py-3 font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                >
                  Save Changes
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE ACCOUNT CONFIRM MODAL */}
      <AnimatePresence>
        {showDelete && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
              <FiTrash2 className="mx-auto text-4xl text-red-500 mb-3" />
              <h2 className="text-xl font-bold mb-2 text-red-600">
                Delete Account?
              </h2>
              <p className="text-sm text-black/70 mb-4">
                This will permanently delete your profile and all reports.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDelete(false)}
                  className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDelete(false);
                    setShowConfirmDelete(true);
                    setDeletePwd("");
                    setDeleteError("");
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PASSWORD CONFIRM MODAL */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
              <h2 className="text-lg font-bold mb-3 text-[var(--color-primary)]">
                Confirm Password
              </h2>
              <p className="text-sm text-black/70 mb-4">
                Please enter your password to confirm deletion.
              </p>
              <div className="relative mb-3">
                <input
                  type={showDeletePwd ? "text" : "password"}
                  value={deletePwd}
                  onChange={(e) => setDeletePwd(e.target.value)}
                  className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3 pr-12 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePwd((v) => !v)}
                  className="absolute right-3 top-3 text-black/60 hover:text-black"
                >
                  {showDeletePwd ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {deleteError && (
                <p className="text-sm text-red-600 mb-3">{deleteError}</p>
              )}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (deletePwd === profile.password) {
                      onDelete();
                    } else {
                      setDeleteError("Incorrect password!");
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 right-6 z-[1000] bg-[var(--color-primary)] text-white px-4 py-3 rounded-xl shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- small components ---------- */
function StatPill({ label, value }) {
  return (
    <div className="rounded-xl px-4 py-3 bg-white/10 ring-1 ring-white/20 text-white text-center">
      <div className="text-[11px] uppercase tracking-wide text-white/80">
        {label}
      </div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto h-12 w-12 rounded-full grid place-items-center bg-[var(--color-secondary)] text-[var(--color-primary)] ring-1 ring-black/10">
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
        className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
      >
        <FiPlusCircle /> Create your first report
      </Link>
    </div>
  );
}
