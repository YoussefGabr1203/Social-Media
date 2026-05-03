import { useDispatch } from "react-redux";
import { toggleTheme } from "../store/uiSlice";

const ThemeToggle = ({ compact }) => {
  const dispatch = useDispatch();
  return (
    <button
      type="button"
      className={`liquid-theme-toggle theme-toggle ${compact ? "liquid-theme-toggle--compact" : ""}`}
      onClick={() => dispatch(toggleTheme())}
      aria-label="Toggle light and dark theme"
    >
      <span className="liquid-theme-orbit" aria-hidden />
      <span className="liquid-theme-label">{compact ? "◐" : "Theme"}</span>
    </button>
  );
};

export default ThemeToggle;
