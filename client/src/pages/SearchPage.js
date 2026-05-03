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

  const search = async () => {
    try {
      const [u, p] = await Promise.all([
        api.get(`/users/search?q=${encodeURIComponent(q)}`),
        api.get(`/posts/search?q=${encodeURIComponent(q)}`),
      ]);
      setUsers(u.data);
      setPosts(p.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Search failed");
    }
  };

  return (
    <div>
      <div className="input-group mb-3"><input className="form-control" value={q} onChange={(e) => setQ(e.target.value)} /><button className="btn btn-primary" onClick={search}>Search</button></div>
      <div className="btn-group mb-3"><button className="btn btn-outline-primary" onClick={() => setTab("users")}>Users</button><button className="btn btn-outline-primary" onClick={() => setTab("posts")}>Posts</button></div>
      {tab === "users" ? users.map((u) => <UserCard key={u._id} user={u} />) : posts.map((p) => <PostCard key={p._id} post={p} />)}
    </div>
  );
};

export default SearchPage;
