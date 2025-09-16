// src/pages/Register.jsx
import React, { useState } from "react";
import { FaGoogle } from "react-icons/fa";
import AuthShell from "../components/AuthShell.jsx";
import { useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { fetchSignInMethodsForEmail } from "firebase/auth";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [purpose, setPurpose] = useState("");
  const navigate = useNavigate();

  // Guest login handler
  const handleGuestLogin = (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      alert("Please enter your full name.");
      return;
    }
    // Optionally: Save guest info to context or local storage
    localStorage.setItem("guestUser", JSON.stringify({ fullName, purpose }));

    // Navigate to dashboard/home
    navigate("../home");
  };

  // Google Sign-In
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
};


  return (
    <AuthShell side="register">
      {/* Title + tagline */}
      <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6">
        Guest Login
      </h1>
      <p className="text-center text-sm text-black/60 mb-6">
        Continue as a guest user
      </p>

      {/* Guest form */}
      <form onSubmit={handleGuestLogin} className="space-y-4">
        {/* Full name */}
        <div className="space-y-2">
          <label htmlFor="full" className="text-sm font-medium">
            Full name
          </label>
          <input
            id="full"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Juan Dela Cruz"
            className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3
                       outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        {/* Purpose (optional) */}
        <div className="space-y-2">
          <label htmlFor="purpose" className="text-sm font-medium">
            Purpose (optional)
          </label>
          <input
            id="purpose"
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g., Barangay certificate inquiry"
            className="w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3
                       outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        {/* Primary button */}
        <button
          type="submit"
          className="w-full mt-2 rounded-2xl px-5 py-3 font-semibold tracking-wide
                     bg-[var(--color-primary)] text-white
                     hover:bg-[var(--color-primary-hover)] transition
                     outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          LOG IN AS GUEST
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <hr className="flex-grow border-gray-300" />
          <span className="text-xs text-gray-500">OR</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        {/* Google Sign up */}
        <button
          type="button"
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 rounded-2xl px-5 py-3 font-medium
                     bg-white text-black ring-1 ring-gray-300
                     hover:bg-gray-100 transition
                     outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
        >
          <FaGoogle style={{ color: "#EA4335" }} className="text-lg" />
          Sign up with Google
        </button>
      </form>
    </AuthShell>
  );
}
