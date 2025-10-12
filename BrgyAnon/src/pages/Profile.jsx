//PROFILE

// src/pages/Profile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMapPin,
  FiAlertTriangle,
  FiClock,
  FiImage,
  FiPlusCircle,
  FiArrowLeft,
  FiChevronDown,
  FiX,
  FiTrash2,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../firebase"; // make sure db is imported
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential, GoogleAuthProvider} from "firebase/auth";

const LS_PROFILE = "brgy_profile_data";
const LS_POSTS = "brgy_posts";
const LS_ARCHIVES = "brgy_archives";

export default function Profile() {
  const navigate = useNavigate();
  
  const currentUserId = auth.currentUser?.uid || "guest";

  const [profile, setProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_PROFILE)) || {};
    } catch {
      return {};
    }
  });

  const [form, setForm] = useState(profile);
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [posts, setPosts] = useState([]);
  const [archives, setArchives] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showConfirmDeleteReport, setShowConfirmDeleteReport] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  // ===== DELETE ACCOUNT STATES =====
  const [showDelete, setShowDelete] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deletePwd, setDeletePwd] = useState("");
  const [showDeletePwd, setShowDeletePwd] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Load profile & sync with auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const savedProfile = JSON.parse(localStorage.getItem(LS_PROFILE) || "{}");
        if (savedProfile.userId !== user.uid) {
          const newProfile = {
            ...savedProfile,
            userId: user.uid,
            email: user.email || savedProfile.email || "",
          };
          localStorage.setItem(LS_PROFILE, JSON.stringify(newProfile));
          setProfile(newProfile);
          setForm(newProfile);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync posts & archives when profile changes
  useEffect(() => {
    const savedPosts = JSON.parse(localStorage.getItem(LS_POSTS) || "[]");
    const updatedPosts = savedPosts.map((p) =>
      p.userId === currentUserId
        ? { ...p, userFullName: profile.fullName, userProfileImage: profile.profileImage }
        : p
    );
    localStorage.setItem(LS_POSTS, JSON.stringify(updatedPosts));
    setPosts(updatedPosts);

    const savedArchives = JSON.parse(localStorage.getItem(LS_ARCHIVES) || "[]");
    const updatedArchives = savedArchives.map((a) =>
      a.userId === currentUserId
        ? { ...a, userFullName: profile.fullName, userProfileImage: profile.profileImage }
        : a
    );
    localStorage.setItem(LS_ARCHIVES, JSON.stringify(updatedArchives));
    setArchives(updatedArchives);
  }, [profile, currentUserId]);

  const myPosts = useMemo(() => {
    const archivedIds = new Set(archives.map((a) => a.id));
    return posts.filter((p) => p.userId === currentUserId && !archivedIds.has(p.id));
  }, [posts, archives, currentUserId]);

const displayName = useMemo(() => {
  if (profile.loginType === "google") {
    if (profile.googleName) return profile.googleName;
    if (profile.fullName) return profile.fullName;
    if (profile.displayName) return profile.displayName; // fallback
  }
    if (profile.loginType === "create") {
    if (profile.fullName) return profile.fullName;
    const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
    if (fullName) return fullName;
    }
  if (profile.loginType === "email") {
    if (profile.fullName) return profile.fullName;
    const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
    if (fullName) return fullName;
  }
  if (profile.loginType === "guest" && profile.guestName) return profile.guestName;
  return "User";
}, [profile]);


  const lastSubmitted = useMemo(() => {
    if (myPosts.length === 0) return "—";
    const latest = Math.max(...myPosts.map((p) => Number(p.createdAt || 0)));
    return latest > 0 ? new Date(latest).toLocaleString() : "—";
  }, [myPosts]);

  const triggerToast = (msg) => {
    setToast(msg);
    window.clearTimeout(triggerToast._t);
    triggerToast._t = window.setTimeout(() => setToast(""), 3000);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm((f) => ({ ...f, profileImage: String(reader.result || "") }));
    reader.readAsDataURL(file);
  };

  const onSubmit = (e) => {
  e.preventDefault();

  if (profile.loginType === "email") {
    // Validate password is not empty
    if (!form.password) {
      setError("Password cannot be empty!");
      return;
    }

    // Validate confirm password
    if (form.password !== confirmPwd) {
      setError("Passwords do not match!");
      return;
    }
  }

  setError("");

  const fullName = `${form.firstName || ""} ${form.middleName || ""} ${form.lastName || ""}`.trim();
  const updatedProfile = {
    ...profile,
    userId: profile.userId || currentUserId,
    fullName: fullName || profile.fullName,
    firstName: form.firstName || profile.firstName || "",
    middleName: form.middleName || profile.middleName || "",
    lastName: form.lastName || profile.lastName || "",
    profileImage: form.profileImage || profile.profileImage || "",
    lastLogin: profile.lastLogin || new Date().toLocaleString(),
    password: form.password || profile.password || "",
  };

  try {
    localStorage.setItem(LS_PROFILE, JSON.stringify(updatedProfile));
    setProfile(updatedProfile);

    const updatedPosts = posts.map((p) =>
      p.userId === currentUserId
        ? { ...p, userFullName: updatedProfile.fullName, userProfileImage: updatedProfile.profileImage }
        : p
    );
    setPosts(updatedPosts);
    localStorage.setItem(LS_POSTS, JSON.stringify(updatedPosts));

    const updatedArchives = archives.map((a) =>
      a.userId === currentUserId
        ? { ...a, userFullName: updatedProfile.fullName, userProfileImage: updatedProfile.profileImage }
        : a
    );
    setArchives(updatedArchives);
    localStorage.setItem(LS_ARCHIVES, JSON.stringify(updatedArchives));

    triggerToast("Profile updated successfully ✅");
    setShowEdit(false);
    setTimeout(() => window.dispatchEvent(new Event("storage")), 100);
  } catch (err) {
    console.error("Error updating profile:", err);
    setError("Failed to update profile. Try again.");
  }
};


  // ===== DELETE REPORT =====
  const deleteReport = (reportId) => {
    setReportToDelete(reportId);
    setShowConfirmDeleteReport(true);
  };

const confirmDeleteReport = async () => {
  if (!reportToDelete) return;
  const report = posts.find((p) => p.id === reportToDelete);
  if (!report) return;

  try {
    // Move to archivedReports in Firestore
    await setDoc(doc(db, "archivedUsers", userId), {
      ...userData,
      archivedAt: Date.now()
    });
    // Delete from activeReports in Firestore
    await deleteDoc(doc(db, "activeReports", report.id));

    // Update local state and storage
    const updatedArchives = [...archives, { ...report, archivedAt: Date.now() }];
    setArchives(updatedArchives);
    localStorage.setItem(LS_ARCHIVES, JSON.stringify(updatedArchives));

    const updatedPosts = posts.filter((p) => p.id !== reportToDelete);
    setPosts(updatedPosts);
    localStorage.setItem(LS_POSTS, JSON.stringify(updatedPosts));

    setReportToDelete(null);
    setShowConfirmDeleteReport(false);
    triggerToast("Account has been deleted");
    window.dispatchEvent(new Event("storage"));
  } catch (err) {
    console.error("Error moving report:", err);
    triggerToast("Failed to move report ❌");
  }
};
  const formatTimestamp = (timestamp) => (timestamp ? new Date(timestamp).toLocaleString() : "—");

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
                  onClick={() => setShowDelete(true)}
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
                          <FiClock className="opacity-70" /> {formatTimestamp(p.createdAt)}
                        </div>
                        {p.location && (
                          <div className="mt-1 text-sm text-black/70 inline-flex items-center gap-1">
                            <FiMapPin className="opacity-70" /> {p.location}
                          </div>
                        )}
                        {p.desc && <p className="mt-3 text-sm mx-auto max-w-xl">{p.desc}</p>}
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

      {/* EDIT PROFILE MODAL */}
      <AnimatePresence>
        {showEdit && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => setShowEdit(false)}
                className="absolute top-4 right-4 text-black/60 hover:text-black"
              >
                <FiX size={22} />
              </button>

              <h2 className="text-2xl font-bold text-center mb-6 text-[var(--color-primary)]">
                Edit Profile
              </h2>

              <form onSubmit={onSubmit} className="space-y-5">
                {/* Upload Image */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full overflow-hidden ring-2 ring-[var(--color-primary)]">
                      {form.profileImage ? (
                        <img
                          src={form.profileImage}
                          alt="Profile Preview"
                          className="object-cover h-full w-full"
                        />
                      ) : (
                        <div className="h-full w-full grid place-items-center bg-[var(--color-secondary)] text-[var(--color-primary)]">
                          <FiUser size={32} />
                        </div>
                      )}
                    </div>
                    <label className="absolute -bottom-2 right-0 bg-[var(--color-primary)] text-white rounded-full p-2 cursor-pointer hover:bg-[var(--color-primary-hover)]">
                      <FiImage size={16} />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-black/60 mt-2">Click the icon to update photo</p>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName || ""}
                      onChange={onChange}
                      className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-2.5 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Middle Name</label>
                    <input
                      type="text"
                      name="middleName"
                      value={form.middleName || ""}
                      onChange={onChange}
                      className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-2.5 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName || ""}
                      onChange={onChange}
                      className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-2.5 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input
                      type={showPwd ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={onChange}
                      className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-2.5 pr-10 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-9 text-black/60 hover:text-black"
                    >
                      {showPwd ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1">Confirm Password</label>
                    <input
                      type={showConfirmPwd ? "text" : "password"}
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-2.5 pr-10 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd((v) => !v)}
                      className="absolute right-3 top-9 text-black/60 hover:text-black"
                    >
                      {showConfirmPwd ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                <button
                  type="submit"
                  className="w-full mt-2 rounded-xl px-4 py-3 font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition"
                >
                  Save Changes
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE REPORT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showConfirmDeleteReport && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <FiTrash2 className="mx-auto text-4xl text-red-500 mb-3" />
              <h2 className="text-xl font-bold mb-2 text-red-600">
                Are you sure you want to delete this report?
              </h2>
              <p className="text-sm text-black/70 mb-4">
                This report will be deleted.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowConfirmDeleteReport(false)}
                  className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDelete(false);
                    setShowConfirmDelete(true); // open password confirmation modal
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

    {/* ===== DELETE ACCOUNT MODALS ===== */}
      <AnimatePresence>
        {showDelete && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <FiTrash2 className="mx-auto text-4xl text-red-500 mb-3" />
              <h2 className="text-xl font-bold mb-2 text-red-600">
                Delete Account?
              </h2>
              <p className="text-sm text-black/70 mb-4">
                This will delete your account and posts. You will not be able to log in again.
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
              {deleteError && <p className="text-sm text-red-600 mb-3">{deleteError}</p>}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
<button
  onClick={async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      const userId = profile.userId || user.uid;

      // --- Delete posts locally ---
      const updatedPosts = posts.filter(p => p.userId !== userId);
      setPosts(updatedPosts);
      localStorage.setItem(LS_POSTS, JSON.stringify(updatedPosts));

      // --- Delete posts in Firestore ---
      const userPosts = posts.filter(p => p.userId === userId);
      await Promise.all(userPosts.map(p => deleteDoc(doc(db, "activeReports", p.id))));

      // --- Delete user in Firestore ---
      await deleteDoc(doc(db, "activeUsers", userId));
      await deleteDoc(doc(db, "users", userId));

      // --- Clear profile locally ---
      localStorage.removeItem(LS_PROFILE);

      // --- Delete Firebase Auth user ---
      await user.delete();

      // --- Notify & redirect ---
      triggerToast("Account & Posts Deleted ✅");
      setTimeout(() => navigate("/login"), 500);

    } catch (err) {
      console.error("Error deleting account:", err);
      triggerToast("Failed to delete account ❌");
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

// ===== Components =====
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