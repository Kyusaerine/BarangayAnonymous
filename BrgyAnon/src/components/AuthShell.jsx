//AUTHSHELL.JSX
import React, { useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../firebase";
import {
  signInWithPopup, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  EmailAuthProvider,
  linkWithCredential,
  createUserWithEmailAndPassword,
      } from "firebase/auth";
import { db, serverTimestamp } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { doc, setDoc } from "firebase/firestore";


/**
 * AuthShell.jsx
 * - Combines Login and Guest Register forms with animated panels
 * - Handles Firebase authentication + navigation
 */

export default function AuthShell() {
  const [mode, setMode] = useState("login"); // "login" | "guest"
  const isLogin = mode === "login";

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgot, setShowForgot] = useState(false);  
  const [resetMessage, setResetMessage] = useState("");
  // Guest form state
  const [fullName, setFullName] = useState("");
  const [purpose, setPurpose] = useState("");

  const navigate = useNavigate();
    
   const handleSignup = async (e) => {
    e.preventDefault();
    try {
      // 🔥 Register to Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save extra profile info sa Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName,
        email: user.email,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });

      navigate("../home");
    } catch (err) {
      console.error("Signup error:", err.message);
      alert(err.message);
    }
  };

  // Login handler
  const checkSignInMethod = async (email) => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.includes("google.com") && !methods.includes("password")) {
        alert("This email is registered via Google Sign-In. Please use Google button.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Email + Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // save/update in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        userId: user.uid,
        lastLogin: serverTimestamp(),
      }, { merge: true });

      navigate("../home");
    } catch (err) {
      console.error("Login failed:", err.message);
      alert(err.message);
    }
  };

async function handleGoogleLogin() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const methods = await fetchSignInMethodsForEmail(auth, user.email);

      if (!methods.includes("password")) {
        // Generate temporary password for linking
        const tempPassword = "TempPass123!";
        const credential = EmailAuthProvider.credential(user.email, tempPassword);

        try {
          await linkWithCredential(user, credential);
          console.log("✅ Linked Google account with Email/Password");
        } catch (err) {
          if (err.code !== "auth/provider-already-linked") {
            throw err;
          }
        }

        // Always send reset email
        await sendPasswordResetEmail(auth, user.email);
        console.log("📩 Sent reset password email to:", user.email);

        // Log request to Firestore
        await addDoc(collection(db, "passwordResetRequests"), {
          email: user.email,
          requestedAt: serverTimestamp(),
          triggeredBy: "auto-link",
        });
      }

      // Save/update Firestore user
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

      // Save locally
      localStorage.setItem(
        "googlename",
        JSON.stringify({
          fullName: user.displayName,
          email: user.email,
          userId: user.uid,
        })
      );

      navigate("../home");
    } catch (err) {
      console.error("Google Sign-In error:", err);
      alert("Google sign-in failed: " + err.message);
    }
  }


  // Guest login handler
  const handleGuestLogin = (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      alert("Please enter your full name.");
      return;
    }

    // Save guest info locally or context
    localStorage.setItem("guestUser", JSON.stringify({ fullName, purpose }));

    navigate("../home");
  };

  // Google Sign-In for Guest (no linking)
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Save Google name to localStorage
      localStorage.setItem("googlename", JSON.stringify({
        fullName: user.displayName,
        email: user.email,
        userId: user.uid,
      }));

      navigate("../home");
    } catch (err) {
      console.error("Google Sign-In error:", err);
      alert("Google sign-in failed: " + err.message);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-[var(--color-secondary)] text-[var(--color-text)]">
      <div className="relative w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid md:grid-cols-2 md:items-stretch">
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
                <Header
                  title="Welcome"
                  subtitle="Log in or continue as Guest"
                />
                <LoginForm
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  onLogin={handleLogin}
                  onGoogleSignIn={handleGoogleLogin}   // <-- use this
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
                <GuestForm
                  fullName={fullName}
                  setFullName={setFullName}
                  purpose={purpose}
                  setPurpose={setPurpose}
                  onGuestLogin={handleGuestLogin}
                  onGoogleSignIn={signInWithGoogle}
                />
              </motion.section>
            )}
          </AnimatePresence>
        </div>

       {/* CENTER SLIDING GLASS OVERLAY (desktop only) */}
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

          {/* ✅ Add this below everything before outermost </div> */}
          <ForgotPasswordModal open={showForgot} onClose={() => setShowForgot(false)} />
      </div>
    </div>
  );
}

/* ---------- helpers (same file) ---------- */

function Header({ title, subtitle }) {
  return (
    <div className="text-center mb-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-primary)]">
        {title}
      </h1>
      <p className="text-sm sm:text-base text-black/60 mt-1">{subtitle}</p>
    </div>
  );
}

