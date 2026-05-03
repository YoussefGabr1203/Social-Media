const AuthShell = ({ children, eyebrow, title, subtitle }) => (
  <div className="auth-page-root">
    <div className="auth-blobs" aria-hidden>
      <span className="auth-blob auth-blob-1" />
      <span className="auth-blob auth-blob-2" />
      <span className="auth-blob auth-blob-3" />
    </div>
    <div className="auth-noise" aria-hidden />
    <div className="auth-card-outer">
      <div className="auth-glass-card">
        {eyebrow && <p className="auth-eyebrow">{eyebrow}</p>}
        {title && <h1 className="auth-title">{title}</h1>}
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  </div>
);

export default AuthShell;
