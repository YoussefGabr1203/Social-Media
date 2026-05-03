import api from "../api/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const UserCard = ({ user, onFollowed }) => {
  const navigate = useNavigate();
  const me = useSelector((s) => s.auth.user);

  const follow = async () => {
    try {
      await api.post(`/users/${encodeURIComponent(user.username)}/follow`);
      onFollowed?.();
      toast.success("Updated follow status");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Follow failed");
    }
  };

  return (
    <div className="card p-2 mb-2 d-flex flex-row justify-content-between align-items-center">
      <button
        type="button"
        className="btn btn-link text-start p-0 text-decoration-none"
        onClick={() => navigate(`/profile/${encodeURIComponent(user.username)}`)}
      >
        <div className="fw-bold">{user.fullName || user.username}</div>
        <div className="text-muted">@{user.username}</div>
      </button>
      {me?._id !== user._id && <button className="btn btn-sm btn-primary" onClick={follow}>Follow/Unfollow</button>}
    </div>
  );
};

export default UserCard;
