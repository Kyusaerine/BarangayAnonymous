// AUTHSHELL.JSX
import React, { useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider, db, serverTimestamp } from "../firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  EmailAuthProvider,
  linkWithCredential,
  createUserWithEmailAndPassword,
  signInAnonymously,
} from "firebase/auth";
import {
  doc,
  setDoc,
  addDoc,
  collection,
  query,       
  where,      
  getDoc,
  getDocs,
} from "firebase/firestore";
import { FiEye, FiEyeOff } from "react-icons/fi";
import Register from "../pages/Register";

export default function AuthShell() {
  const [mode, setMode] = useState("login"); // "login" | "guest"
  const isLogin = mode === "login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notification, setNotification] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  const navigate = useNavigate();

// ---------- Email/Password login ----------
const handleLogin = async (e) => {
  e.preventDefault();
  setNotification("");

  if (!email.trim() || !password.trim()) {
    setNotification("⚠️ Please enter email and password.");
    return;
  }

  try {
    // ----- Admin login (codename) -----
    if (!email.includes("@")) {
      const adminRef = collection(db, "admin");
      const q = query(adminRef, where("codename", "==", email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const adminData = snapshot.docs[0].data();
        if (adminData.isAdmin) {
          await setDoc(
            doc(db, "admin", snapshot.docs[0].id),
            { lastLogin: serverTimestamp() },
            { merge: true }
          );
          localStorage.setItem("brgy_is_admin", "true");
          navigate("../admin");
          return;
        } else {
          setNotification("⚠️ This codename is not an admin account.");
          return;
        }
      } else {
        setNotification("⚠️ Codename not found.");
        return;
      }
    }

    // ----- Normal email login (users) -----
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // ----- Check if user is deactivated -----
    const archivedSnap = await getDoc(doc(db, "archive", user.uid));
    if (archivedSnap.exists()) {
      setNotification("❌ Your account has been deleted or deactivated. Please contact admin.");
      await auth.signOut();
      return; // Stop login here
    }


    // ----- Save user info -----
    await setDoc(
      doc(db, "users", user.uid),
      {
        email: user.email,
        userId: user.uid,
        lastLogin: serverTimestamp(),
      },
      { merge: true }
    );

    localStorage.removeItem("brgy_is_admin"); // just in case
    navigate("../home");
  } catch (err) {
    console.error("Login failed:", err.message);
    setNotification("❌ " + err.message);
  }
};

  // ---------- Sign up ----------
  const handleSignup = async (e) => {
    e.preventDefault();
    setNotification("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        fullName: fullName || "No Name",
        email: user.email,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });

      navigate("../home");
    } catch (err) {
      console.error("Signup error:", err);
      setNotification(err.message);
    }
  };

  const handleGoogleLogin = async () => {
  setNotification("");
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // ----- Check if user is deactivated -----
    const archivedSnap = await getDoc(doc(db, "archive", user.uid));
    if (archivedSnap.exists()) {
      setNotification("❌ Your account has been deleted or deactivated. Please contact admin.");
      await auth.signOut();
      return; // Stop login here
    }

    // ----- Optional: link temp password for users without password -----
    const methods = await fetchSignInMethodsForEmail(auth, user.email);
    if (!methods.includes("password")) {
      const tempPassword = "TempPass123!";
      const credential = EmailAuthProvider.credential(user.email, tempPassword);
      try {
        await linkWithCredential(user, credential);
        await sendPasswordResetEmail(auth, user.email);
      } catch (err) {
        if (err.code !== "auth/provider-already-linked") throw err;
      }

      try {
        await addDoc(collection(db, "passwordResetRequests"), {
          email: user.email,
          requestedAt: serverTimestamp(),
          triggeredBy: "auto-link",
        });
      } catch (err) {
        console.warn("Could not log password reset request:", err.message);
      }
    }

    // ----- Save user info -----
    await setDoc(
      doc(db, "users", user.uid),
      {
        fullName: user.displayName || "No Name",
        email: user.email,
        userId: user.uid,
        lastLogin: serverTimestamp(),
      },
      { merge: true }
    );

    localStorage.setItem(
      "googlename",
      JSON.stringify({
        fullName: user.displayName,
        email: user.email,
        userId: user.uid,
      })
    );

    localStorage.removeItem("brgy_is_admin");
    navigate("../home");
  } catch (err) {
    console.error("Google Sign-In error:", err);
    setNotification("❌ Google sign-in failed: " + err.message);
  }
};


  // ---------- Guest login ----------
