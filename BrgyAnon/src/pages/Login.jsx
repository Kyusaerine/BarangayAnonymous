//login.jsx
import React, { useState } from "react";
import { FaGoogle } from "react-icons/fa";
import AuthShell from "../components/AuthShell.jsx";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider, db, serverTimestamp } from "../firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function Login() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

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

  // 🔹 Normal login / sign up
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setResetMessage("");

    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);

      if (signInMethods.includes("password")) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const user = result.user;

        await setDoc(
          doc(db, "users", user.uid),
          {
            email: user.email,
            userId: user.uid,
            lastLogin: serverTimestamp(),
          },
          { merge: true }
        );

        navigate("../home");
      } else if (signInMethods.length === 0) {
        const newUser = await createUserWithEmailAndPassword(auth, email, password);
        const user = newUser.user;

        await setDoc(doc(db, "users", user.uid), {
          fullName,
          email: user.email,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });

        navigate("../home");
      } else if (signInMethods.includes("google.com") && !signInMethods.includes("password")) {
        alert("This email is registered using Google Sign-In. Please use the Google login button.");
      } else {
        alert("This email uses an unsupported sign-in method.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      alert("Login error: " + err.message);
    }
  };

  // 🔹 Google login with reset logging
  async function handleGoogleLogin() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const methods = await fetchSignInMethodsForEmail(auth, user.email);

      if (!methods.includes("password")) {
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

        await sendPasswordResetEmail(auth, user.email);
        console.log("📩 Sent reset password email to:", user.email);

        // ✅ Firestore log
        await addDoc(collection(db, "passwordResetRequests"), {
          email: user.email,
          requestedAt: serverTimestamp(),
          triggeredBy: "auto-link",
        });
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

  // 🔹 Forgot password with reset logging
  const handlePasswordReset = async () => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (methods.includes("password")) {
        await sendPasswordResetEmail(auth, email);

        // ✅ Firestore log
        await addDoc(collection(db, "passwordResetRequests"), {
          email,
          requestedAt: serverTimestamp(),
          triggeredBy: "manual-reset",
        });

        setResetMessage("✅ Password reset email sent!");
      } else if (methods.includes("google.com")) {
        setResetMessage("⚠️ This email is registered with Google. Use Google login instead.");
      } else {
        setResetMessage("❌ No account found with this email.");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setResetMessage("❌ " + err.message);
    }
  };

  return (
    <AuthShell side="login" onGoogleSignIn={handleGoogleLogin}>
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)]">
          Welcome
        </h1>
        <p className="text-sm sm:text-base text-black/60 mt-1">
          Log in or continue as Guest
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleLogin}>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => checkSignInMethod(email)}
            value={email}
            id="email"
            type="email"
            placeholder="name@example.com"
            className="w-full rounded-xl bg-[var(--color-secondary)] placeholder-black/40 px-4 py-3
                       outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            id="password"
            type="password"
            placeholder="••••••••"
            className="w-full rounded-xl bg-[var(--color-secondary)] placeholder-black/40 px-4 py-3
                       outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        <button
          type="submit"
          className="block w-full text-center mt-2 rounded-2xl px-5 py-3 font-semibold tracking-wide
                     bg-[var(--color-primary)] text-white
                     hover:bg-[var(--color-primary-hover)] transition
                     outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          LOG IN
        </button>

        <div className="flex items-center gap-3 my-4">
          <hr className="flex-grow border-gray-300"/>
          <span className="text-xs text-gray-500">OR</span>
          <hr className="flex-grow border-gray-300"/>
        </div>

        <button
          type="button"
          className="w-full flex items-center justify-center gap-3 rounded-2xl px-5 py-3 font-medium
                     bg-white text-black ring-1 ring-gray-300
                     hover:bg-gray-100 transition"
          onClick={handleGoogleLogin}
        >
          Sign in with Google
          <FaGoogle style={{ color: "#EA4335" }} className="text-lg" />
        </button>

        
        <button
          type="button"
          onClick={handlePasswordReset}
          className="text-sm text-blue-600 underline mt-2"
        >
          Forgot Password?
        </button>

        {resetMessage && (
          <p className="text-sm text-center text-gray-600 mt-1">{resetMessage}</p>
        )}

        {error && (
          <p className="text-sm text-center text-red-600 mt-1">{error}</p>
        )}
      </form>
    </AuthShell>
  );
}

