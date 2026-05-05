import { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import UserCard from "../components/UserCard";
import PostCard from "../components/PostCard";

const SearchPage = () => {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!q.trim()) return;
    try {
      const [u, p] = await Promise.all([
        api.get(`/users/search?q=${encodeURIComponent(q)}`),
        api.get(`/posts/search?q=${encodeURIComponent(q)}`),
      ]);
      setUsers(u.data);
      setPosts(p.data);
      setSearched(true);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Search failed");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") search();
  };

  const results = tab === "users" ? users : posts;

  return (
    <div className="search-wrapper">
      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Search users or posts…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="search-btn" onClick={search}>
          Search
        </button>
      </div>

      <div className="search-tabs">
        <button
          className={`search-tab ${tab === "users" ? "active" : ""}`}
          onClick={() => setTab("users")}
        >
          Users{users.length > 0 && ` (${users.length})`}
        </button>
        <button
          className={`search-tab ${tab === "posts" ? "active" : ""}`}
          onClick={() => setTab("posts")}
        >
          Posts{posts.length > 0 && ` (${posts.length})`}
        </button>
      </div>

      <div className="search-results">
        {searched && results.length === 0 && (
          <p style={{ opacity: 0.5, textAlign: "center", marginTop: "2rem" }}>
            No {tab} found for &ldquo;{q}&rdquo;
          </p>
        )}
        {tab === "users"
          ? users.map((u) => <UserCard key={u._id} user={u} />)
          : posts.map((p) => <PostCard key={p._id} post={p} />)}
      </div>
    </div>
  );
};

export default SearchPage;
