import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../api/axios";
import StoryViewer from "./StoryViewer";
import CreateStoryModal from "./CreateStoryModal";
import assetUrl from "../utils/assetUrl";

const StoriesBar = () => {
  const [stories, setStories] = useState([]);
  const [viewIdx, setViewIdx] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const user = useSelector((s) => s.auth.user);

  const load = () => {
    api.get("/stories").then(({ data }) => setStories(data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  return (
    <>
      <div className="fb-stories-bar">
        {/* Create story card */}
        <div
          className="fb-story-card fb-story-create"
          onClick={() => setShowCreate(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setShowCreate(true)}
          aria-label="Create story"
        >
          {user?.profilePicture ? (
            <img src={assetUrl(user.profilePicture)} alt="" className="fb-story-bg-img" />
          ) : (
            <div className="fb-story-bg-gradient" aria-hidden />
          )}
          <div className="fb-story-create-btn" aria-hidden>+</div>
          <span className="fb-story-label">Create story</span>
        </div>

        {stories.map((story, i) => (
          <div
            key={story._id}
            className="fb-story-card"
            onClick={() => setViewIdx(i)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setViewIdx(i)}
            aria-label={`${story.creator?.username}'s story`}
            style={!story.image ? { background: story.background } : undefined}
          >
            {story.image ? (
              <img src={assetUrl(story.image)} alt="" className="fb-story-bg-img" />
            ) : (
              story.text && <p className="fb-story-text-overlay">{story.text}</p>
            )}
            {story.creator?.profilePicture ? (
              <img src={assetUrl(story.creator.profilePicture)} alt="" className="fb-story-avatar" />
            ) : (
              <div className="fb-story-avatar fb-avatar-placeholder" aria-hidden />
            )}
            <span className="fb-story-label">{story.creator?.username || "User"}</span>
          </div>
        ))}
      </div>

      {viewIdx !== null && (
        <StoryViewer
          stories={stories}
          initialIndex={viewIdx}
          onClose={() => setViewIdx(null)}
        />
      )}

      {showCreate && (
        <CreateStoryModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}
    </>
  );
};

export default StoriesBar;
