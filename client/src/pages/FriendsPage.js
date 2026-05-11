import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import api from "../api/axios";
import assetUrl from "../utils/assetUrl";
import Loader from "../components/Loader";
import { fetchIncoming, acceptFriendRequest, declineFriendRequest } from "../store/friendsSlice";
import { refreshCurrentUser } from "../store/authSlice";
import { fetchFeed } from "../store/postsSlice";

const UserCard = ({ user }) => {
  if (!user) return null;
  const path = `/profile/${encodeURIComponent(user.username)}`;
  return (
    <li className="border rounded p-3 mb-2 d-flex align-items-center gap-3">
      <Link to={path} className="d-flex align-items-center gap-3 text-decoration-none text-body flex-grow-1">
        {user.profilePicture ? (
          <img src={assetUrl(user.profilePicture)} alt="" className="rounded-circle" width={44} height={44} />
        ) : (
          <div className="bg-secondary rounded-circle flex-shrink-0" style={{ width: 44, height: 44 }} aria-hidden />
        )}
        <div>
          <div className="fw-semibold">{user.fullName || user.username}</div>
          <div className="small text-muted">@{user.username}</div>
        </div>
      </Link>
    </li>
  );
};

const FriendsPage = () => {
  const dispatch = useDispatch();
  const { incoming, incomingLoading } = useSelector((s) => s.friends);
  const [tab, setTab] = useState("requests");
  const [connections, setConnections] = useState(null);
  const [connLoading, setConnLoading] = useState(false);

  useEffect(() => { dispatch(fetchIncoming()); }, [dispatch]);

  useEffect(() => {
    if (tab === "requests") return;
    setConnLoading(true);
    api.get("/users/me/connections")
      .then(({ data }) => setConnections(data))
      .catch(() => toast.error("Failed to load connections"))
      .finally(() => setConnLoading(false));
  }, [tab]);

  const onAccept = async (row) => {
    const uname = row.from?.username;
    try {
      await dispatch(acceptFriendRequest({ requestId: row._id, slug: uname })).unwrap();
      dispatch(refreshCurrentUser());
      dispatch(fetchFeed({ page: 1 }));
      toast.success("You are now friends");
    } catch (e) {
      toast.error(e?.message || "Could not accept request");
    }
  };

  const onDecline = async (row) => {
    const uname = row.from?.username;
    try {
      await dispatch(declineFriendRequest({ requestId: row._id, slug: uname })).unwrap();
      toast.success("Request declined");
    } catch (e) {
      toast.error(e?.message || "Could not decline");
    }
  };

  const tabs = [
    { id: "requests", label: "Requests" },
    { id: "friends", label: "Friends" },
    { id: "following", label: "Following" },
    { id: "followers", label: "Followers" },
  ];

  const listForTab = connections ? connections[tab] ?? [] : [];

  return (
    <div className="card p-3">
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`search-tab${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "requests" && (
        <>
          <p className="text-muted small mb-3">
            When someone adds you, their request appears here. Accept to become friends and see each other&apos;s posts in your home feeds.
          </p>
          {incomingLoading && <Loader />}
          {!incomingLoading && incoming.length === 0 && <p className="text-muted mb-0">No pending requests.</p>}
          <ul className="list-unstyled mb-0">
            {incoming.map((row) => {
              const u = row.from;
              if (!u) return null;
              const path = `/profile/${encodeURIComponent(u.username)}`;
              return (
                <li key={row._id} className="border rounded p-3 mb-3 d-flex flex-wrap align-items-center gap-3 justify-content-between">
                  <Link to={path} className="d-flex align-items-center gap-3 text-decoration-none text-body">
                    {u.profilePicture ? (
                      <img src={assetUrl(u.profilePicture)} alt="" className="rounded-circle" width={48} height={48} />
                    ) : (
                      <div className="bg-secondary rounded-circle" style={{ width: 48, height: 48 }} aria-hidden />
                    )}
                    <div>
                      <div className="fw-semibold">{u.fullName || u.username}</div>
                      <div className="small text-muted">@{u.username}</div>
                    </div>
                  </Link>
                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-sm btn-primary" onClick={() => onAccept(row)}>Accept</button>
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onDecline(row)}>Decline</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {tab !== "requests" && (
        <>
          {connLoading && <Loader />}
          {!connLoading && connections && listForTab.length === 0 && (
            <p className="text-muted mb-0">No {tab} yet.</p>
          )}
          <ul className="list-unstyled mb-0">
            {listForTab.map((u) => (
              <UserCard key={u._id} user={u} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default FriendsPage;
