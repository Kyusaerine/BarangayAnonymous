// src/pages/Register.jsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiEye, FiEyeOff, FiMail } from "react-icons/fi";
import { auth, db, serverTimestamp } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function Register({ setProfile }) { // <-- receive setProfile from parent
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
    return score;
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

  const onSubmit = async (e) => {
  e.preventDefault();
  setTouched({
    firstName: true,
    lastName: true,
    email: true,
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

    // 2️⃣ Construct full name
    const fullName = `${form.firstName} ${form.middleName} ${form.lastName}`.trim();

    // 3️⃣ Update Firebase Auth displayName
    await updateProfile(user, { displayName: fullName });

    // 4️⃣ Save to Firestore
    await setDoc(doc(db, "users", user.uid), {
      firstName: form.firstName,
      middleName: form.middleName,
      lastName: form.lastName,
      email: form.email,
      fullName,
      loginType: "created",
      createdAt: serverTimestamp(),
    });

    // 5️⃣ Save profile in localStorage
    const updatedProfile = {
      firstName: form.firstName,
      middleName: form.middleName,
      lastName: form.lastName,
      email: form.email,
      fullName,
      loginType: "created",
      lastLogin: new Date().toLocaleString(),
    };
    localStorage.setItem("LS_PROFILE", JSON.stringify(updatedProfile));

    // 6️⃣ Update app state (so displayName works immediately)
    if (setProfile) setProfile(updatedProfile);

    alert("Account created successfully!");

    // 7️⃣ Redirect to homepage or dashboard instead of login page
    navigate("/login");  // or "/home" depende sa app mo

  } catch (error) {
    console.error("Registration error:", error);
    alert(error.message);
  }
};


  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light text-dark px-3 py-5">
      <div className="card shadow-lg border-0 rounded-4 w-100" style={{ maxWidth: "650px" }}>
        {/* Header */}
        <div
          className="px-4 py-4 text-white"
          style={{
            background: "linear-gradient(to right, var(--color-primary), var(--color-primary-hover))",
          }}
        >
          <h1 className="h3 fw-bold mb-1">Create Account</h1>
          <p className="mb-0 opacity-75 small">
            Join and access your barangay services faster.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-4">
          <div className="row g-3">
            <div className="col-sm-4">
              <Field label="First name *" error={touched.firstName && !form.firstName.trim()}>
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
            </div>
            <div className="col-sm-4">
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
            </div>
            <div className="col-sm-4">
              <Field label="Last name *" error={touched.lastName && !form.lastName.trim()}>
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
          </div>

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

          <div className="row g-3">
            <div className="col-sm-6">
              <Field
                label="Password *"
                hint={touched.password && form.password.length < 8 ? "Use at least 8 characters." : ""}
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
                      className="btn position-absolute top-50 end-0 translate-middle-y p-2 text-black-50"
                      style={{ border: "none", background: "transparent", borderRadius: "0 0.5rem 0.5rem 0"}}
                      onClick={() => setShowPwd((s) => !s)}
                      aria-label={showPwd ? "Hide password" : "Show password"}
                    >
                      {showPwd ? <FiEyeOff /> : <FiEye />}
                    </button>
                  }
                />
                <PasswordMeter score={passwordScore} />
              </Field>
            </div>

            <div className="col-sm-6">
              <Field
                label="Confirm password *"
                hint={touched.confirmPassword && !passwordsMatch ? "Passwords must match." : ""}
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
                      className="btn position-absolute top-50 end-0 translate-middle-y p-2 text-black-50"
                      style={{ border: "none", background: "transparent", borderRadius: "0 0.5rem 0.5rem 0" }}
                      onClick={() => setShowConfirmPwd((s) => !s)}
                      aria-label={showConfirmPwd ? "Hide password" : "Show password"}
                    >
                      {showConfirmPwd ? <FiEyeOff /> : <FiEye />}
                    </button>
                  }
                />
              </Field>
            </div>
          </div>

          <div className="form-check mt-3">
            <input
              id="agree"
              name="agree"
              type="checkbox"
              checked={form.agree}
              onChange={setField}
              onBlur={markTouched}
              className="form-check-input"
            />
            <label htmlFor="agree" className="form-check-label small">
              I agree to the{" "}
              <a className="text-decoration-none text-primary" href="#">Terms</a> and{" "}
              <a className="text-decoration-none text-primary" href="#">Privacy Policy</a>.
            </label>
          </div>
          {touched.agree && !form.agree && <p className="text-danger small mt-1">Please accept the terms to continue.</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className={`btn w-100 mt-3 py-2 fw-semibold rounded-pill ${canSubmit ? "bg-success text-white border-0" : "bg-light text-secondary border-0 opacity-75"}`}
          >
            CREATE ACCOUNT
          </button>

          <p className="text-center small mt-3 mb-0 text-muted">
            Already have an account?{" "}
            <Link to="/login" className="text-primary text-decoration-none">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

/* -------- Reusable UI -------- */
function Field({ label, error, hint, children }) {
  return (
    <div className="mb-2">
      <label className="form-label fw-medium small">{label}</label>
      {children}
      {error ? (
        <p className="text-danger small mt-1">{hint || "This field is required."}</p>
      ) : hint ? (
        <p className="text-muted small mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

function Input({ icon, trailing, className = "", ...props }) {
  return (
    <div className="position-relative">
      {icon && <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">{icon}</span>}
      <input {...props} className={`form-control ps-${icon ? "5" : "3"} pe-${trailing ? "5" : "3"} rounded-3 ${className}`} />
      {trailing}
    </div>
  );
}

function PasswordMeter({ score }) {
  const segments = 5;
  const label =
    score <= 1 ? "Very weak" :
    score === 2 ? "Weak" :
    score === 3 ? "Fair" :
    score === 4 ? "Strong" : "Very strong";
  return (
    <div className="mt-2">
      <div className="d-flex gap-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} className={`flex-grow-1 rounded-pill ${i < score ? "bg-primary" : "bg-light border"}`} style={{ height: "5px" }}></div>
        ))}
      </div>
      <p className="small text-muted mt-1">{label}</p>
    </div>
  );
}
