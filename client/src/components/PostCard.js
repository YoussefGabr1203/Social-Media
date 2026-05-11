import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import toast from "react-hot-toast";
import { optimisticLike, removePostFromFeed } from "../store/postsSlice";
import CommentSection from "./CommentSection";
import assetUrl from "../utils/assetUrl";

const PostCard = ({ post, onThreadUpdated }) => {
  const [showComments, setShowComments] = useState(false);
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();

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

  return (
    <div className="card mb-3">
      <div className="card-body">
        <h6 className="mb-0">
          {post.author?.username ? (
            <Link className="text-decoration-none" to={`/profile/${encodeURIComponent(post.author.username)}`}>
              @{post.author.username}
            </Link>
          ) : (
            "User"
          )}
        </h6>
        <p>{post.content}</p>
        {post.image && (
          <img
            src={assetUrl(post.image)}
            alt="post"
            className="img-fluid rounded"
          />
        )}
        <div className="d-flex gap-2 mt-2">
          <button className="btn btn-sm btn-outline-danger" onClick={like}>Like ({post.likes?.length || 0})</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowComments((p) => !p)}>Comments ({post.comments?.length || 0})</button>
          {post.author?._id === user?._id && <button className="btn btn-sm btn-outline-dark" onClick={removePost}>Delete</button>}
        </div>
        {showComments && <CommentSection post={post} onThreadUpdated={onThreadUpdated} />}
      </div>
    </div>
  );
};

export default PostCard;
