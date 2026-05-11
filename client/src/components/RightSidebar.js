import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import api from "../api/axios";
import { sendFriendRequest } from "../store/friendsSlice";
import toast from "react-hot-toast";
import assetUrl from "../utils/assetUrl";

const RightSidebar = () => {
  const [people, setPeople] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    api.get("/users/me/people-you-may-know")
      .then(({ data }) => setPeople(data))
      .catch(() => {});
  }, []);

  const addFriend = async (username) => {
    try {
      await dispatch(sendFriendRequest(username)).unwrap();
      setPeople((prev) => prev.filter((u) => u.username !== username));
      toast.success("Friend request sent!");
    } catch (e) {
      toast.error(e?.message || "Could not send request");
    }
  };

  if (people.length === 0) return <aside className="fb-right-sidebar" />;

  return (
    <aside className="fb-right-sidebar">
      <div className="fb-right-inner">
        <div className="fb-widget">
          <h6 className="fb-widget-title">People you may know</h6>
          {people.map((p) => (
            <div key={p._id} className="fb-pymk-item">
              <Link to={`/profile/${encodeURIComponent(p.username)}`} className="fb-pymk-link">
                {p.profilePicture ? (
                  <img src={assetUrl(p.profilePicture)} alt="" className="fb-pymk-avatar" />
                ) : (
                  <div className="fb-pymk-avatar fb-avatar-placeholder" aria-hidden />
                )}
                <div className="fb-pymk-info">
                  <span className="fb-pymk-name">{p.fullName || p.username}</span>
                  <span className="fb-pymk-handle">@{p.username}</span>
                  {p.mutualCount > 0 && (
                    <span className="fb-pymk-mutual">
                      {p.mutualCount} mutual friend{p.mutualCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </Link>
              <button
                type="button"
                className="btn btn-sm fb-pymk-add-btn"
                onClick={() => addFriend(p.username)}
              >
                Add friend
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
