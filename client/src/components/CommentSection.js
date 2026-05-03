import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import { optimisticComment, removeCommentFromPost } from "../store/postsSlice";
import { useState } from "react";
import toast from "react-hot-toast";

const CommentSection = ({ post, onThreadUpdated }) => {
  const [text, setText] = useState("");
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();

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
      {post.comments?.map((c) => (
        <div key={c._id} className="small d-flex justify-content-between">
          <span><strong>{c.user?.username || "user"}:</strong> {c.text}</span>
          {(c.user?._id || c.user) === user?._id && (
            <button className="btn btn-sm btn-link p-0" onClick={() => removeComment(c._id)}>Delete</button>
          )}
        </div>
      ))}
      <div className="input-group mt-2">
        <input className="form-control" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment" />
        <button className="btn btn-outline-primary" onClick={submit}>Send</button>
      </div>
    </div>
  );
};

export default CommentSection;