const handleGuestLogin = async (e) => {
  e.preventDefault();
  setNotification("");

  if (!fullName.trim()) {
    setNotification("⚠️ Please enter your full name.");
    return;
  }

  try {
    // Gumawa ng unique ID para sa guest user
    const guestId = "guest_" + Date.now();

    await setDoc(doc(db, "users", guestId), {
      fullName: fullName.trim(),
      purpose: purpose.trim() || null,
      isGuest: true,
      createdAt: serverTimestamp(),
    });

    // I-save sa localStorage para magamit sa buong session
    localStorage.setItem("guestUser", JSON.stringify({ fullName, purpose, guestId }));

    navigate("../home");
  } catch (err) {
    console.error("Guest login failed:", err);
    setNotification("Failed to login as guest. Please try again.");
  }
};


  // ---------- Forgot password ----------
  const handlePasswordReset = async (emailToReset) => {
    setNotification("");
    try {
      await sendPasswordResetEmail(auth, emailToReset);

      try {
        await addDoc(collection(db, "passwordResetRequests"), {
          email: emailToReset,
          requestedAt: serverTimestamp(),
          triggeredBy: "manual-reset",
        });
      } catch (err) {
        console.warn("Could not log password reset request:", err.message);
      }
    } catch (err) {
      console.error("Password reset failed:", err);
      setNotification("📩 Please check your email for the password reset link.");
    }
  };

  return (
   <div className="min-h-screen grid place-items-center bg-[var(--color-secondary)] text-[var(--color-text)] px-3 sm:px-6">
    <div className="relative w-full max-w-6xl rounded-3xl bg-white shadow-2xl overflow-hidden 
                  grid grid-cols-1 md:grid-cols-2">
        
        {/* LEFT COLUMN */}
        <div className="relative md:h-full">
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.section
                key="left-login-form"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="p-8 sm:p-10 md:p-12 h-full"
              >
                <Header title="Welcome" subtitle="Log in or continue as Guest" />

                {notification && (
                  <div className="mb-4 rounded-lg bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 text-sm text-center">
                    {notification}
                  </div>
                )}

                <LoginForm
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  onLogin={handleLogin}
                  onGoogleSignIn={handleGoogleLogin}
                  onForgot={() => setShowForgot(true)}
                />
              </motion.section>
            ) : (
              <motion.aside
                key="left-panel-mail"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative h-full grid place-items-center p-10 sm:p-12 text-white
                           bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)]"
              >
                <PanelContent
                  heading="Welcome back!"
                  body="Already registered? Log in to your account."
                  art="mail"
                >
                  <SwapButton onClick={() => setMode("login")}>LOG IN</SwapButton>
                </PanelContent>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN */}
        <div className="relative md:h-full">
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.aside
                key="right-panel-person"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative h-full grid place-items-center p-10 sm:p-12 text-white
                           bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)]"
              >
                <PanelContent
                  heading="Hello there!"
                  body="Prefer quick access? Continue as guest."
                  art="person"
                >
                  <SwapButton onClick={() => setMode("guest")}>
                    CONTINUE AS GUEST
                  </SwapButton>
                </PanelContent>
              </motion.aside>
            ) : (
              <motion.section
                key="right-guest-form"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="p-8 sm:p-10 md:p-12 h-full"
              >
                <Header title="Guest Login" subtitle="Continue as a guest user" />

                {notification && (
                  <div className="mb-4 rounded-lg bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 text-sm text-center">
                    {notification}
                  </div>
                )}

                <GuestForm
                  fullName={fullName}
                  setFullName={setFullName}
                  purpose={purpose}
                  setPurpose={setPurpose}
                  onGuestLogin={handleGuestLogin}
                  onGoogleSignIn={handleGoogleLogin}
                />
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence initial={false}>
          <motion.div
            key={mode}
            initial={{ x: isLogin ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: isLogin ? "100%" : "-100%" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="hidden md:block pointer-events-none absolute inset-y-0 right-1/2 w-1/2
                      bg-[var(--color-primary)]/10 rounded-3xl"
          />
        </AnimatePresence>

        <ForgotPasswordModal
          open={showForgot}
          onClose={() => setShowForgot(false)}
          onSubmit={handlePasswordReset}
        />
      </div>
    </div>
  );
}

/* ---------- Components ---------- */

function Header({ title, subtitle }) {
  return (
    <div className="text-center mb-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-primary)]">{title}</h1>
      <p className="text-sm sm:text-base text-black/60 mt-1">{subtitle}</p>
    </div>
  );
}

function LoginForm({ email, setEmail, password, setPassword, onLogin, onGoogleSignIn, onForgot }) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <form className="space-y-4" onSubmit={onLogin}>
      <div className="space-y-2">
        <label className="text-sm font-medium">Email or Username</label>
        <input
          type="text" 
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-control"
        />
      </div>


      <div className="space-y-2 relative">
        <label className="text-sm font-medium">Password</label>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-control"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/8 text-gray-500"
        >
          {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
        </button>
      </div>

      <button
        type="submit"
        className="w-full mt-2 rounded-2xl px-5 py-3 font-semibold tracking-wide bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      >
        LOG IN
      </button>

      <Divider />
      <GoogleButton label="Sign in with Google" onClick={onGoogleSignIn} />

      <div className="text-center">
        <button
          type="button"
          onClick={onForgot}
          className="text-sm text-[var(--color-primary)] hover:underline underline-offset-2"
        >
          Forgot password?
        </button>
      </div>
    </form>
  );
}

