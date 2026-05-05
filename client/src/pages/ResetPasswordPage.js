import { useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import AuthShell from "../components/AuthShell";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromQuery = searchParams.get("token") || "";
  const emailFromQuery = searchParams.get("email") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [token, setToken] = useState(tokenFromQuery);
  const [email, setEmail] = useState(emailFromQuery);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(
    () => token.trim() && email.trim() && password.length >= 6 && password === confirm,
    [token, email, password, confirm]
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const { data } = await api.post("/auth/reset-password", { token, email, password });
      toast.success(data.message);
      navigate("/login");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="New credentials"
      title="Choose a password"
      subtitle="Paste the token from your email if it is not filled in."
    >
      <form className="auth-form" onSubmit={submit}>
        <label className="auth-field">
          <span className="auth-label">Reset token</span>
          <input className="auth-input" value={token} onChange={(e) => setToken(e.target.value)} required />
        </label>
        <label className="auth-field">
          <span className="auth-label">Email</span>
          <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="auth-field">
          <span className="auth-label">New password</span>
          <input
            className="auth-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <label className="auth-field">
          <span className="auth-label">Confirm password</span>
          <input
            className="auth-input"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </label>
        <button className="auth-submit" type="submit" disabled={!canSubmit || loading}>
          <span className="auth-submit-shine" aria-hidden />
          <span className="auth-submit-text">{loading ? "Saving…" : "Update password"}</span>
        </button>
        <div className="auth-links">
          <Link to="/login">Back to sign in</Link>
        </div>
      </form>
    </AuthShell>
  );
};

export default ResetPasswordPage;
