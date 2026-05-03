import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotifications } from "../store/notifSlice";
import api from "../api/axios";
import toast from "react-hot-toast";

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const list = useSelector((s) => s.notif.notifications);

  useEffect(() => { dispatch(fetchNotifications()); }, [dispatch]);

  const readAll = async () => {
    try {
      await api.put("/notifications/read-all");
      dispatch(fetchNotifications());
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to mark notifications");
    }
  };

  const markOneRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      dispatch(fetchNotifications());
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update notification");
    }
  };

  return (
    <div className="card p-3">
      <div className="d-flex justify-content-between mb-2"><h4>Notifications</h4><button className="btn btn-sm btn-outline-primary" onClick={readAll}>Mark all read</button></div>
      {list.map((n) => (
        <button
          key={n._id}
          className={`border rounded p-2 mb-2 w-100 text-start btn ${n.read ? "btn-outline-light" : "btn-light"}`}
          onClick={() => markOneRead(n._id)}
        >
          <span className="fw-semibold">{n.sender?.username}</span>
          {" "}
          {n.type === "friend_request" && "sent you a friend request"}
          {n.type === "follow" && "started following you"}
          {n.type === "like" && "liked your post"}
          {n.type === "comment" && "commented on your post"}
          {n.type === "message" && "messaged you"}
          {n.type !== "friend_request" && n.type !== "follow" && n.type !== "like" && n.type !== "comment" && n.type !== "message" && n.type}
        </button>
      ))}
    </div>
  );
};

export default NotificationsPage;
