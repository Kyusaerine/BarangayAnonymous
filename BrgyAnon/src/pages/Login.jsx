// Login.jsx
import React, { useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell.jsx";
import { auth, googleProvider, db, serverTimestamp } from "../firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc, collection, addDoc } from "firebase/firestore";

export default function Login() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [guestNameError, setGuestNameError] = useState("");
  const [notification, setNotification] = useState("");
  const navigate = useNavigate();

  // 🔹 Check if email is registered with Google
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

// 🔹 Email/password login
// 🔹 Email/password login
const handleLogin = async (e) => {
  e.preventDefault();

  if (!email.trim() || !password.trim()) {
    setNotification("Please enter email and password");
    return;
  }

  try {
    // Fetch admin doc first
    const adminSnap = await getDoc(doc(db, "admin", "admin")); // <-- added this

    if (adminSnap.exists()) {
      const adminData = adminSnap.data();
      if (email.trim() === adminData.email && password === adminData.password) {
        await setDoc(
          doc(db, "admin", "admin"),
          { lastLogin: serverTimestamp() },
          { merge: true }
        );
        localStorage.setItem("brgy_is_admin", "true");
        navigate("/admin");
        return;
      } else if (email.trim() === adminData.email) {
        setNotification("Invalid admin password");
        return;
      }
    }

    // Firebase login
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check if archived
    const archivedSnap = await getDoc(doc(db, "archive", user.uid));
    if (archivedSnap.exists()) {
      alert("Your account has been deactivated. Please contact admin.");
      await auth.signOut();
      return;
    }

    // Save login info
    await setDoc(
      doc(db, "users", user.uid),
      { email: user.email, userId: user.uid, lastLogin: serverTimestamp() },
      { merge: true }
    );

    localStorage.removeItem("brgy_is_admin");
    navigate("/home");
  } catch (err) {
    console.error("Login failed:", err.message);
    alert(err.message);
  }
};


// 🔹 Google login
const handleGoogleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if archived
    const archivedSnap = await getDoc(doc(db, "archive", user.uid));
    if (archivedSnap.exists()) {
      alert("Your account has been deactivated. Please contact admin.");
      await auth.signOut();
      return; // STOP login
    }

    // Save login info
    await setDoc(
      doc(db, "users", user.uid),
      { fullName: user.displayName || "No Name", email: user.email, userId: user.uid, lastLogin: serverTimestamp() },
      { merge: true }
    );

    localStorage.setItem(
      "googlename",
      JSON.stringify({ fullName: user.displayName, email: user.email, userId: user.uid })
    );

    localStorage.removeItem("brgy_is_admin");
    navigate("/home");
  } catch (err) {
    console.error("Google Sign-In error:", err);
    alert("Google sign-in failed: " + err.message);
  }
};


  // 🔹 Guest login
  const handleGuestLogin = async () => {
    setGuestNameError("");
    if (!fullName.trim()) {
      setGuestNameError("Please enter your full name.");
      return;
    }

    try {
      const guestId = "guest_" + Date.now();
      await setDoc(
        doc(db, "users", guestId),
        { fullName: fullName.trim(), userId: guestId, isGuest: true, createdAt: serverTimestamp() },
        { merge: true }
      );

      localStorage.setItem("guestName", fullName.trim());
      localStorage.setItem("guestId", guestId);
      localStorage.removeItem("brgy_is_admin");
      navigate("/home");
    } catch (err) {
      console.error(err);
      setError("Failed to login as guest. Please try again.");
    }
  };

  // 🔹 Forgot password
  const handlePasswordReset = async () => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (methods.includes("password")) {
        await sendPasswordResetEmail(auth, email);
        setResetMessage("📩 Please check your email for the password reset link.");
        await addDoc(collection(db, "passwordResetRequests"), {
          email,
          requestedAt: serverTimestamp(),
          triggeredBy: "manual-reset",
        });
      } else if (methods.includes("google.com")) {
        setResetMessage("⚠️ This email is registered with Google. Please sign in with Google.");
      } else {
        setResetMessage("⚠️ No account found with this email.");
      }
    } catch (err) {
      console.error(err);
      setResetMessage("Error sending reset email: " + err.message);
    }
  };

  return (
    <AuthShell side="login" onGoogleSignIn={handleGoogleLogin}>
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)]">Welcome</h1>
        <p className="text-muted">Log in or continue as Guest</p>
      </div>

      <form className="space-y-4" onSubmit={handleLogin}>
        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            id="email"
            type="text"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => checkSignInMethod(email)}
            className="form-control"
          />
        </div>

        {/* Password with toggle */}
        <div className="space-y-2 relative">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
        </div>

        <button
          type="submit"
          className="block w-full text-center mt-2 rounded-2xl px-5 py-3 font-semibold tracking-wide bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition"
        >
          LOG IN
        </button>

        {/* OR divider */}
        <div className="flex items-center gap-3 my-4">
          <hr className="flex-grow border-gray-300" />
          <span className="text-xs text-gray-500">OR</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        {/* Google login */}
        <button type="button" onClick={handleGoogleLogin} className="btn btn-default">
          Sign in with Google <FaGoogle style={{ color: "#EA4335" }} />
        </button>

        {/* Forgot password */}
        <button
          type="button"
          onClick={handlePasswordReset}
          className="text-sm text-blue-600 underline mt-2"
        >
          Forgot Password?
        </button>

        {notification && <p className="text-sm text-center text-red-600 mt-1">{notification}</p>}
        {resetMessage && <p className="text-sm text-center text-gray-600 mt-1">{resetMessage}</p>}
        {error && <p className="text-sm text-center text-red-600 mt-1">{error}</p>}
      </form>

      {/* Guest login */}
      <div className="mt-4">
        <label htmlFor="guestName" className="text-sm font-medium">Guest Name (optional)</label>
        <input
          id="guestName"
          type="text"
          placeholder="Enter your name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="form-control"
        />
        <button
          type="button"
          onClick={handleGuestLogin}
          className="block w-full text-center mt-2 rounded-2xl px-5 py-3 font-semibold tracking-wide bg-gray-500 text-white hover:bg-gray-600 transition"
        >
          CONTINUE AS GUEST
        </button>
        {guestNameError && <p className="text-sm text-red-600 mt-1">{guestNameError}</p>}
      </div>
    </AuthShell>
  );
}
