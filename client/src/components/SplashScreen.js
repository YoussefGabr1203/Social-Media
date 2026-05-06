import { useEffect, useState } from "react";
import splashLogo from "../assets/splash-logo.png";

const SplashScreen = ({ onComplete }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setExiting(true), 2800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!exiting) return undefined;
    const t = setTimeout(onComplete, 520);
    return () => clearTimeout(t);
  }, [exiting, onComplete]);

  return (
    <div className={`splash-screen ${exiting ? "splash-out" : "splash-in"}`} role="presentation">
      <div className="splash-gradient" />
      <div className="splash-aurora" />
      <svg className="splash-waves" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden>
        <path
          className="splash-wave-path splash-wave-a"
          d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
        <path
          className="splash-wave-path splash-wave-b"
          d="M0,256L48,261.3C96,267,192,277,288,266.7C384,256,480,224,576,213.3C672,203,768,213,864,229.3C960,245,1056,267,1152,261.3C1248,256,1344,224,1392,208L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>

      <div className="splash-content">
        <div className="splash-logo-ring" aria-hidden>
          <img src={splashLogo} alt="" className="splash-logo-img" />
        </div>
        <h1 className="splash-title">SocialDash</h1>
        <p className="splash-tagline">Flow into your feed</p>
        <button type="button" className="splash-enter" onClick={() => setExiting(true)}>
          Dive in
        </button>
      </div>
    </div>
  );
};

export default SplashScreen;
