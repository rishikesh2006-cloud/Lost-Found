import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSnackbar } from "notistack";
import Navbar from "../components/Navbar";
import HashLoader from "react-spinners/HashLoader";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      enqueueSnackbar("Please fill in all fields", { variant: "warning" });
      return;
    }
    if (password !== confirmPassword) {
      enqueueSnackbar("Passwords do not match", { variant: "error" });
      return;
    }
    if (password.length < 5) {
      enqueueSnackbar("Password must be at least 5 characters long", { variant: "error" });
      return;
    }
    if (!/[0-9]/.test(password)) {
      enqueueSnackbar("Password must contain at least one number", { variant: "error" });
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      enqueueSnackbar("Password must contain at least one special character", { variant: "error" });
      return;
    }


    setLoading(true);
    const res = await register(username, email, phone, password, role);
    setLoading(false);

    if (res.success) {
      enqueueSnackbar("Account created successfully! Please login.", { variant: "success" });
      navigate("/login");
    } else {
      enqueueSnackbar(res.error, { variant: "error" });
    }
  };

  return (
    <main id="registerPage" className="auth-page">
      <Navbar />
      <section className="auth-section">
        <div className="auth-card">
          <h2>Create Account</h2>
          <p>Register to report items, trace ownership, and chat securely.</p>
          
          {loading ? (
            <div className="loader-container">
              <HashLoader color="#fdf004" size={50} />
              <p>Creating your account...</p>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleRegister}>
              <div className="input-container">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="Choose username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="input-container">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="input-container">
                <label>Phone Number</label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="input-container">
                <label>Register As</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="USER">Regular User</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <div className="input-container">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Choose password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="input-container">
                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="submitbtn">
                Register
              </button>
            </form>
          )}
          
          <div className="auth-footer">
            <p>
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
