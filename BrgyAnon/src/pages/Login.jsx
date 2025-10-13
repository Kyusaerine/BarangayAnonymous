import React, { useState, useEffect } from "react";
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
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export default function Login() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState("");
  const [notificationType, setNotificationType] = useState("danger");
  const [guestNameError, setGuestNameError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(""), 10000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setNotification("");

    if (!email || !password) {
      setNotification("Please enter both email and password.");
      setNotificationType("warning");
      return;
    }

    try {
      // Check if user is archived
      const archivedQuery = query(
        collection(db, "archiveUsers"),
        where("email", "==", email.trim())
      );
      const archivedSnap = await getDocs(archivedQuery);

      if (!archivedSnap.empty) {
        setNotification(
          "⚠️ Your account has been deactivated. Please contact the admin."
        );
        setNotificationType("danger");
        return;
      }

      // Authenticate user with Firebase
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      // Check if user is an admin
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.isActive === false) {
          await signOut(auth);
          setNotification(
            "⚠️ Your account has been deactivated. Please contact the admin."
          );
          setNotificationType("danger");
          return;
        }

        // Check admin status
        if (userData.isAdmin) {
          await setDoc(
            userRef,
            { lastLogin: serverTimestamp() },
            { merge: true }
          );
          localStorage.setItem("brgy_is_admin", "true");
          navigate("/admin");
          return;
        }

        // Regular user login
        await setDoc(
          userRef,
          {
            email: user.email,
            userId: user.uid,
            lastLogin: serverTimestamp(),
            isActive: true,
          },
          { merge: true }
        );

        localStorage.setItem(
          "brgy_profile_data",
          JSON.stringify({
            loginType: "email",
            email: user.email,
            userId: user.uid,
            lastLogin: new Date().toLocaleString(),
          })
        );

        localStorage.removeItem("brgy_is_admin");
        navigate("/home");
      } else {
        setNotification("User data not found. Please contact support.");
        setNotificationType("danger");
        await signOut(auth);
      }
    } catch (err) {
      console.error("This account has been deactivated by the admin.");
      setNotification("Login failed: " + err.message);
      setNotificationType("danger");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const archivedQuery = query(
        collection(db, "archiveUsers"),
        where("email", "==", user.email)
      );
      const archivedSnap = await getDocs(archivedQuery);

      if (!archivedSnap.empty) {
        await signOut(auth);
        setNotification(
          "⚠️ Your account has been deactivated. Please contact the admin."
        );
        setNotificationType("danger");
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().isActive === false) {
        await signOut(auth);
        setNotification(
          "⚠️ Your account has been deactivated. Please contact the admin."
        );
        setNotificationType("danger");
        return;
      }

      // Check admin status for Google login
      if (userSnap.exists() && userSnap.data().isAdmin) {
        await setDoc(
          userRef,
          { lastLogin: serverTimestamp() },
          { merge: true }
        );
        localStorage.setItem("brgy_is_admin", "true");
        navigate("/admin");
        return;
      }

      await setDoc(
        userRef,
        {
          fullName: user.displayName || "No Name",
          email: user.email,
          userId: user.uid,
          lastLogin: serverTimestamp(),
          isActive: true,
        },
        { merge: true }
      );

      localStorage.setItem(
        "brgy_profile_data",
        JSON.stringify({
          loginType: "google",
          fullName: user.displayName || "No Name",
          email: user.email,
          userId: user.uid,
          lastLogin: new Date().toLocaleString(),
        })
      );

      localStorage.removeItem("brgy_is_admin");
      navigate("/home");
    } catch (err) {
      console.error("Google Login Error:", err);
      setNotification("Google login failed: " + err.message);
      setNotificationType("danger");
    }
  };

  const handleGuestLogin = async () => {
    if (!fullName.trim()) {
      setGuestNameError("Please enter your full name.");
      return;
    }

    try {
      const guestId = "guest_" + Date.now();
      await setDoc(doc(db, "users", guestId), {
        fullName,
        userId: guestId,
        isGuest: true,
        createdAt: serverTimestamp(),
      });

      localStorage.setItem(
        "brgy_profile_data",
        JSON.stringify({
          loginType: "guest",
          fullName,
          userId: guestId,
          lastLogin: new Date().toLocaleString(),
        })
      );

      localStorage.removeItem("brgy_is_admin");
      navigate("/home");
    } catch (err) {
      console.error(err);
      setNotification("Guest login failed.");
      setNotificationType("danger");
    }
  };

  const handlePasswordReset = async () => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.includes("password")) {
        await sendPasswordResetEmail(auth, email);
        setResetMessage("📩 Check your email for the reset link.");
      } else {
        setResetMessage("⚠️ Email not found or uses Google login.");
      }
    } catch (err) {
      console.error(err);
      setResetMessage("Error sending reset link.");
    }
  };

  return (
    <AuthShell side="login" onGoogleSignIn={handleGoogleLogin}>
      <div className="text-center mb-4">
        <h1 className="h3 fw-bold text-success">Welcome</h1>
        <p className="text-muted mb-3">Login or continue as Guest</p>
      </div>

      {notification && (
        <div
          className={`alert alert-${notificationType} alert-dismissible fade show`}
          role="alert"
        >
          {notification}
          <button
            type="button"
            className="btn-close"
            onClick={() => setNotification("")}
          ></button>
        </div>
      )}

      <form onSubmit={handleLogin}>
        <div className="mb-3">
          <label>Email</label>
          <input
            type="email"
            className="form-control rounded-pill"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-3 position-relative">
          <label>Password</label>
          <input
            type={showPassword ? "text" : "password"}
            className="form-control rounded-pill"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="btn position-absolute top-50 end-0 translate-middle-y text-success"
            style={{ border: "none", background: "transparent" }}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>

        <button type="submit" className="btn btn-success w-100 mb-2">
          LOG IN
        </button>

        <button
          type="button"
          className="btn btn-light rounded-pill w-100 mb-2 d-flex align-items-center justify-content-center gap-2"
          onClick={handleGoogleLogin}
        >
          <FaGoogle style={{ color: "#EA4335" }} /> Sign in with Google
        </button>

        <div className="text-center">
          <button
            type="button"
            className="btn btn-link p-0"
            onClick={handlePasswordReset}
          >
            Forgot Password?
          </button>
        </div>

        {resetMessage && (
          <p className="text-muted small text-center">{resetMessage}</p>
        )}
      </form>

      <div className="mt-4">
        <label>Guest Name (optional)</label>
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Juan Dela Cruz"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <button className="btn btn-secondary w-100" onClick={handleGuestLogin}>
          CONTINUE AS GUEST
        </button>
        {guestNameError && (
          <p className="text-danger small mt-1">{guestNameError}</p>
        )}
      </div>
    </AuthShell>
  );
}