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
  const handleLogin = async (e) => {
    e.preventDefault();
    window.localStorage.setItem("isLogedIn", true)
    if (!email.trim() || !password.trim()) {
      setNotification("Please enter email and password");
      return;
    }

    try {
      const adminSnap = await getDoc(doc(db, "admin", "admin"));
      if (adminSnap.exists()) {
        const adminData = adminSnap.data();
        if (email.trim() === adminData.email && password === adminData.password) {
          await setDoc(doc(db, "admin", "admin"), { lastLogin: serverTimestamp() }, { merge: true });
          localStorage.setItem("brgy_is_admin", "true");
          navigate("/admin");
          return;
        } else if (email.trim() === adminData.email) {
          setNotification("Invalid admin password");
          return;
        }
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const archivedSnap = await getDoc(doc(db, "archive", user.uid));
      if (archivedSnap.exists()) {
        alert("Your account has been deactivated. Please contact admin.");
        await auth.signOut();
        return;
      }

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

      const archivedSnap = await getDoc(doc(db, "archive", user.uid));
      if (archivedSnap.exists()) {
        alert("Your account has been deactivated. Please contact admin.");
        await auth.signOut();
        return;
      }

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
      <div className="text-center mb-4">
        <h1 className="h3 fw-bold text-success">Welcome</h1>
        <p className="text-muted mb-3">Log in or continue as Guest</p>
      </div>

      <form onSubmit={handleLogin}>
        {/* Email */}
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="form-control rounded-pill"
            placeholder="name@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => checkSignInMethod(email)}
          />
        </div>

        {/* Password with toggle */}
        <div className="mb-3 position-relative">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            className="form-control rounded-pill"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="btn position-absolute top-50 end-0 translate-middle-y text-success"
            style={{ border: "none", background: "transparent", zIndex: 10 }}
          >
            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
        </div>

        {notification && <div className="mb-2 text-danger">{notification}</div>}

        <button type="submit" className="btn btn-success w-100 mb-3">
          LOG IN
        </button>

        {/* OR divider */}
        <div className="d-flex align-items-center my-3">
          <hr className="flex-grow-1" />
          <span className="mx-2 text-muted small">OR</span>
          <hr className="flex-grow-1" />
        </div>

        {/* Google login */}
        <button
          type="button"
          className="btn btn-light rounded-pill d-flex align-items-center justify-content-center gap-2 py-2 w-100 mb-3"
          onClick={handleGoogleLogin}
        >
          <FaGoogle style={{ color: "#EA4335" }} /> Sign in with Google
        </button>

        {/* Forgot password */}
        <div className="text-center mb-3">
          <button type="button" onClick={handlePasswordReset} className="btn btn-link p-0">
            Forgot Password?
          </button>
        </div>

        {resetMessage && <div className="mb-2 text-muted text-center small">{resetMessage}</div>}
        {error && <div className="mb-2 text-danger text-center">{error}</div>}
      </form>

      {/* Guest login */}
      <div className="mt-3">
        <label htmlFor="guestName" className="form-label">
          Guest Name (optional)
        </label>
        <input
          id="guestName"
          type="text"
          placeholder="Juan Dela Cruz"
          className="form-control mb-2"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <button type="button" onClick={handleGuestLogin} className="btn btn-secondary w-100">
          CONTINUE AS GUEST
        </button>
        {guestNameError && <div className="mt-1 text-danger small">{guestNameError}</div>}
      </div>
    </AuthShell>
  );
}
