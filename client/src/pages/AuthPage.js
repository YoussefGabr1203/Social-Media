import { useDispatch, useSelector } from "react-redux";
import { login, register } from "../store/authSlice";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AuthShell from "../components/AuthShell";

const AuthPage = () => {
  const location = useLocation();
  const isRegister = location.pathname === "/register";
  const [tab, setTab] = useState(isRegister ? "signup" : "signin");

  useEffect(() => {
    setTab(isRegister ? "signup" : "signin");
  }, [isRegister]);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const goTab = (next) => {
    setTab(next);
    navigate(next === "signup" ? "/register" : "/login", { replace: true });
  };

  const onLogin = async (e) => {
    e.preventDefault();
    try {
      await dispatch(login(loginForm)).unwrap();
      toast.success("Welcome back");
      navigate("/");
    } catch (error) {
      const msg = typeof error === "string" ? error : error?.message || "Login failed";
      toast.error(msg);
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    if (regForm.password !== regForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await dispatch(register(regForm)).unwrap();
      toast.success("Account created");
      navigate("/");
    } catch (error) {
      const msg = typeof error === "string" ? error : error?.message || "Registration failed";
      toast.error(msg);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome"
      title={tab === "signin" ? "Sign in" : "Create your space"}
      subtitle={tab === "signin" ? "Pick up where the current left off." : "A few details and you are in the flow."}
    >
      <div className={`auth-tabs auth-tabs--${tab}`} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "signin"}
          className="auth-tab"
          onClick={() => goTab("signin")}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "signup"}
          className="auth-tab"
          onClick={() => goTab("signup")}
        >
          Sign up
        </button>
      </div>

      {tab === "signin" ? (
        <form className="auth-form mt-4" onSubmit={onLogin}>
          <label className="auth-field">
            <span className="auth-label">Email</span>
            <input
              className="auth-input"
              type="email"
              autoComplete="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              required
            />
          </label>
          <label className="auth-field">
            <span className="auth-label">Password</span>
            <input
              className="auth-input"
              type="password"
              autoComplete="current-password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              required
            />
          </label>
          <button className="auth-submit" type="submit" disabled={loading}>
            <span className="auth-submit-shine" aria-hidden />
            <span className="auth-submit-text">{loading ? "Signing in…" : "Enter the stream"}</span>
          </button>
          <div className="auth-links">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
        </form>
      ) : (
        <form className="auth-form mt-4" onSubmit={onRegister}>
          <label className="auth-field">
            <span className="auth-label">Username</span>
            <input
              className="auth-input"
              autoComplete="username"
              value={regForm.username}
              onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
              required
            />
          </label>
          <label className="auth-field">
            <span className="auth-label">Email</span>
            <input
              className="auth-input"
              type="email"
              autoComplete="email"
              value={regForm.email}
              onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
              required
            />
          </label>
          <label className="auth-field">
            <span className="auth-label">Password</span>
            <input
              className="auth-input"
              type="password"
              autoComplete="new-password"
              value={regForm.password}
              onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
              required
            />
          </label>
          <label className="auth-field">
            <span className="auth-label">Confirm password</span>
            <input
              className="auth-input"
              type="password"
              autoComplete="new-password"
              value={regForm.confirmPassword}
              onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
              required
            />
          </label>
          <button className="auth-submit" type="submit" disabled={loading}>
            <span className="auth-submit-shine" aria-hidden />
            <span className="auth-submit-text">{loading ? "Creating…" : "Start flowing"}</span>
          </button>
        </form>
      )}
    </AuthShell>
  );
};

export default AuthPage;
