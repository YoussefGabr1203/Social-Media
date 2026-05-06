import { useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

const BACKGROUNDS = [
  "#1d4ed8", "#7c3aed", "#db2777",
  "#059669", "#d97706", "#dc2626",
];

const CreateStoryModal = ({ onClose, onCreated }) => {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [bg, setBg] = useState(BACKGROUNDS[0]);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!text.trim() && !image) return toast.error("Add text or an image to your story");
    setLoading(true);
    try {
      const fd = new FormData();
      if (text.trim()) fd.append("text", text);
      if (image) fd.append("image", image);
      fd.append("background", bg);
      await api.post("/stories", fd);
      onCreated();
      toast.success("Story shared!");
    } catch {
      toast.error("Could not create story");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="story-modal-overlay" onClick={onClose}>
      <div className="story-modal" onClick={(e) => e.stopPropagation()}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Create story</h5>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
        </div>

        {/* Preview */}
        <div
          className="story-modal-preview mb-3"
          style={!image ? { background: bg } : undefined}
        >
          {image ? (
            <img src={URL.createObjectURL(image)} alt="Preview" className="story-modal-preview-img" />
          ) : (
            <p className="story-modal-preview-text">{text || "Your story preview"}</p>
          )}
        </div>

        <textarea
          className="form-control mb-2"
          placeholder="Add text…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          maxLength={200}
        />
        <input
          className="form-control mb-3"
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
        />

        {!image && (
          <div className="d-flex gap-2 mb-3 align-items-center">
            <span className="small text-muted me-1">Background:</span>
            {BACKGROUNDS.map((c) => (
              <button
                key={c}
                type="button"
                className={`story-bg-swatch${bg === c ? " selected" : ""}`}
                style={{ background: c }}
                onClick={() => setBg(c)}
                aria-label={c}
              />
            ))}
          </div>
        )}

        <div className="d-flex gap-2 justify-content-end">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? "Posting…" : "Share story"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateStoryModal;
