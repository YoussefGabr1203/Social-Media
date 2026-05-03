import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import Loader from "../components/Loader";
import { fetchIncoming, acceptFriendRequest, declineFriendRequest } from "../store/friendsSlice";
import { refreshCurrentUser } from "../store/authSlice";
import { fetchFeed } from "../store/postsSlice";

const FriendsPage = () => {
  const dispatch = useDispatch();
  const { incoming, incomingLoading } = useSelector((s) => s.friends);
  const assetBase = process.env.REACT_APP_ASSET_URL ?? "";

  useEffect(() => {
    dispatch(fetchIncoming());
  }, [dispatch]);

  const onAccept = async (row) => {
    const fromUser = row.from;
    const uname = fromUser?.username;
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
    const fromUser = row.from;
    const uname = fromUser?.username;
    try {
      await dispatch(declineFriendRequest({ requestId: row._id, slug: uname })).unwrap();
      toast.success("Request declined");
    } catch (e) {
      toast.error(e?.message || "Could not decline");
    }
  };

  return (
    <div className="card p-3">
      <h1 className="h4 mb-3">Friend requests</h1>
      <p className="text-muted small mb-4">
        When someone adds you, their request appears here. Accept to become friends and see each other&apos;s posts in your home feeds.
      </p>
      {incomingLoading && <Loader />}
      {!incomingLoading && incoming.length === 0 && (
        <p className="text-muted mb-0">No pending requests.</p>
      )}
      <ul className="list-unstyled mb-0">
        {incoming.map((row) => {
          const u = row.from;
          if (!u) return null;
          const path = `/profile/${encodeURIComponent(u.username)}`;
          return (
            <li key={row._id} className="border rounded p-3 mb-3 d-flex flex-wrap align-items-center gap-3 justify-content-between">
              <Link to={path} className="d-flex align-items-center gap-3 text-decoration-none text-body">
                {u.profilePicture ? (
                  <img src={`${assetBase}${u.profilePicture}`} alt="" className="rounded-circle" width={48} height={48} />
                ) : (
                  <div className="bg-secondary rounded-circle" style={{ width: 48, height: 48 }} aria-hidden />
                )}
                <div>
                  <div className="fw-semibold">{u.fullName || u.username}</div>
                  <div className="small text-muted">@{u.username}</div>
                </div>
              </Link>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-sm btn-primary" onClick={() => onAccept(row)}>
                  Accept
                </button>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onDecline(row)}>
                  Decline
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default FriendsPage;
