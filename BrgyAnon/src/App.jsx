import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Officials from "./pages/Officials.jsx";
import Home from "./pages/Home.jsx";
import NewReport from "./components/NewReport.jsx";
import Profile from "./pages/Profile.jsx";
import Reportfeed from "./pages/Reportfeed.jsx";
import Register from "./pages/Register.jsx"; 
import Admin from "./pages/Admin.jsx";
import Archive from "./pages/Archive.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return null; // optional: loading spinner

  return (
    <Routes>
      {/* Force login page first */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard/officials" element={user ? <Officials /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard/newreport" element={user ? <NewReport /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard/profile" element={user ? <Profile /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard/reportfeed" element={user ? <Reportfeed /> : <Navigate to="/login" replace />} />
      <Route path="/reportfeed" element={user ? <Reportfeed /> : <Navigate to="/login" replace />} />
      <Route path="/home" element={user ? <Home /> : <Navigate to="/login" replace />} />
      <Route path="/admin" element={user ? <Admin /> : <Navigate to="/login" replace />} />
      <Route path="/archive" element={user ? <Archive /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}
