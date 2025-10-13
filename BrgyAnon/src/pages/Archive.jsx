// src/pages/Archive.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  setDoc,
  doc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  FiArchive,
  FiUser,
  FiUsers,
  FiMenu,
  FiArrowLeftCircle,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const Archive = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [users, setUsers] = useState([]);
  const [archivedUsers, setArchivedUsers] = useState([]);
  const [archivedReports, setArchivedReports] = useState([]);
  const [notif, setNotif] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const showNotification = (message) => {
    setNotif(message);
    setTimeout(() => setNotif(""), 3000);
  };

  // 🔹 Real-time listeners for users, archiveUsers, and archivedReports
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data(), isProcessing: false }));
      const filtered = data.filter(
        (u) =>
          u.isActive !== false &&
          !(
            u.email?.toLowerCase().includes("guest") ||
            u.displayName?.toLowerCase().includes("guest")
          )
      );
      setUsers(filtered);
    });

    const unsubArchivedUsers = onSnapshot(collection(db, "archiveUsers"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data(), isProcessing: false }));
      const filtered = data.filter(
        (u) =>
          u.isActive === false &&
          !(
            u.email?.toLowerCase().includes("guest") ||
            u.displayName?.toLowerCase().includes("guest")
          )
      );
      setArchivedUsers(filtered);
    });

    const unsubArchivedReports = onSnapshot(collection(db, "archivedReports"), (snapshot) => {
      const data = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter(
          (r) =>
            r.deletedBy ||
            r.deletedByName ||
            r.reportedBy ||
            r.reportedByName ||
            r.userName
        );
      setArchivedReports(data);
    });

    return () => {
      unsubUsers();
      unsubArchivedUsers();
      unsubArchivedReports();
    };
  }, []);

  // 🔹 Deactivate user (move to archiveUsers)
  const handleDeactivate = async (user) => {
    try {
      const archivedUserRef = doc(db, "archiveUsers", user.id);
      const activeUserRef = doc(db, "users", user.id);

      // Move to archiveUsers
      await setDoc(archivedUserRef, {
        ...user,
        archivedAt: serverTimestamp(),
        isActive: false,
        archived: true,
        deactivatedByAdmin: true,
      });

      // Remove from active users
      await deleteDoc(activeUserRef);

      // UI updates instantly
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setArchivedUsers((prev) => [
        ...prev,
        { ...user, archivedAt: new Date(), isActive: false },
      ]);

      showNotification(`${user.displayName || "User"} permanently deactivated!`);
    } catch (error) {
      console.error("Error deactivating user:", error);
    }
  };

  // 🔹 Restore user (move back to users)
  const handleRestoreUser = async (user) => {
    if (user.isProcessing) return;
    user.isProcessing = true;
    try {
      const userRef = doc(db, "users", user.id);
      const archiveRef = doc(db, "archiveUsers", user.id);

      // Restore user
      await setDoc(userRef, {
        ...user,
        restoredAt: serverTimestamp(),
        isActive: true,
        archived: false,
      });

      // Remove from archiveUsers
      await deleteDoc(archiveRef);

      setArchivedUsers((prev) => prev.filter((u) => u.id !== user.id));
      setUsers((prev) => [
        ...prev,
        { ...user, restoredAt: new Date(), isActive: true },
      ]);

      showNotification("User restored successfully!");
    } catch (error) {
      console.error("Error restoring user:", error);
    } finally {
      user.isProcessing = false;
    }
  };

  // 🔹 Restore report
  const handleRestoreReport = async (report) => {
    if (report.isProcessing) return;
    report.isProcessing = true;
    try {
      await setDoc(doc(db, "reports", report.id), {
        ...report,
        restoredAt: serverTimestamp(),
      });
      await deleteDoc(doc(db, "archivedReports", report.id));
      setArchivedReports((prev) => prev.filter((r) => r.id !== report.id));
      showNotification("Report restored successfully!");
    } catch (error) {
      console.error("Error restoring report:", error);
    } finally {
      report.isProcessing = false;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    return timestamp.seconds
      ? new Date(timestamp.seconds * 1000).toLocaleString()
      : new Date(timestamp).toLocaleString();
  };

  // 🔹 UI (unchanged)
  return (
    <div className="container-fluid p-0 m-0">
      <div className="d-flex flex-nowrap bg-light min-vh-100">
        {/* Sidebar */}
        <div
          className={`text-white p-3 d-flex flex-column ${
            sidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"
          }`}
          style={{
            width: sidebarOpen ? "250px" : "70px",
            transition: "width 0.3s",
            backgroundColor: "#0b2447",
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5
              className={`fw-bold mb-0 ${
                sidebarOpen ? "opacity-100" : "opacity-0 d-none"
              }`}
            >
              Archive Panel
            </h5>
            <FiMenu
              className="fs-4 cursor-pointer"
              role="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            />
          </div>

          <ul className="nav nav-pills flex-column mb-auto">
            <li className="nav-item mb-2">
              <button
                className={`nav-link w-100 text-start d-flex align-items-center ${
                  activeTab === "active" ? "active bg-primary" : "text-light"
                }`}
                onClick={() => setActiveTab("active")}
              >
                <FiUsers className="me-2" />
                {sidebarOpen && "Active Users"}
              </button>
            </li>
            <li className="nav-item mb-2">
              <button
                className={`nav-link w-100 text-start d-flex align-items-center ${
                  activeTab === "users" ? "active bg-primary" : "text-light"
                }`}
                onClick={() => setActiveTab("users")}
              >
                <FiUser className="me-2" />
                {sidebarOpen && "Archived Users"}
              </button>
            </li>
            <li className="nav-item mb-2">
              <button
                className={`nav-link w-100 text-start d-flex align-items-center ${
                  activeTab === "reports" ? "active bg-primary" : "text-light"
                }`}
                onClick={() => setActiveTab("reports")}
              >
                <FiArchive className="me-2" />
                {sidebarOpen && "Archived Reports"}
              </button>
            </li>
          </ul>
        </div>

        {/* Main content */}
        <div className="flex-grow-1 d-flex flex-column">
          {/* Header */}
          <div
            className="d-flex justify-content-between align-items-center px-4 py-3 text-white shadow-sm"
            style={{
              backgroundColor: "#0b2447",
              position: "sticky",
              top: 0,
              zIndex: 1000,
            }}
          >
            <h4 className="fw-bold mb-0">Archive Dashboard</h4>
            <button
              className="btn btn-outline-light d-flex align-items-center gap-2"
              onClick={() => navigate("/admin")}
            >
              <FiArrowLeftCircle />
              Back to Admin
            </button>
          </div>

          {/* Notification */}
          {notif && (
            <div
              className="position-fixed top-0 end-0 m-3 p-3 bg-success text-white rounded shadow"
              style={{ zIndex: 1050, minWidth: "250px" }}
            >
              {notif}
            </div>
          )}

          {/* Active Users */}
          <div className="container-fluid px-4 pt-5 mt-4">
            {activeTab === "active" && (
              <div className="card shadow border-0 rounded-4">
                <div className="card-body">
                  <h5 className="mb-3 fw-bold text-primary">Active Users</h5>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-primary">
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="text-center text-muted py-4">
                              No active users.
                            </td>
                          </tr>
                        ) : (
                          users.map((user) => (
                            <tr key={user.id}>
                              <td>{user.id}</td>
                              <td>
                                {user.fullName ||
                                  user.displayName ||
                                  `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                                  "Unknown"}
                              </td>
                              <td>{user.email}</td>
                              <td>
                                <button
                                  className="btn btn-danger btn-sm"
                                  disabled={user.isProcessing}
                                  onClick={() => handleDeactivate(user)}
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
                </div>
              </div>
            )}

            {/* Archived Users */}
            {activeTab === "users" && (
              <div className="card shadow border-0 rounded-4">
                <div className="card-body">
                  <h5 className="mb-3 fw-bold text-danger">Archived Users</h5>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-danger">
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Archived At</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {archivedUsers.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center text-muted py-4">
                              No archived users.
                            </td>
                          </tr>
                        ) : (
                          archivedUsers.map((user) => (
                            <tr key={user.id}>
                              <td>{user.id}</td>
                              <td>
                                {user.fullName ||
                                  user.displayName ||
                                  `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                                  "Unknown"}
                              </td>
                              <td>{user.email}</td>
                              <td className="text-muted small">
                                {formatTimestamp(user.archivedAt)}
                              </td>
                              <td>
                                <button
                                  className="btn btn-success btn-sm"
                                  disabled={user.isProcessing}
                                  onClick={() => handleRestoreUser(user)}
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
                </div>
              </div>
            )}


            {/* Archived Reports */}
            {activeTab === "reports" && (
              <div className="card shadow border-0 rounded-4">
                <div className="card-body">
                  <h5 className="mb-3 fw-bold text-warning">Archived Reports</h5>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-warning">
                        <tr>
                          <th>ID</th>
                          <th>Issue</th>
                          <th>Reported By</th>
                          <th>Archived At</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {archivedReports.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center text-muted py-4">
                              No archived reports.
                            </td>
                          </tr>
                        ) : (
                          archivedReports.map((report) => (
                            <tr key={`archived-report-${report.id}`}>
                              <td>{report.id}</td>
                              <td>{report.issue || "Issue"}</td>
                              <td>
                                {report.reportedByName ||
                                  report.userName ||
                                  report.reportedBy?.displayName ||
                                  report.reportedBy?.name ||
                                  report.reportedBy?.email ||
                                  "Unknown"}
                              </td>
                              <td className="text-muted small">
                                {formatTimestamp(report.archivedAt)}
                              </td>
                              <td>
                                <button
                                  className="btn btn-success btn-sm"
                                  disabled={report.isProcessing}
                                  onClick={() => handleRestoreReport(report)}
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Archive;
