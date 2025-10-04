// src/pages/Register.jsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiEye, FiEyeOff, FiMail } from "react-icons/fi";
import { auth, db, serverTimestamp } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });
  const [touched, setTouched] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const setField = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };
  const markTouched = (e) =>
    setTouched((t) => ({ ...t, [e.target.name]: true }));

    const emailOk = useMemo(
    () => /^\S+@\S+\.\S+$/.test(form.email.trim()),
    [form.email]
  );

  const passwordScore = useMemo(() => {
    let score = 0;
    if (form.password.length >= 8) score++;
    if (/[A-Z]/.test(form.password)) score++;
    if (/[a-z]/.test(form.password)) score++;
    if (/\d/.test(form.password)) score++;
    if (/[^A-Za-z0-9]/.test(form.password)) score++;
    return score; // 0..5
  }, [form.password]);

  const passwordsMatch =
    form.password.length > 0 && form.password === form.confirmPassword;

  const requiredOk =
    form.firstName.trim() &&
    form.lastName.trim() &&
    emailOk &&
    form.password.length >= 8 &&
    passwordsMatch &&
    form.agree;
    
  const canSubmit = Boolean(requiredOk);

  // 🔹 Handle Register
  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      firstName: true,
      lastName: true,
      password: true,
      confirmPassword: true,
      agree: true,
    });
    if (!canSubmit) return;

    try {
      // 1️⃣ Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const user = userCredential.user;

      // 2️⃣ Save display name = first + last name
      await updateProfile(user, {
        displayName: `${form.firstName} ${form.lastName}`,
      });

      // 3️⃣ Save user info in Firestore
      await setDoc(doc(db, "users", user.uid), {
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        email: form.email,
        username: `${form.firstName}${form.lastName}`.toLowerCase(), 
        createdAt: serverTimestamp(),
      });

      alert("Account created successfully!");
      navigate("/login"); // ✅ Redirect to login
    } catch (error) {
      console.error("Registration error:", error);
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[var(--color-secondary)] text-[var(--color-text)] px-4 py-10">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        {/* Header */}
        <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] px-6 py-6">
          <h1 className="text-white text-2xl sm:text-3xl font-extrabold">
            Create Account
          </h1>
          <p className="text-white/80 text-sm mt-1">
            Join and access your barangay services faster.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 sm:p-8 space-y-5">
          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field
              label="First name *"
              error={touched.firstName && !form.firstName.trim()}
            >
              <Input
                icon={<FiUser />}
                id="firstName"
                name="firstName"
                placeholder="Juan"
                value={form.firstName}
                onChange={setField}
                onBlur={markTouched}
              />
            </Field>

            <Field label="Middle name">
              <Input
                icon={<FiUser />}
                id="middleName"
                name="middleName"
                placeholder="Santos"
                value={form.middleName}
                onChange={setField}
                onBlur={markTouched}
              />
            </Field>

            <Field
              label="Last name *"
              error={touched.lastName && !form.lastName.trim()}
            >
              <Input
                icon={<FiUser />}
                id="lastName"
                name="lastName"
                placeholder="Dela Cruz"
                value={form.lastName}
                onChange={setField}
                onBlur={markTouched}
              />
            </Field>
          </div>

          {/* Email */}
          <Field label="Email *" hint={touched.email && !emailOk ? "Enter a valid email." : ""} error={touched.email && !emailOk}>
            <Input
              icon={<FiMail />}
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={setField}
              onBlur={markTouched}
            />
          </Field>

          {/* Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Password *"
              hint={
                touched.password && form.password.length < 8
                  ? "Use at least 8 characters."
                  : ""
              }
              error={touched.password && form.password.length < 8}
            >
              <Input
                icon={<FiLock />}
                id="password"
                name="password"
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={setField}
                onBlur={markTouched}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="p-2 rounded-lg hover:bg-black/5"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? <FiEyeOff /> : <FiEye />}
                  </button>
                }
              />
              <PasswordMeter score={passwordScore} />
            </Field>

            <Field
              label="Confirm password *"
              hint={
                touched.confirmPassword && !passwordsMatch
                  ? "Passwords must match."
                  : ""
              }
              error={touched.confirmPassword && !passwordsMatch}
            >
              <Input
                icon={<FiLock />}
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPwd ? "text" : "password"}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={setField}
                onBlur={markTouched}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd((s) => !s)}
                    className="p-2 rounded-lg hover:bg-black/5"
                    aria-label={
                      showConfirmPwd ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPwd ? <FiEyeOff /> : <FiEye />}
                  </button>
                }
              />
            </Field>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3 pt-1">
            <input
              id="agree"
              name="agree"
              type="checkbox"
              checked={form.agree}
              onChange={setField}
              onBlur={markTouched}
              className="mt-1 h-4 w-4 rounded border-black/30 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
            <label htmlFor="agree" className="text-sm">
              I agree to the{" "}
              <a
                className="text-[var(--color-primary)] hover:underline"
                href="#"
              >
                Terms
              </a>{" "}
              and{" "}
              <a
                className="text-[var(--color-primary)] hover:underline"
                href="#"
              >
                Privacy Policy
              </a>
              .
            </label>
          </div>
          {touched.agree && !form.agree && (
            <p className="text-xs text-rose-700">
              Please accept the terms to continue.
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full mt-2 rounded-2xl px-5 py-3 font-semibold tracking-wide text-white transition outline-none focus-visible:ring-2
              ${
                canSubmit
                  ? "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] focus-visible:ring-[var(--color-primary)]"
                  : "bg-black/20 cursor-not-allowed"
              }`}
          >
            CREATE ACCOUNT
          </button>

          {/* Bottom helper */}
          <div className="text-center pt-1">
            <p className="text-sm text-black/70">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-[var(--color-primary)] hover:underline underline-offset-2"
              >
                Log in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------- Reusable UI -------- */

function Field({ label, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error ? (
        <p className="text-xs text-rose-700">
          {hint || "This field is required."}
        </p>
      ) : hint ? (
        <p className="text-xs text-black/50">{hint}</p>
      ) : null}
    </div>
  );
}

function Input({ icon, trailing, className = "", ...props }) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/50">
          {icon}
        </span>
      )}
      <input
        {...props}
        className={[
          "w-full rounded-xl bg-[var(--color-secondary)] px-4 py-3 outline-none",
          "ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--color-primary)]",
          icon ? "pl-10" : "",
          trailing ? "pr-12" : "",
          className,
        ].join(" ")}
      />
      {trailing && (
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-black/60">
          {trailing}
        </span>
      )}
    </div>
  );
}

function PasswordMeter({ score }) {
  const segments = 5;
  const label =
    score <= 1
      ? "Very weak"
      : score === 2
      ? "Weak"
      : score === 3
      ? "Fair"
      : score === 4
      ? "Strong"
      : "Very strong";
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={[
              "h-1.5 flex-1 rounded-full transition",
              i < score ? "bg-[var(--color-primary)]" : "bg-black/10",
            ].join(" ")}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-black/60">{label}</p>
    </div>
  );
}
