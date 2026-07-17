import { useState } from "react";
import logo from "../assets/logo.png";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const [active, setActive] = useState(false);
  const [cls, setCls] = useState("inactive");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function openNav() {
    setActive(true);
    setCls("active");
  }

  function closeNav() {
    setActive(false);
    setCls("inactive");
  }

  const handleLogout = () => {
    logout();
    closeNav();
    navigate("/");
  };

  return (
    <nav>
      <Link to="/" onClick={closeNav}>
        <img src={logo} alt="" />
      </Link>
      <ul className={cls}>
        <li>
          <Link to="/" onClick={closeNav}>Home</Link>
        </li>
        <li>
          <Link to="/find" onClick={closeNav}>Find Items</Link>
        </li>
        {user && (
          <>
            <li>
              <Link to="/post" onClick={closeNav}>Report Item</Link>
            </li>
            <li>
              <Link to="/chat" onClick={closeNav}>Messages</Link>
            </li>
          </>
        )}
        {user && user.role === "ADMIN" && (
          <li>
            <Link to="/admin" onClick={closeNav}>Admin Panel</Link>
          </li>
        )}
        {user ? (
          <li>
            <button className="nav-logout-btn" onClick={handleLogout}>
              Logout ({user.username})
            </button>
          </li>
        ) : (
          <>
            <li>
              <Link to="/login" onClick={closeNav}>Login</Link>
            </li>
            <li>
              <Link to="/register" onClick={closeNav}>Register</Link>
            </li>
          </>
        )}
      </ul>
      {active ? (
        <button className="menu-container" onClick={closeNav}>
          <CloseIcon className="menu close" />
        </button>
      ) : (
        <button className="menu-container" onClick={openNav}>
          <MenuIcon className="menu" />
        </button>
      )}
    </nav>
  );
}

export default Navbar;
