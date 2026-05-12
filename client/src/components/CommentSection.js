import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { optimisticComment, removeCommentFromPost } from "../store/postsSlice";
import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import useMentionInput from "../hooks/useMentionInput";
import assetUrl from "../utils/assetUrl";

const renderText = (text) =>
  text.split(/(@\w+(?:\s\w+)*)/g).map((part, i) =>
    part.startsWith("@") ? (
      <Link key={i} to={`/profile/${encodeURIComponent(part.slice(1))}`} className="mention-link">{part}</Link>
    ) : part
  );

const CommentSection = ({ post, onThreadUpdated }) => {
  const [text, setText] = useState("");
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();

  const handleTextChange = useCallback((val) => setText(val), []);
  const { handleChange, suggestions, pickSuggestion, closeSuggestions, showDropdown } = useMentionInput(text, handleTextChange);

  const submit = async () => {
    if (!text.trim()) return;
    const comment = { _id: `tmp-${Date.now()}`, user, text, createdAt: new Date().toISOString() };
    dispatch(optimisticComment({ postId: post._id, comment }));
    setText("");
    try {
      await api.post(`/posts/${post._id}/comment`, { text });
      onThreadUpdated?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add comment");
    }
  };

  const removeComment = async (commentId) => {
    try {
      await api.delete(`/posts/${post._id}/comment/${commentId}`);
      dispatch(removeCommentFromPost({ postId: post._id, commentId }));
      onThreadUpdated?.();
      toast.success("Comment removed");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to remove comment");
    }
  };

  return (
    <div className="mt-2">
      {post.comments?.map((c) => {
        const author = c.user;
        const authorUsername = author?.username || "user";
        const isOwn = (author?._id || author) === user?._id;
        return (
          <div key={c._id} className="d-flex align-items-start gap-2 mb-2">
            <Link to={`/profile/${encodeURIComponent(authorUsername)}`} className="flex-shrink-0">
              {author?.profilePicture ? (
                <img
                  src={assetUrl(author.profilePicture)}
                  alt={authorUsername}
                  className="rounded-circle"
                  width={28}
                  height={28}
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div
                  className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white flex-shrink-0"
                  style={{ width: 28, height: 28, fontSize: 11 }}
                >
                  {authorUsername[0]?.toUpperCase()}
                </div>
              )}
            </Link>
            <div className="flex-grow-1 small">
              <Link
                to={`/profile/${encodeURIComponent(authorUsername)}`}
                className="fw-semibold text-decoration-none"
              >
                {authorUsername}
              </Link>
              <span className="ms-1">{renderText(c.text)}</span>
            </div>
            {isOwn && (
              <button className="btn btn-sm btn-link p-0 text-danger" onClick={() => removeComment(c._id)}>
                ×
              </button>
            )}
          </div>
        );
      })}
      <div className="position-relative mt-2">
        <div className="input-group">
          <input
            className="form-control form-control-sm"
            value={text}
            onChange={handleChange}
            onBlur={closeSuggestions}
            placeholder="Write a comment… use @username to mention"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
          />
          <button className="btn btn-outline-primary btn-sm" onClick={submit}>Send</button>
        </div>
        {showDropdown && (
          <ul className="mention-dropdown">
            {suggestions.map((u) => (
              <li
                key={u._id}
                className="mention-item"
                onMouseDown={() => pickSuggestion(u.username)}
              >
                <strong>@{u.username}</strong>
                {u.fullName && <span className="text-muted ms-1 small">{u.fullName}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
