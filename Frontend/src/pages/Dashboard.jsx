import React, { useState, useEffect } from "react";
import { useAuth, apiInstance } from "../context/AuthContext";
import { useSnackbar } from "notistack";
import Navbar from "../components/Navbar";
import HashLoader from "react-spinners/HashLoader";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";

export default function Dashboard() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [claimsList, setClaimsList] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stats");

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      fetchAdminData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const statsRes = await apiInstance.get("/admin/stats");
      setStats(statsRes.data);

      const usersRes = await apiInstance.get("/admin/users");
      setUsersList(usersRes.data);

      const claimsRes = await apiInstance.get("/claims");
      setClaimsList(claimsRes.data);

      const itemsRes = await apiInstance.get("/items");
      setItemsList(itemsRes.data.data);
    } catch (error) {
      enqueueSnackbar("Error fetching administrator data", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This will also remove their posts.")) return;
    try {
      await apiInstance.delete(`/admin/users/${userId}`);
      enqueueSnackbar("User deleted successfully", { variant: "success" });
      fetchAdminData();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || "Failed to delete user", { variant: "error" });
    }
  };

  const handleUpdateClaim = async (claimId, status) => {
    try {
      await apiInstance.put(`/claims/${claimId}/status?status=${status}`);
      enqueueSnackbar(`Claim request has been ${status.toLowerCase()}`, { variant: "success" });
      fetchAdminData();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || "Failed to update claim", { variant: "error" });
    }
  };

  const handleModerateItem = async (itemId, action) => {
    try {
      if (action === "delete") {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        await apiInstance.delete(`/items/${itemId}`);
        enqueueSnackbar("Item deleted successfully", { variant: "success" });
      } else {
        await apiInstance.put(`/admin/items/${itemId}/verify?status=${action}`);
        enqueueSnackbar(`Item status updated to ${action}`, { variant: "success" });
      }
      fetchAdminData();
    } catch (error) {
      enqueueSnackbar("Spam moderation failed", { variant: "error" });
    }
  };

  if (!user || user.role !== "ADMIN") {
    return (
      <main>
        <Navbar />
        <section style={{ padding: "4rem", textAlign: "center" }}>
          <h2>Access Denied</h2>
          <p>This console is restricted to administrators only.</p>
        </section>
      </main>
    );
  }

  return (
    <main id="adminDashboard">
      <Navbar />
      <section className="admin-section">
        <h1 className="lfh1">Admin Management Portal</h1>

        {loading ? (
          <div className="admin-loader">
            <HashLoader color="#fdf004" size={50} />
            <p>Loading dashboard console...</p>
          </div>
        ) : (
          <>
            {/* Dashboard Tabs Navigation */}
            <div className="admin-tabs">
              <button className={activeTab === "stats" ? "active" : ""} onClick={() => setActiveTab("stats")}>
                Metric Overview
              </button>
              <button className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}>
                Manage Users ({usersList.length})
              </button>
              <button className={activeTab === "claims" ? "active" : ""} onClick={() => setActiveTab("claims")}>
                Review Claims ({claimsList.length})
              </button>
              <button className={activeTab === "items" ? "active" : ""} onClick={() => setActiveTab("items")}>
                Moderate Items ({itemsList.length})
              </button>
            </div>

            {/* Stats Tab */}
            {activeTab === "stats" && stats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Registered Users</h3>
                  <p className="stat-val">{stats.totalUsers}</p>
                </div>
                <div className="stat-card">
                  <h3>Total Items Posted</h3>
                  <p className="stat-val">{stats.totalItems}</p>
                  <div className="stat-sub">
                    <span>Lost: {stats.lostItems}</span>
                    <span>Found: {stats.foundItems}</span>
                  </div>
                </div>
                <div className="stat-card">
                  <h3>Successful Returns</h3>
                  <p className="stat-val">{stats.claimedItems}</p>
                </div>
                <div className="stat-card">
                  <h3>Claim Requests</h3>
                  <p className="stat-val">{stats.totalClaims}</p>
                  <div className="stat-sub">
                    <span>Pending: {stats.pendingClaims}</span>
                    <span>Approved: {stats.approvedClaims}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Email (Disclosed)</th>
                      <th>Phone (Disclosed)</th>
                      <th>Role</th>
                      <th>Joined On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((usr) => (
                      <tr key={usr.id}>
                        <td>{usr.id}</td>
                        <td><strong>{usr.username}</strong></td>
                        <td>{usr.email}</td>
                        <td>{usr.phone}</td>
                        <td><span className={`role-badge ${usr.role}`}>{usr.role}</span></td>
                        <td>{new Date(usr.createdAt).toLocaleDateString()}</td>
                        <td>
                          {usr.role !== "ADMIN" ? (
                            <button className="table-btn delete" onClick={() => handleDeleteUser(usr.id)}>
                              <DeleteIcon /> Delete
                            </button>
                          ) : (
                            <span className="text-muted"><VerifiedUserIcon style={{ fontSize: "1rem" }} /> Safe</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Claims Tab */}
            {activeTab === "claims" && (
              <div className="admin-table-wrapper">
                {claimsList.length === 0 ? (
                  <p className="empty-table-msg">No claim requests submitted yet.</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Claim ID</th>
                        <th>Item Title</th>
                        <th>Claimed By</th>
                        <th>Proof Description</th>
                        <th>Status</th>
                        <th>Date Submitted</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claimsList.map((claim) => (
                        <tr key={claim.id}>
                          <td>{claim.id}</td>
                          <td><strong>{claim.item.title}</strong> ({claim.item.type.toLowerCase()})</td>
                          <td>{claim.user.username}</td>
                          <td className="desc-cell">{claim.description}</td>
                          <td><span className={`status-badge ${claim.status}`}>{claim.status}</span></td>
                          <td>{new Date(claim.createdAt).toLocaleDateString()}</td>
                          <td>
                            {claim.status === "PENDING" ? (
                              <div className="actions-cell">
                                <button className="table-btn approve" onClick={() => handleUpdateClaim(claim.id, "APPROVED")}>
                                  <CheckIcon /> Approve
                                </button>
                                <button className="table-btn reject" onClick={() => handleUpdateClaim(claim.id, "REJECTED")}>
                                  <CloseIcon /> Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted">Processed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Items Tab */}
            {activeTab === "items" && (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Item ID</th>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Category</th>
                      <th>Reporter</th>
                      <th>Status</th>
                      <th>Reported Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsList.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td><strong>{item.title}</strong></td>
                        <td><span className={`type-badge ${item.type}`}>{item.type}</span></td>
                        <td>{item.category}</td>
                        <td>{item.founderName}</td>
                        <td><span className={`status-badge ${item.status}`}>{item.status}</span></td>
                        <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="actions-cell">
                            {item.status !== "RETURNED" && item.status !== "CLAIMED" && (
                              <button className="table-btn approve" onClick={() => handleModerateItem(item.id, "RETURNED")}>
                                Mark Returned
                              </button>
                            )}
                            <button className="table-btn delete" onClick={() => handleModerateItem(item.id, "delete")}>
                              <DeleteIcon /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
