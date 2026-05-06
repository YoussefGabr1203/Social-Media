import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotifications, removeNotification, clearNotifications } from "../store/notifSlice";
import api from "../api/axios";
import toast from "react-hot-toast";

const typeLabel = (type) => {
  if (type === "friend_request") return "sent you a friend request";
  if (type === "follow") return "started following you";
  if (type === "like") return "liked your post";
  if (type === "comment") return "commented on your post";
  if (type === "message") return "messaged you";
  if (type === "mention") return "mentioned you in a post";
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
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h4 className="mb-0">Notifications</h4>
        {list.length > 0 && (
          <button className="btn btn-sm btn-outline-danger" onClick={clearAll}>Clear all</button>
        )}
      </div>
      {list.length === 0 && <p className="text-muted mb-0">No notifications.</p>}
      {list.map((n) => (
        <button
          key={n._id}
          className={`border rounded p-2 mb-2 w-100 text-start btn ${n.read ? "btn-outline-light" : "btn-light"}`}
          onClick={() => deleteOne(n._id)}
          title="Click to dismiss"
        >
          <span className="fw-semibold">{n.sender?.username}</span>
          {" "}
          {typeLabel(n.type)}
        </button>
      ))}
    </div>
  );
};

export default NotificationsPage;
