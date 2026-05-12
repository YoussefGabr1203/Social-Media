import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotifications, removeNotification, clearNotifications } from "../store/notifSlice";
import api from "../api/axios";
import toast from "react-hot-toast";
import assetUrl from "../utils/assetUrl";

const typeLabel = (type) => {
  if (type === "friend_request") return "sent you a friend request";
  if (type === "follow") return "started following you";
  if (type === "like") return "liked your post";
  if (type === "comment") return "commented on your post";
  if (type === "message") return "messaged you";
  if (type === "mention") return "mentioned you in a post";
  if (type === "share") return "shared your post";
  return type;
};

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const list = useSelector((s) => s.notif.notifications);

  useEffect(() => { dispatch(fetchNotifications()); }, [dispatch]);

  const deleteOne = async (id) => {
    dispatch(removeNotification(id));
    try {
      await api.delete(`/notifications/${id}`);
    } catch {
      dispatch(fetchNotifications());
      toast.error("Failed to delete notification");
    }
  };

  const clearAll = async () => {
    dispatch(clearNotifications());
    try {
      await api.delete("/notifications");
    } catch {
      dispatch(fetchNotifications());
      toast.error("Failed to clear notifications");
    }
  };

  return (
    <div className="card p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Notifications</h4>
        {list.length > 0 && (
          <button className="btn btn-sm btn-outline-danger" onClick={clearAll}>Clear all</button>
        )}
      </div>
      {list.length === 0 && <p className="text-muted mb-0">No notifications.</p>}
      {list.map((n) => (
        <div
          key={n._id}
          className={`d-flex align-items-center gap-2 border rounded p-2 mb-2 ${n.read ? "" : "border-primary"}`}
        >
          {/* Sender avatar — clickable to profile */}
          {n.sender?.username && (
            <Link to={`/profile/${encodeURIComponent(n.sender.username)}`} className="flex-shrink-0">
              {n.sender?.profilePicture ? (
                <img
                  src={assetUrl(n.sender.profilePicture)}
                  alt={n.sender.username}
                  className="rounded-circle"
                  width={36}
                  height={36}
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div
                  className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white"
                  style={{ width: 36, height: 36, fontSize: 14 }}
                >
                  {n.sender.username[0]?.toUpperCase()}
                </div>
              )}
            </Link>
          )}

          <div className="flex-grow-1 small">
            <Link
              to={`/profile/${encodeURIComponent(n.sender?.username)}`}
              className="fw-semibold text-decoration-none"
            >
              {n.sender?.username}
            </Link>
            {" "}{typeLabel(n.type)}
          </div>

          <button
            className="btn btn-sm btn-outline-secondary ms-auto"
            onClick={() => deleteOne(n._id)}
            title="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationsPage;