function LoginForm({ email, setEmail, password, setPassword, onLogin, onGoogleSignIn, onForgot }) {
  return (
    <form className="space-y-4" onSubmit={onLogin}>
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl bg-[var(--color-secondary)] placeholder-black/40 px-4 py-3
                     outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl bg-[var(--color-secondary)] placeholder-black/40 px-4 py-3
                     outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      <button
        type="submit"
        className="w-full mt-2 rounded-2xl px-5 py-3 font-semibold tracking-wide
                   bg-[var(--color-primary)] text-white
                   hover:bg-[var(--color-primary-hover)] transition
                   outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      >
        LOG IN
      </button>

      <Divider />

      <GoogleButton label="Sign in with Google" onClick={onGoogleSignIn} />
          
      {/* Forgot password link BELOW Google button */}
      <div className=" text-center">
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
  return (
    <form className="space-y-4" onSubmit={onGuestLogin}>
      <div className="space-y-2">
        <label htmlFor="full" className="text-sm font-medium">
          Full name
        </label>
        <input
          id="full"
          type="text"
          placeholder="Juan Dela Cruz"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3
                     outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="purpose" className="text-sm font-medium">
          Purpose (optional)
        </label>
        <input
          id="purpose"
          type="text"
          placeholder="e.g., Barangay certificate inquiry"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3
                     outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      <button
        type="submit"
        className="w-full mt-2 rounded-2xl px-5 py-3 font-semibold tracking-wide
                   bg-[var(--color-primary)] text-white
                   hover:bg-[var(--color-primary-hover)] transition
                   outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      >
        LOG IN AS GUEST
      </button>

      <Divider />

      <GoogleButton label="Sign up with Google" onClick={onGoogleSignIn} />
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
      className="w-full flex items-center justify-center gap-3 rounded-2xl px-5 py-3 font-medium
                 bg-white text-black ring-1 ring-gray-300
                 hover:bg-gray-100 transition
                 outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
    >
      <FaGoogle style={{ color: "#EA4335" }} className="text-lg" />
      {label}
    </button>
  );
}

/* Filled green CTA (matches LOG IN / LOG IN AS GUEST) */
function SwapButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="mt-2 inline-flex w-60 sm:w-64 justify-center rounded-full px-8 py-3 font-semibold
                 bg-white/10 text-white border border-white/10
                 hover:bg-white hover:text-[var(--color-primary)] hover:border-white
                 outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      {children}
    </button>
  );
}

function PanelContent({ heading, body, art = "mail", children }) {
  return (
    <div className="text-center space-y-6 max-w-sm">
      <h2 className="text-3xl sm:text-4xl font-extrabold">{heading}</h2>

      <div className="mx-auto w-40">
        {art === "person" ? <PersonSVG /> : <MailSVG />}
      </div>

      <p className="text-sm/6 text-white/90">{body}</p>
      {children}
    </div>
  );
}

/* ---------- Forgot Password Modal ---------- */
function ForgotPasswordModal({ open, onClose }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();

    const isValid = /\S+@\S+\.\S+/.test(email);
    if (!isValid) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");

    try {
      // 🔎 Check what sign-in methods this email uses
      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (methods.includes("password")) {
        // ✅ Normal email/password reset
        await sendPasswordResetEmail(auth, email);
        setSent(true);

        await addDoc(collection(db, "passwordResetRequests"), {
          email,
          provider: "password",
          requestedAt: serverTimestamp(),
        });
      } else if (methods.includes("google.com")) {
        // ⚠️ Google account (no reset possible, but still log it)
        setSent(true);

        await addDoc(collection(db, "passwordResetRequests"), {
          email,
          provider: "google.com",
          requestedAt: serverTimestamp(),
        });
      } else {
        setError("❌ No account found with this email.");
      }
    } catch (error) {
      setError(error.message);
      console.error("Error sending reset email", error);
    }
  };

  if (!open) return null;

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
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={onClose}
          />
          {/* card */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 w-full max-w-md rounded-2xl bg-white ring-1 ring-black/10 shadow-2xl"
          >
            <div className="px-5 py-4 border-b border-black/10">
              <h3 className="font-semibold text-[var(--color-primary)]">
                Forgot Password
              </h3>
            </div>

            {!sent ? (
              <form onSubmit={onSubmit} className="p-5 space-y-4">
                {error && (
                  <div className="rounded-xl px-3 py-2 text-sm bg-rose-50 text-rose-800 ring-1 ring-rose-200">
                    {error}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-sm font-medium">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3 outline-none
                               ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
                    autoFocus
                  />
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
                    type="submit"
                    className="inline-flex justify-center rounded-xl px-5 py-2 font-semibold
                               bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]
                               focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  >
                    Send reset link
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-5 space-y-4">
                <div className="rounded-xl bg-[var(--color-secondary)] ring-1 ring-black/10 p-4 text-sm">
                  If an account exists for <b>{email}</b>, we’ll send a password
                  reset link shortly.
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={onClose}
                    className="inline-flex justify-center rounded-xl px-5 py-2 font-semibold
                               bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                  >
                    Done
                  </button>
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
