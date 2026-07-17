import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSnackbar } from "notistack";
import Navbar from "../components/Navbar";
import HashLoader from "react-spinners/HashLoader";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      enqueueSnackbar("Please fill in all fields", { variant: "warning" });
      return;
    }

    setLoading(true);
    const res = await login(username, password);
    setLoading(false);

    if (res.success) {
      enqueueSnackbar("Logged in successfully", { variant: "success" });
      navigate("/");
    } else {
      enqueueSnackbar(res.error, { variant: "error" });
    }
  };

  return (
    <main id="loginPage" className="auth-page">
      <Navbar />
      <section className="auth-section">
        <div className="auth-card">
          <h2>Welcome Back</h2>
          <p>Login to report items and connect with other users securely.</p>
          
          {loading ? (
            <div className="loader-container">
              <HashLoader color="#fdf004" size={50} />
              <p>Authenticating...</p>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleLogin}>
              <div className="input-container">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="input-container">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="submitbtn">
                Log In
              </button>
            </form>
          )}
          
          <div className="auth-footer">
            <p>
              Don't have an account? <Link to="/register">Register here</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