function GuestForm({ fullName, setFullName, purpose, setPurpose, onGuestLogin, onGoogleSignIn }) {
  const navigate = useNavigate();

  return (
    <form className="space-y-4" onSubmit={onGuestLogin}>
      <div className="space-y-2">
        <label className="text-sm font-medium">Full name</label>
        <input
          type="text"
          placeholder="Juan Dela Cruz"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="form-control"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Purpose (optional)</label>
        <input
          type="text"
          placeholder="e.g., Barangay certificate inquiry"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="form-control"
        />
      </div>


      <button
        type="submit"
        className="btn btn-success w-100"
      >
        LOG IN AS GUEST
      </button>

      <Divider />

      <button
          type="button"
          onClick={() => navigate("/register")}
          className="btn btn-outline-dark w-100"
        >
        <span className="text-success">Don’t have an account?</span>
        </button>
    </form>
  );
}


function Divider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <hr className="flex-grow border-gray-300" />
      <span className="text-xs text-gray-500">OR</span>
      <hr className="flex-grow border-gray-300" />
    </div>
  );
}

function GoogleButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 rounded-2xl px-5 py-3 font-medium bg-white text-black ring-1 ring-gray-300 hover:bg-gray-100 transition outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
    >
      <FaGoogle style={{ color: "#EA4335" }} className="text-lg" />
      {label}
    </button>
  );
}

function SwapButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="mt-2 inline-flex w-60 sm:w-64 justify-center rounded-full px-8 py-3 font-semibold bg-white/10 text-white border border-white/10 hover:bg-white hover:text-[var(--color-primary)] outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      {children}
    </button>
  );
}

function PanelContent({ heading, body, art = "mail", children }) {
  return (
    <div className="text-center space-y-6 max-w-sm">
      <h2 className="text-3xl sm:text-4xl font-extrabold">{heading}</h2>
      <div className="mx-auto w-40">{art === "person" ? <PersonSVG /> : <MailSVG />}</div>
      <p className="text-sm/6 text-white/90">{body}</p>
      {children}
    </div>
  );
}

function ForgotPasswordModal({ open, onClose, onSubmit }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    try {
      await onSubmit(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="forgot-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center p-4"
          aria-modal="true"
          role="dialog"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 w-full max-w-md rounded-2xl bg-white ring-1 ring-black/10 shadow-2xl"
          >
            <div className="px-5 py-4 border-b border-black/10">
              <h3 className="font-semibold text-[var(--color-primary)]">Forgot Password</h3>
            </div>

            {!sent ? (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {error && <div className="rounded-xl px-3 py-2 text-sm bg-rose-50 text-rose-800 ring-1 ring-rose-200">{error}</div>}
                <div className="space-y-1">
                  <label className="text-sm font-medium">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="form-control"
                    autoFocus
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-1">
                  <button type="button" onClick={onClose} className="btn btn-outline-secondary fs-6 text-black">Cancel</button>
                  <button type="submit" className="btn btn-success fs-6">Send reset link</button>
                </div>
              </form>
            ) : (
              <div className="p-5 space-y-4">
                <div className="rounded-xl bg-[var(--color-secondary)] ring-1 ring-black/10 p-4 text-sm">
                  We’ve sent a password reset link to your email address: <b>{email}</b>.
                </div>
                <div className="flex justify-end">
                  <button onClick={onClose} className="inline-flex justify-center rounded-xl px-5 py-2 font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]">Done</button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


/* ---------- SVGs ---------- */

function MailSVG() {
  return (
    <svg
      viewBox="0 0 200 160"
      className="w-full drop-shadow-lg"
      aria-hidden="true"
    >
      <rect
        x="10"
        y="40"
        width="180"
        height="110"
        rx="14"
        fill="white"
        opacity="0.15"
      />
      <path
        d="M20 60 L100 110 L180 60"
        fill="none"
        stroke="white"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <rect x="65" y="25" rx="10" width="70" height="55" fill="white" />
      <path
        d="M85 50 a15 15 0 1 1 30 0 v10"
        fill="none"
        stroke="currentColor"
        className="text-[var(--color-primary)]"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <rect
        x="96"
        y="60"
        width="18"
        height="20"
        rx="4"
        className="fill-[var(--color-primary)]"
      />
    </svg>
  );
}

function PersonSVG() {
  return (
    <svg
      viewBox="0 0 200 160"
      className="w-full drop-shadow-lg"
      aria-hidden="true"
    >
      <rect
        x="10"
        y="20"
        width="180"
        height="120"
        rx="14"
        fill="white"
        opacity="0.12"
      />
      <circle cx="100" cy="68" r="24" fill="white" />
      <path d="M50 130c6-22 26-36 50-36s44 14 50 36" fill="white" />
      <circle cx="100" cy="68" r="10" className="fill-[var(--color-primary)]" />
    </svg>
  );
}
