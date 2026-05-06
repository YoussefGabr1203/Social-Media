import { useState, useCallback } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "./components/Navbar";
import LeftSidebar from "./components/LeftSidebar";
import RightSidebar from "./components/RightSidebar";
import ThemeToggle from "./components/ThemeToggle";
import SplashScreen from "./components/SplashScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import MessagesPage from "./pages/MessagesPage";
import SearchPage from "./pages/SearchPage";
import FriendsPage from "./pages/FriendsPage";
import NotFoundPage from "./pages/NotFoundPage";

const SPLASH_KEY = "socialdash_splash_seen";

function AppShell() {
  const theme = useSelector((s) => s.ui.theme);
  const location = useLocation();
  const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
  const isPublic = publicPaths.some((p) => location.pathname.startsWith(p));

  if (isPublic) {
    return (
      <div className={`app-shell ${theme}`}>
        <div className="position-fixed top-0 end-0 p-2 auth-corner-toggle" style={{ zIndex: 1100 }}>
          <ThemeToggle />
        </div>
        <main className="liquid-auth-main w-100">
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Routes>
        </main>
      </div>
    );
  }

  return (
    <div className={`app-shell ${theme}`}>
      {/* Bottom dock — only shown on mobile (hidden via CSS on desktop) */}
      <Navbar />
      {/* Three-column layout */}
      <div className="fb-layout">
        <LeftSidebar />
        <main className="fb-center">
          <Routes>
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/profile/edit" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
            <Route path="/profile/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
            <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}

function App() {
  const [splashDone, setSplashDone] = useState(() => sessionStorage.getItem(SPLASH_KEY) === "1");

  const finishSplash = useCallback(() => {
    sessionStorage.setItem(SPLASH_KEY, "1");
    setSplashDone(true);
  }, []);

  if (!splashDone) {
    return <SplashScreen onComplete={finishSplash} />;
  }

  return <AppShell />;
}

export default App;
