// src/pages/Archive.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  setDoc,
  query,
  where,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

const Archive = () => {
  const [activeTab, setActiveTab] = useState("active"); // active | users | reports
  const [users, setUsers] = useState([]);
  const [archivedUsers, setArchivedUsers] = useState([]);
  const [archivedReports, setArchivedReports] = useState([]);
  const [notif, setNotif] = useState("");

  const showNotification = (message) => {
    setNotif(message);
    setTimeout(() => setNotif(""), 3000);
  };

  // Fetch active users (exclude guest accounts)
  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const filtered = data.filter(
        (u) =>
          !(u.email?.toLowerCase().includes("guest") ||
            u.displayName?.toLowerCase().includes("guest"))
      );
      setUsers(filtered);
    };
    fetchUsers();
  }, []);

  // Fetch archived users
  useEffect(() => {
    const fetchArchivedUsers = async () => {
      const snapshot = await getDocs(collection(db, "archiveUsers")); // ✅ fixed
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const filtered = data.filter(
        (u) =>
          !(u.email?.toLowerCase().includes("guest") ||
            u.displayName?.toLowerCase().includes("guest"))
      );
      setArchivedUsers(filtered);
    };
    fetchArchivedUsers();
  }, []);

  // Fetch archived reports
  useEffect(() => {
    const fetchArchivedReports = async () => {
      const snapshot = await getDocs(collection(db, "archivedReports"));
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setArchivedReports(data);
    };
    fetchArchivedReports();
  }, []);

  // Deactivate user + archive their reports
  const handleDeactivate = async (user) => {
    if (
      user.email?.toLowerCase().includes("guest") ||
      user.displayName?.toLowerCase().includes("guest")
    )
      return;

    try {
      // 1️⃣ Archive the user
      await setDoc(doc(db, "archiveUsers", user.id), { ...user, archivedAt: serverTimestamp() });
      await deleteDoc(doc(db, "users", user.id));

      // 2️⃣ Fetch all reports of this user
      const reportsQuery = query(collection(db, "reports"), where("userEmail", "==", user.email));
      const snapshot = await getDocs(reportsQuery);
      const reports = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      // 3️⃣ Archive each report
      for (const report of reports) {
        await setDoc(doc(db, "archivedReports", report.id), {
          ...report,
          archivedAt: serverTimestamp(),
        });
        await deleteDoc(doc(db, "reports", report.id));
      }

      // 4️⃣ Update local state
      setUsers(users.filter((u) => u.id !== user.id));
      setArchivedUsers([...archivedUsers, { ...user, archivedAt: new Date() }]);
      setArchivedReports([
        ...archivedReports,
        ...reports.map((r) => ({ ...r, archivedAt: new Date() })),
      ]);

      showNotification("User and their reports archived successfully!");
    } catch (error) {
      console.error("Error archiving user and reports:", error);
    }
  };

  // Restore user + their reports
  const handleRestoreUser = async (user) => {
    try {
      // 1️⃣ Restore the user
      await setDoc(doc(db, "users", user.id), { ...user, restoredAt: serverTimestamp() });
      await deleteDoc(doc(db, "archiveUsers", user.id)); // ✅ fixed

      // 2️⃣ Fetch archived reports of this user
      const reportsQuery = query(
        collection(db, "archivedReports"),
        where("userEmail", "==", user.email)
      );
      const snapshot = await getDocs(reportsQuery);
      const reports = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      // 3️⃣ Restore each report
      for (const report of reports) {
        await setDoc(doc(db, "reports", report.id), {
          ...report,
          restoredAt: serverTimestamp(),
        });
        await deleteDoc(doc(db, "archivedReports", report.id));
      }

      // 4️⃣ Update local state
      setArchivedUsers(archivedUsers.filter((u) => u.id !== user.id));
      setUsers([...users, { ...user, restoredAt: new Date() }]);
      setArchivedReports(archivedReports.filter((r) => r.userEmail !== user.email));

      showNotification("User and their reports restored successfully!");
    } catch (error) {
      console.error("Error restoring user and reports:", error);
    }
  };

  // Restore single report
  const handleRestoreReport = async (report) => {
    try {
      await setDoc(doc(db, "reports", report.id), {
        ...report,
        restoredAt: serverTimestamp(),
      });
      await deleteDoc(doc(db, "archivedReports", report.id));

      setArchivedReports(archivedReports.filter((r) => r.id !== report.id));
      showNotification("Report restored successfully!");
    } catch (error) {
      console.error("Error restoring report:", error);
    }
  };

  // Format Firestore timestamp safely
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    return timestamp.seconds
      ? new Date(timestamp.seconds * 1000).toLocaleString()
      : new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {notif && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 w-80 px-4 py-2 rounded bg-green-100 text-green-800 text-sm text-center shadow z-50">
          {notif}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Archive Management</h1>
        <Link to="/admin" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          ← Go Back to Admin
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-semibold ${
            activeTab === "active" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("active")}
        >
          Active Users
        </button>
        <button
          className={`ml-4 px-4 py-2 font-semibold ${
            activeTab === "users" ? "border-b-2 border-red-600 text-red-600" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("users")}
        >
          Archived Users
        </button>
        <button
          className={`ml-4 px-4 py-2 font-semibold ${
            activeTab === "reports" ? "border-b-2 border-yellow-600 text-yellow-600" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("reports")}
        >
          Archived Reports
        </button>
      </div>


      {/* Active Users Table */}
      {activeTab === "active" && (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center text-gray-500 py-6">
                    No active users.
                  </td>
                </tr>
              ) : (
                users.map((user, i) => (
                  <tr key={user.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2">{user.id}</td>
                    <td className="px-4 py-2">{user.displayName || user.email}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleDeactivate(user)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Archived Users Table */}
      {activeTab === "users" && (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Archived At</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {archivedUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-gray-500 py-6">
                    No archived users.
                  </td>
                </tr>
              ) : (
                archivedUsers.map((user, i) => (
                  <tr key={user.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2">{user.id}</td>
                    <td className="px-4 py-2">{user.displayName || user.email}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">{formatTimestamp(user.archivedAt)}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleRestoreUser(user)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Archived Reports Table */}
      {activeTab === "reports" && (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">Report ID</th>
                <th className="px-4 py-2">Issue</th>
                <th className="px-4 py-2">Reported By</th>
                <th className="px-4 py-2">Archived At</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {archivedReports.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-gray-500 py-6">
                    No archived reports.
                  </td>
                </tr>
              ) : (
                archivedReports.map((report, i) => (
                  <tr key={report.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2">{report.id}</td>
                    <td className="px-4 py-2">{report.issue || "Untitled"}</td>
                    <td className="px-4 py-2">{report.userEmail || report.googleUser}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">{formatTimestamp(report.archivedAt)}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleRestoreReport(report)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Archive;
