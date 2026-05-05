import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, refreshCurrentUser } from "../store/authSlice";
import { fetchNotifications } from "../store/notifSlice";
import { fetchIncoming } from "../store/friendsSlice";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "./ThemeToggle";

const DockBtn = ({ active, icon, label, onClick, badge }) => (
  <button
    type="button"
    className={`crystal-dock-btn ${active ? "active" : ""}`}
    onClick={onClick}
    aria-label={label}
    title={label}
  >
    <span className="crystal-dock-btn-inner" aria-hidden />
    <span className="crystal-dock-icon">{icon}</span>
    <span className="crystal-dock-label">{label}</span>
    {typeof badge === "number" && badge > 0 && (
      <span className="crystal-dock-badge">{badge > 99 ? "99+" : badge}</span>
    )}
  </button>
);

const Navbar = () => {
  const { user } = useSelector((s) => s.auth);
  const unread = useSelector((s) => s.notif.unreadCount);
  const incomingFriends = useSelector((s) => s.friends.incoming);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (token) {
      dispatch(refreshCurrentUser());
      dispatch(fetchNotifications());
      dispatch(fetchIncoming());
    }
  }, [dispatch, token]);

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const path = location.pathname;
  const profilePathMatch =
    !path.startsWith("/profile/edit") && path.match(/^\/profile\/([^/]+)/);
  const activeProfileUsername =
    user && profilePathMatch ? decodeURIComponent(profilePathMatch[1]) === user.username : false;

  return (
    <>
      <header className="crystal-top-hint">
        <Link to="/" className="crystal-top-logo">
          <span className="crystal-top-gem" aria-hidden />
          SocialDash
        </Link>
      </header>

      <nav className="crystal-dock-shell" aria-label="Main navigation">
        <div className="crystal-dock-ovule">
          <div className="crystal-dock-rim" aria-hidden />
          <div className="crystal-dock-inner">
            <DockBtn active={path === "/"} icon="⌂" label="Home" onClick={() => navigate("/")} />
            <DockBtn active={path === "/search"} icon="⌕" label="Search" onClick={() => navigate("/search")} />

            <button type="button" className="crystal-dock-center" onClick={() => navigate("/")} aria-label="Home">
              <span className="crystal-dock-center-glow" aria-hidden />
              <span className="crystal-dock-center-core" aria-hidden />
            </button>

            <DockBtn
              active={path === "/notifications"}
              icon="◉"
              label="Notifications"
              onClick={() => navigate("/notifications")}
              badge={unread}
            />
            <DockBtn active={path === "/messages"} icon="💬" label="Messages" onClick={() => navigate("/messages")} />
            {user && (
              <DockBtn
                active={activeProfileUsername}
                icon="◎"
                label="Profile"
                onClick={() => navigate(`/profile/${encodeURIComponent(user.username)}`)}
              />
            )}

            <div className="crystal-dock-more-wrap" ref={menuRef}>
              <button
                type="button"
                className={`crystal-dock-btn crystal-dock-more ${menuOpen ? "active" : ""}`}
                aria-label="More"
                aria-expanded={menuOpen}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((o) => !o);
                }}
              >
                <span className="crystal-dock-btn-inner" aria-hidden />
                <span className="crystal-dock-icon">⋯</span>
                <span className="crystal-dock-label">More</span>
              </button>
              {menuOpen && (
                <div className="crystal-dock-popover" role="menu">
                  <button
                    type="button"
                    className="crystal-dock-popover-row crystal-dock-popover-link"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/friends");
                    }}
                  >
                    <span className="crystal-dock-popover-label">Friend requests</span>
                    {incomingFriends.length > 0 && (
                      <span className="crystal-dock-badge crystal-dock-badge-inline">{incomingFriends.length > 99 ? "99+" : incomingFriends.length}</span>
                    )}
                  </button>
                  <div className="crystal-dock-popover-row">
                    <span className="crystal-dock-popover-label">Appearance</span>
                    <ThemeToggle compact />
                  </div>
                  <button
                    type="button"
                    className="crystal-dock-logout"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      dispatch(logout());
                      navigate("/login");
                    }}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
