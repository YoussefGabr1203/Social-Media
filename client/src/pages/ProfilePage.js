import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfile, fetchUserPosts } from "../store/profileSlice";
import {
  fetchFriendStatus,
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  unfriendUser,
} from "../store/friendsSlice";
import { refreshCurrentUser } from "../store/authSlice";
import { fetchFeed } from "../store/postsSlice";
import PostCard from "../components/PostCard";
import api from "../api/axios";
import toast from "react-hot-toast";
import Loader from "../components/Loader";

const ProfilePage = () => {
  const { username } = useParams();
  const slug = decodeURIComponent(username || "");
  const dispatch = useDispatch();
  const profile = useSelector((s) => s.profile.viewedProfile);
  const currentUser = useSelector((s) => s.auth.user);
  const posts = useSelector((s) => s.profile.userPosts);
  const loadingPosts = useSelector((s) => s.profile.userPostsLoading);
  const friendRow = useSelector((s) => s.friends.statusBySlug[slug]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [friendStatusLoading, setFriendStatusLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchProfile(slug));
  }, [dispatch, slug]);

  useEffect(() => {
    // Guard: only fetch posts once the loaded profile matches the slug we're viewing.
    // Without this check, stale Redux profile data from a previous visit triggers
    // fetchUserPosts for the wrong user before the new fetchProfile resolves.
    if (profile?._id && profile.username?.toLowerCase() === slug.toLowerCase()) {
      dispatch(fetchUserPosts(profile._id));
    }
  }, [dispatch, profile?._id, profile?.username, slug]);

  useEffect(() => {
    if (!profile || !currentUser) return;
    const followerIds = (profile.followers || []).map((fid) => fid.toString());
    setIsFollowing(followerIds.includes(currentUser._id.toString()));
  }, [profile, currentUser]);

  useEffect(() => {
    if (!slug || !currentUser || !profile) return;
    const isOwn = currentUser._id.toString() === profile._id.toString();
    if (isOwn) return;
    setFriendStatusLoading(true);
    let cancelled = false;
    dispatch(fetchFriendStatus(slug))
      .unwrap()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setFriendStatusLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, slug, currentUser, profile]);

  const isOwnProfile = useMemo(
    () => Boolean(currentUser && profile && currentUser._id.toString() === profile._id.toString()),
    [currentUser, profile]
  );

  const afterFriendChange = async () => {
    dispatch(refreshCurrentUser());
    dispatch(fetchProfile(slug));
    dispatch(fetchFeed({ page: 1 }));
  };

  const toggleFollow = async () => {
    if (!profile) return;
    try {
      const pathSlug = encodeURIComponent(profile.username);
      const { data } = await api.post(`/users/${pathSlug}/follow`);
      setIsFollowing(data.following);
      dispatch(fetchProfile(slug));
      toast.success(data.following ? "Now following" : "Unfollowed");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Follow action failed");
    }
  };

  const onAddFriend = async () => {
    if (!profile) return;
    try {
      await dispatch(sendFriendRequest(profile.username)).unwrap();
      toast.success("Friend request sent");
    } catch (e) {
      toast.error(typeof e === "string" ? e : e?.message || "Could not send request");
    }
  };

  const onCancelRequest = async () => {
    if (!profile) return;
    try {
      await dispatch(cancelFriendRequest(profile.username)).unwrap();
      toast.success("Request cancelled");
    } catch (e) {
      toast.error(typeof e === "string" ? e : e?.message || "Could not cancel");
    }
  };

  const onAcceptIncoming = async () => {
    if (!profile || !friendRow?.requestId) return;
    try {
      await dispatch(acceptFriendRequest({ requestId: friendRow.requestId, slug: profile.username })).unwrap();
      await afterFriendChange();
      toast.success("You are now friends");
    } catch (e) {
      toast.error(typeof e === "string" ? e : e?.message || "Could not accept");
    }
  };

  const onDeclineIncoming = async () => {
    if (!profile || !friendRow?.requestId) return;
    try {
      await dispatch(declineFriendRequest({ requestId: friendRow.requestId, slug: profile.username })).unwrap();
      toast.success("Request declined");
    } catch (e) {
      toast.error(typeof e === "string" ? e : e?.message || "Could not decline");
    }
  };

  const onUnfriend = async () => {
    if (!profile) return;
    try {
      await dispatch(unfriendUser(profile.username)).unwrap();
      await afterFriendChange();
      toast.success("Removed from friends");
    } catch (e) {
      toast.error(typeof e === "string" ? e : e?.message || "Could not unfriend");
    }
  };

  if (!profile) return <Loader />;
  const assetBase = process.env.REACT_APP_ASSET_URL ?? "";
  const fStatus = friendRow?.status;
  const friendsCount = profile.friendsCount ?? 0;

  return (
    <div>
      <div className="card p-3 mb-3">
        <div className="d-flex gap-3 align-items-center flex-wrap">
          {profile.profilePicture ? (
            <img src={`${assetBase}${profile.profilePicture}`} alt="" className="rounded-circle" width={72} height={72} />
          ) : (
            <div className="bg-secondary rounded-circle" style={{ width: 72, height: 72 }} />
          )}
          <div>
            <h3 className="mb-0">{profile.fullName || profile.username}</h3>
            <p className="mb-1">@{profile.username}</p>
            <p className="mb-1 small text-muted">{friendsCount} {friendsCount === 1 ? "friend" : "friends"}</p>
            <p className="mb-0">{profile.bio}</p>
          </div>
        </div>
        {isOwnProfile && (
          <Link to="/profile/edit" className="btn btn-sm btn-outline-secondary mt-3">Edit profile</Link>
        )}
        {!isOwnProfile && (
          <div className="d-flex flex-wrap gap-2 mt-3 align-items-center">
            <button className="btn btn-sm btn-outline-primary" type="button" onClick={toggleFollow}>
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
            {friendStatusLoading && <span className="small text-muted">Friend status…</span>}
            {!friendStatusLoading && fStatus === "none" && (
              <button className="btn btn-sm btn-primary" type="button" onClick={onAddFriend}>
                Add friend
              </button>
            )}
            {!friendStatusLoading && fStatus === "pending_out" && (
              <>
                <span className="small text-muted">Request sent</span>
                <button className="btn btn-sm btn-outline-secondary" type="button" onClick={onCancelRequest}>
                  Cancel request
                </button>
              </>
            )}
            {!friendStatusLoading && fStatus === "pending_in" && (
              <>
                <button className="btn btn-sm btn-primary" type="button" onClick={onAcceptIncoming}>
                  Accept request
                </button>
                <button className="btn btn-sm btn-outline-secondary" type="button" onClick={onDeclineIncoming}>
                  Decline
                </button>
              </>
            )}
            {!friendStatusLoading && fStatus === "friends" && (
              <button className="btn btn-sm btn-outline-danger" type="button" onClick={onUnfriend}>
                Unfriend
              </button>
            )}
          </div>
        )}
      </div>
      <section className="mt-4" aria-labelledby="profile-posts-heading">
        <div className="d-flex flex-wrap align-items-baseline justify-content-between gap-2 mb-3">
          <h2 id="profile-posts-heading" className="h5 mb-0">
            Posts from @{profile.username}
          </h2>
          {!loadingPosts && (
            <span className="text-muted small">{posts.length} {posts.length === 1 ? "post" : "posts"}</span>
          )}
        </div>
        <p className="text-muted small mb-3">
          Everything this person has shared shows here (same as their uploads on the home feed, but only their posts).
        </p>
        {loadingPosts && <Loader />}
        {!loadingPosts && posts.length === 0 && (
          <div className="card p-4 text-center text-muted">
            <p className="mb-0">No posts yet — check back later or follow them so their new posts appear in your feed.</p>
          </div>
        )}
        <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
          {posts.map((p) => (
            <div key={p._id} className="col">
              <PostCard post={p} onThreadUpdated={() => profile._id && dispatch(fetchUserPosts(profile._id))} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
