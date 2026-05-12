import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authSlice";
import ThemeToggle from "./ThemeToggle";
import api from "../api/axios";
import assetUrl from "../utils/assetUrl";

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: "⌂" },
  { path: "/search", label: "Search", icon: "⌕" },
  { path: "/friends", label: "Friends", icon: "👥" },
  { path: "/notifications", label: "Notifications", icon: "🔔" },
  { path: "/messages", label: "Messages", icon: "💬" },
];

const LeftSidebar = () => {
  const { user } = useSelector((s) => s.auth);
  const unread = useSelector((s) => s.notif.unreadCount);
  const incoming = useSelector((s) => s.friends.incoming);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    // Invalidate server-side session (increments tokenVersion)
    try { await api.post("/auth/logout"); } catch { /* ignore — still clear local state */ }
    dispatch(logout());
    navigate("/login");
  };

  return (
    <aside className="fb-left-sidebar">
      <div className="fb-left-inner">
        <Link to="/" className="fb-logo">
          <span className="fb-logo-gem" aria-hidden />
          SocialDash
        </Link>

        {user && (
          <Link to={`/profile/${encodeURIComponent(user.username)}`} className="fb-profile-link">
            {user.profilePicture ? (
              <img src={assetUrl(user.profilePicture)} alt="" className="fb-profile-avatar" />
            ) : (
              <div className="fb-profile-avatar fb-avatar-placeholder" aria-hidden />
            )}
            <span className="fb-profile-name">{user.fullName || user.username}</span>
          </Link>
        )}

        <nav className="fb-nav" aria-label="Main navigation">
          {NAV_ITEMS.map(({ path, label, icon }) => {
            const isActive = location.pathname === path;
            const badge = label === "Notifications" ? unread : label === "Friends" ? incoming.length : 0;
            return (
              <button
                key={path}
                type="button"
                className={`fb-nav-item${isActive ? " active" : ""}`}
                onClick={() => navigate(path)}
                aria-label={label}
              >
                <span className="fb-nav-icon" aria-hidden>{icon}</span>
                <span className="fb-nav-label">{label}</span>
                {badge > 0 && (
                  <span className="fb-nav-badge">{badge > 99 ? "99+" : badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="fb-left-footer">
          <div className="fb-left-footer-row">
            <span className="fb-left-footer-label">Appearance</span>
            <ThemeToggle compact />
          </div>
          <button
            type="button"
            className="fb-nav-item fb-logout-btn"
            onClick={handleLogout}
          >
            <span className="fb-nav-icon" aria-hidden>↩</span>
            <span className="fb-nav-label">Log out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default LeftSidebar;
