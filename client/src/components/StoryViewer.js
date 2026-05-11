import { useState, useEffect } from "react";
import api from "../api/axios";
import assetUrl from "../utils/assetUrl";

const DURATION = 5000;

const StoryViewer = ({ stories, initialIndex, onClose }) => {
  const [idx, setIdx] = useState(initialIndex);
  const story = stories[idx];

  useEffect(() => {
    if (!story) return undefined;
    api.post(`/stories/${story._id}/view`).catch(() => {});
    const t = setTimeout(() => {
      if (idx < stories.length - 1) setIdx((i) => i + 1);
      else onClose();
    }, DURATION);
    return () => clearTimeout(t);
  }, [idx, story, stories.length, onClose]);

  if (!story) return null;

  return (
    <div className="story-viewer-overlay" onClick={onClose}>
      <div className="story-viewer-card" onClick={(e) => e.stopPropagation()}>
        <div className="story-progress-bar">
          {stories.map((_, i) => (
            <div
              key={i}
              className={`story-progress-seg${i < idx ? " done" : i === idx ? " active" : ""}`}
            />
          ))}
        </div>

        <div className="story-header">
          {story.creator?.profilePicture ? (
            <img src={assetUrl(story.creator.profilePicture)} alt="" className="story-creator-avatar" />
          ) : (
            <div className="story-creator-avatar fb-avatar-placeholder" aria-hidden />
          )}
          <span className="story-creator-name">@{story.creator?.username}</span>
          <button type="button" className="story-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {story.image ? (
          <img src={assetUrl(story.image)} alt="Story" className="story-content-img" />
        ) : (
          <div className="story-content-text" style={{ background: story.background }}>
            <p>{story.text}</p>
          </div>
        )}

        {idx > 0 && (
          <button type="button" className="story-nav story-nav-prev" onClick={() => setIdx((i) => i - 1)}>‹</button>
        )}
        {idx < stories.length - 1 && (
          <button type="button" className="story-nav story-nav-next" onClick={() => setIdx((i) => i + 1)}>›</button>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
