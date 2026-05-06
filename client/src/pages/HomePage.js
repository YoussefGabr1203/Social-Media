import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFeed, createPost } from "../store/postsSlice";
import PostCard from "../components/PostCard";
import Loader from "../components/Loader";
import toast from "react-hot-toast";
import useMentionInput from "../hooks/useMentionInput";

const HomePage = () => {
  const dispatch = useDispatch();
  const { feed, loading, page } = useSelector((s) => s.posts);
  const currentUser = useSelector((s) => s.auth.user);
  const friendFeed = (currentUser?.friends?.length || 0) > 0;
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);

  const handleContentChange = useCallback((val) => setContent(val), []);
  const { handleChange, suggestions, pickSuggestion, closeSuggestions, showDropdown } = useMentionInput(content, handleContentChange);

  useEffect(() => { dispatch(fetchFeed({ page: 1 })); }, [dispatch]);

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("content", content);
    if (image) fd.append("image", image);
    try {
      await dispatch(createPost(fd)).unwrap();
      setContent("");
      setImage(null);
      toast.success("Post created");
    } catch (error) {
      toast.error(error?.message || "Failed to create post");
    }
  };

  return (
    <div>
      <p className="text-muted small mb-3">
        {friendFeed
          ? "Your feed shows posts from you and your friends. Add people from their profile, then accept requests under Friend requests in the menu."
          : "Your feed shows posts from people you follow (and you). Once you have friends, posts from friends are shown here instead."}
      </p>
      <form onSubmit={submit} className="card p-3 mb-3">
        <div className="position-relative mb-2">
          <textarea
            className="form-control"
            placeholder="Share something… use @username to mention"
            value={content}
            onChange={handleChange}
            onBlur={closeSuggestions}
            required
          />
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
        <input className="form-control mb-2" type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
        <button className="btn btn-primary">Post</button>
      </form>
      {loading && <Loader />}
      {feed.map((p) => <PostCard key={p._id} post={p} />)}
      <button className="btn btn-outline-primary w-100" onClick={() => dispatch(fetchFeed({ page: page + 1 }))}>Load more</button>
    </div>
  );
};

export default HomePage;
