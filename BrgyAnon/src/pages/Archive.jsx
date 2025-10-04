// src/pages/Archive.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, deleteDoc, setDoc } from "firebase/firestore";
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
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      const filtered = data.filter(
        u => !(u.email?.toLowerCase().includes("guest") || u.displayName?.toLowerCase().includes("guest"))
      );

      setUsers(filtered);
    };
    fetchUsers();
  }, []);

  // Fetch archived users (exclude guest accounts)
  useEffect(() => {
    const fetchArchivedUsers = async () => {
      const snapshot = await getDocs(collection(db, "archive"));
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      const filtered = data.filter(
        u => !(u.email?.toLowerCase().includes("guest") || u.displayName?.toLowerCase().includes("guest"))
      );

      setArchivedUsers(filtered);
    };
    fetchArchivedUsers();
  }, []);

  // Fetch archived reports
  useEffect(() => {
    const fetchArchivedReports = async () => {
      const snapshot = await getDocs(collection(db, "archiveReports"));
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setArchivedReports(data);
    };
    fetchArchivedReports();
  }, []);

  // Deactivate user
  const handleDeactivate = async (user) => {
    // Skip guest accounts just in case
    if (user.email?.toLowerCase().includes("guest") || user.displayName?.toLowerCase().includes("guest")) return;

    await setDoc(doc(db, "archive", user.id), { ...user, archivedAt: new Date() });
    await deleteDoc(doc(db, "users", user.id));

    setUsers(users.filter(u => u.id !== user.id));
    setArchivedUsers([...archivedUsers, { ...user, archivedAt: new Date() }]);
    showNotification("User deactivated successfully!");
  };

  // Restore user
  const handleRestoreUser = async (user) => {
    await setDoc(doc(db, "users", user.id), { ...user, restoredAt: new Date() });
    await deleteDoc(doc(db, "archive", user.id));

    setArchivedUsers(archivedUsers.filter(u => u.id !== user.id));
    setUsers([...users, { ...user, restoredAt: new Date() }]);
    showNotification("User restored successfully!");
  };

  // Restore report
  const handleRestoreReport = async (report) => {
    await setDoc(doc(db, "reports", report.id), { ...report, restoredAt: new Date() });
    await deleteDoc(doc(db, "archiveReports", report.id));

    setArchivedReports(archivedReports.filter(r => r.id !== report.id));
    showNotification("Report restored successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Notification */}
      {notif && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 w-80 px-4 py-2 rounded bg-green-100 text-green-800 text-sm text-center shadow z-50">
          {notif}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Archive Management</h1>
        <Link to="/admin" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          ← Go Back to Admin
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-semibold ${activeTab === "active" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
          onClick={() => setActiveTab("active")}
        >
          Active Users
        </button>
        <button
          className={`ml-4 px-4 py-2 font-semibold ${activeTab === "users" ? "border-b-2 border-red-600 text-red-600" : "text-gray-500"}`}
          onClick={() => setActiveTab("users")}
        >
          Archived Users
        </button>
        <button
          className={`ml-4 px-4 py-2 font-semibold ${activeTab === "reports" ? "border-b-2 border-yellow-600 text-yellow-600" : "text-gray-500"}`}
          onClick={() => setActiveTab("reports")}
        >
          Archived Reports
        </button>
      </div>

      {/* Active Users */}
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
                  <td colSpan="4" className="text-center text-gray-500 py-6">No active users.</td>
                </tr>
              ) : (
                users.map((user, i) => (
                  <tr key={user.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2">{user.id}</td>
                    <td className="px-4 py-2">{user.displayName || user.fullName || user.firstName || user.lastName || user.email}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">
                      <button onClick={() => handleDeactivate(user)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">
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

      {/* Archived Users */}
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
                  <td colSpan="5" className="text-center text-gray-500 py-6">No archived users.</td>
                </tr>
              ) : (
                archivedUsers.map((user, i) => (
                  <tr key={user.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2">{user.id}</td>
                    <td className="px-4 py-2">{user.displayName || user.fullName || user.firstName || user.lastName || user.email}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {user.archivedAt ? new Date(user.archivedAt.seconds * 1000).toLocaleString() : ""}
                    </td>
                    <td className="px-4 py-2">
                      <button onClick={() => handleRestoreUser(user)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
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

      {/* Archived Reports */}
      {activeTab === "reports" && (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">Report ID</th>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Reported By</th>
                <th className="px-4 py-2">Archived At</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {archivedReports.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-gray-500 py-6">No archived reports.</td>
                </tr>
              ) : (
                archivedReports.map((report, i) => (
                  <tr key={report.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2">{report.id}</td>
                    <td className="px-4 py-2">{report.title || "Untitled"}</td>
                    <td className="px-4 py-2">{report.userEmail}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {report.archivedAt ? new Date(report.archivedAt.seconds * 1000).toLocaleString() : ""}
                    </td>
                    <td className="px-4 py-2">
                      <button onClick={() => handleRestoreReport(report)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
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
