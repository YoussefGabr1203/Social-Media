import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import toast from "react-hot-toast";
import { optimisticLike, removePostFromFeed, fetchFeed } from "../store/postsSlice";
import CommentSection from "./CommentSection";
import assetUrl from "../utils/assetUrl";

const Avatar = ({ user, size = 36 }) => {
  const to = user?.username ? `/profile/${encodeURIComponent(user.username)}` : "#";
  return (
    <Link to={to} className="flex-shrink-0">
      {user?.profilePicture ? (
        <img
          src={assetUrl(user.profilePicture)}
          alt={user.username}
          className="rounded-circle"
          width={size}
          height={size}
          style={{ objectFit: "cover" }}
        />
      ) : (
        <div
          className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white"
          style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
          {user?.username?.[0]?.toUpperCase() || "?"}
        </div>
      )}
    </Link>
  );
};

const SharedPostPreview = ({ original }) => {
  if (!original) {
    return (
      <div className="border rounded p-2 mb-2 text-muted small fst-italic">
        Original post is no longer available.
      </div>
    );
  }
  return (
    <div className="border rounded p-3 mb-2" style={{ background: "var(--bs-tertiary-bg, #f8f9fa)" }}>
      <div className="d-flex align-items-center gap-2 mb-2">
        <Avatar user={original.author} size={24} />
        <div>
          <Link
            className="fw-semibold small text-decoration-none"
            to={`/profile/${encodeURIComponent(original.author?.username)}`}
          >
            {original.author?.fullName || original.author?.username}
          </Link>
          <span className="small text-muted ms-1">@{original.author?.username}</span>
        </div>
      </div>
      {original.content && <p className="mb-1 small">{original.content}</p>}
      {original.image && (
        <img src={assetUrl(original.image)} alt="original post" className="img-fluid rounded" />
      )}
    </div>
  );
};

const PostCard = ({ post, onThreadUpdated }) => {
  const [showComments, setShowComments] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareText, setShareText] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();

  const isShare = Boolean(post.sharedFrom);
  const isOwn = post.author?._id === user?._id || post.author?._id?.toString() === user?._id?.toString();

  const like = async () => {
    dispatch(optimisticLike({ postId: post._id, userId: user._id }));
    try {
      await api.post(`/posts/${post._id}/like`);
      onThreadUpdated?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Like failed");
      onThreadUpdated?.();
    }
  };

  const removePost = async () => {
    try {
      await api.delete(`/posts/${post._id}`);
      dispatch(removePostFromFeed(post._id));
      onThreadUpdated?.();
      toast.success("Post deleted");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Delete failed");
    }
  };

  const submitShare = async () => {
    setShareLoading(true);
    try {
      await api.post(`/posts/${post._id}/share`, { content: shareText });
      setSharing(false);
      setShareText("");
      toast.success("Post shared!");
      dispatch(fetchFeed({ page: 1 }));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Share failed");
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <div className="card mb-3">
      <div className="card-body">
        {/* Author header */}
        <div className="d-flex align-items-center gap-2 mb-2">
          <Avatar user={post.author} size={38} />
          <div className="flex-grow-1 min-width-0">
            <Link
              className="fw-semibold text-decoration-none d-block"
              to={`/profile/${encodeURIComponent(post.author?.username)}`}
            >
              {post.author?.fullName || post.author?.username}
            </Link>
            <span className="small text-muted">@{post.author?.username}</span>
          </div>
          {isShare && (
            <span className="badge bg-secondary small fw-normal">Shared</span>
          )}
        </div>

        {/* Optional quote text on shared posts */}
        {post.content && <p className="mb-2">{post.content}</p>}

        {/* Direct image (non-shared posts only) */}
        {post.image && !isShare && (
          <img src={assetUrl(post.image)} alt="post" className="img-fluid rounded mb-2" />
        )}

        {/* Shared post embed */}
        {isShare && <SharedPostPreview original={post.sharedFrom} />}

        {/* Action bar */}
        <div className="d-flex gap-2 mt-2 flex-wrap align-items-center">
          <button className="btn btn-sm btn-outline-danger" onClick={like}>
            ♥ {post.likes?.length || 0}
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowComments((p) => !p)}>
            💬 {post.comments?.length || 0}
          </button>
          {/* Only allow sharing original posts, not re-shares of shares */}
          {!isShare && (
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => setSharing((p) => !p)}
            >
              ↗ Share{post.shareCount > 0 ? ` (${post.shareCount})` : ""}
            </button>
          )}
          {isOwn && (
            <button className="btn btn-sm btn-outline-dark ms-auto" onClick={removePost}>
              Delete
            </button>
          )}
        </div>

        {/* Share form */}
        {sharing && (
          <div className="mt-3 p-2 border rounded">
            <p className="small text-muted mb-1">Add a comment (optional):</p>
            <textarea
              className="form-control form-control-sm mb-2"
              rows={2}
              placeholder="Say something about this post…"
              value={shareText}
              onChange={(e) => setShareText(e.target.value)}
              maxLength={500}
            />
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-primary"
                onClick={submitShare}
                disabled={shareLoading}
              >
                {shareLoading ? "Sharing…" : "Share Post"}
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => { setSharing(false); setShareText(""); }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showComments && <CommentSection post={post} onThreadUpdated={onThreadUpdated} />}
      </div>
    </div>
  );
};

export default PostCard;
