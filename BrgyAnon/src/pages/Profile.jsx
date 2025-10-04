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
  FiTrash2,
  FiX,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../firebase";

const LS_PROFILE = "brgy_profile_data";
const LS_POSTS = "brgy_posts";
const LS_ARCHIVES = "brgy_archives";
const LS_PROFILE_NAME = "brgy_profile_name";

export default function Profile() {
  const navigate = useNavigate();

  // ✅ posts state
  const [posts, setPosts] = useState([]);

  // Dropdown menu
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Edit profile modal
  const [showEdit, setShowEdit] = useState(false);
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [error, setError] = useState("");

    // archives + modal states
    const [archives, setArchives] = useState([]);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [showConfirmClear, setShowConfirmClear] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("all");


  // Delete account modals
  const [showDelete, setShowDelete] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deletePwd, setDeletePwd] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [showDeletePwd, setShowDeletePwd] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState("");

  const [profile, setProfile] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(LS_PROFILE)) || {
          firstName: "",
          middleName: "",
          lastName: "",
          password: "",
          profileImage: "",
          lastLogin: new Date().toLocaleString(),
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
      };
    }
  });
  const [form, setForm] = useState(profile);

  // ✅ ProfileName handling
  const [profileName, setProfileName] = useState(
    localStorage.getItem(LS_PROFILE_NAME) || ""
  );

  useEffect(() => {
    const user = auth.currentUser;
    if (user?.displayName) {
      setProfileName(user.displayName);
      localStorage.setItem(LS_PROFILE_NAME, user.displayName);
      return;
    }

    if (profile?.firstName || profile?.lastName) {
      const name = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
      if (name) {
        setProfileName(name);
        localStorage.setItem(LS_PROFILE_NAME, name);
        return;
      }
    }

    if (posts.length > 0) {
      const firstPost = posts[0];
      if (firstPost?.userName) {
        setProfileName(firstPost.userName);
        localStorage.setItem(LS_PROFILE_NAME, firstPost.userName);
        return;
      }
    }

    if (!profileName) {
      setProfileName("User");
      localStorage.setItem(LS_PROFILE_NAME, "User");
    }
  }, [profile, posts, profileName]);

  const displayName = (profileName || "User").trim();

  // ✅ Your reports only
  const myPosts = useMemo(
    () => posts.filter((p) => p?.userId === "me" || p?.userId === "guest"),
    [posts]
  );

  // ✅ Last submitted date
  const lastSubmitted = useMemo(() => {
    if (myPosts.length === 0) return "—";
    const latest = myPosts
      .slice()
      .sort((a, b) => (b?.createdAt || 0) - (a?.createdAt || 0))[0];
    return latest?.createdAt
      ? new Date(latest.createdAt).toLocaleString()
      : "—";
  }, [myPosts]);

  // Load posts from LS
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
      localStorage.removeItem(LS_PROFILE);
      localStorage.removeItem(LS_POSTS);
      localStorage.removeItem("brgy_role");
      localStorage.removeItem("brgy_is_admin");
      localStorage.removeItem("brgy_notifications");
      localStorage.removeItem("brgy_notif_read_at");
      localStorage.removeItem(LS_PROFILE_NAME);
    } catch {}

    setProfile({});
    setPosts([]);
    setShowDelete(false);
    setShowConfirmDelete(false);

    triggerToast("Account deleted ❌");
    navigate("/login");
  };

  // (Kept for compatibility, but NOT used in UI since you asked to remove Archive button on posts)
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
  
    // Delete Report (moves to archives) — this is the ONLY button shown on each post
    const deleteReport = (reportId) => {
      try {
        const report = posts.find((p) => p.id === reportId);
        if (!report) return;
        const archives = JSON.parse(localStorage.getItem(LS_ARCHIVES) || "[]");
        archives.push({ ...report, deletedAt: Date.now() });
        localStorage.setItem(LS_ARCHIVES, JSON.stringify(archives));
        setArchives(archives);
        const updatedPosts = posts.filter((p) => p.id !== reportId);
        setPosts(updatedPosts);
        localStorage.setItem(LS_POSTS, JSON.stringify(updatedPosts));
        triggerToast("Report deleted and moved to Archives ❌");
      } catch (err) {
        console.error("Failed to delete report:", err);
      }
    };
  
    // ✅ FIXED Restore report from archives (ensures it shows in Profile + appears at top)
    const restoreReport = (id) => {
      try {
        const item = archives.find((a) => a.id === id);
        if (!item) return;
  
        const restored = {
          ...item,
          restoredAt: Date.now(),
          userId: item.userId || "me", // ✅ ensure visible in Profile's myPosts
        };
  
        // remove any duplicate in posts and put restored on top (newest first)
        const filteredPosts = posts.filter((p) => p.id !== id);
        const newPosts = [restored, ...filteredPosts];
  
        localStorage.setItem(LS_POSTS, JSON.stringify(newPosts));
        setPosts(newPosts);
  
        const remaining = archives.filter((a) => a.id !== id);
        localStorage.setItem(LS_ARCHIVES, JSON.stringify(remaining));
        setArchives(remaining);
  
        triggerToast("Report restored ✅");
      } catch (err) {
        console.error("Failed to restore report:", err);
      }
    };
  
    // Clear all archived reports
    const clearAllArchives = () => {
      try {
        localStorage.setItem(LS_ARCHIVES, JSON.stringify([]));
        setArchives([]);
        setShowConfirmClear(false);
        triggerToast("All archives cleared 🗑️");
      } catch (err) {
        console.error("Failed to clear archives:", err);
      }
    };
  
    // Filter archives based on search + date
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
             <h1 className="fs-1">
               {displayName}
             </h1>
             <p className="mt-1 text-white/85">Your Barangay Portal profile</p>
             <p className="mt-1 text-sm text-white/70">
               Last login: {profile.lastLogin || "—"}
             </p>
 
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
        
              {/* ARCHIVE MODAL with search + filter */}
              <AnimatePresence>
                {showArchiveModal && (
                  <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 relative"
                    >
                      <button
                        onClick={() => setShowArchiveModal(false)}
                        className="absolute top-4 right-4 text-black/60 hover:text-black"
                      >
                        <FiX size={20} />
                      </button>
        
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800">
                          Archived Reports
                        </h2>
                        {archives.length > 0 && (
                          <button
                            onClick={() => setShowConfirmClear(true)}
                            className="mr-5 px-3 py-1 text-sm rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
        
                      {/* search + filter */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                        <input
                          type="text"
                          placeholder="Search archived reports..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="flex-1 rounded-lg border px-3 py-2 text-sm ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                        />
                        <select
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value)}
                          className="rounded-lg border px-3 py-2 text-sm ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                        >
                          <option value="all">All Time</option>
                          <option value="today">Today</option>
                          <option value="week">This Week</option>
                          <option value="month">This Month</option>
                        </select>
                      </div>
        
                      {filteredArchives.length === 0 ? (
                        <div className="text-center text-black/60 py-10">
                          No archived reports found.
                        </div>
                      ) : (
                        <ul className="grid gap-4 sm:grid-cols-2 max-h-[65vh] overflow-y-auto pr-2">
                          {filteredArchives
                            .slice()
                            .sort((a, b) => {
                              const ad = a.deletedAt ?? a.archivedAt ?? 0;
                              const bd = b.deletedAt ?? b.archivedAt ?? 0;
                              return (bd || 0) - (ad || 0);
                            })
                            .map((a) => (
                              <li key={a.id || a.deletedAt || a.archivedAt}>
                                <article className="rounded-xl ring-1 ring-black/10 bg-gray-50 p-5 flex flex-col text-center">
                                  <h3 className="text-lg font-semibold text-gray-700">
                                    {a.issue || "Issue"}
                                  </h3>
                                  {a.desc && (
                                    <p className="mt-2 text-sm text-gray-600">
                                      {a.desc}
                                    </p>
                                  )}
                                  <p className="mt-2 text-xs text-gray-500">
                                    Deleted on:{" "}
                                    {new Date(
                                      a.deletedAt ?? a.archivedAt ?? Date.now()
                                    ).toLocaleString()}
                                  </p>
                                  <div className="mt-auto pt-3">
                                    <button
                                      onClick={() => restoreReport(a.id)}
                                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 text-sm mx-auto"
                                    >
                                      <FiRefreshCw /> Restore
                                    </button>
                                  </div>
                                </article>
                              </li>
                            ))}
                        </ul>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
        
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
 
       {/* EDIT PROFILE MODAL */}
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
 
       {/* ✅ TOAST */}
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
 