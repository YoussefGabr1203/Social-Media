import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { updateMyProfile } from "../store/profileSlice";

const EditProfilePage = () => {
  const user = useSelector((s) => s.auth.user);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatar, setAvatar] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    setFullName(user?.fullName || "");
    setBio(user?.bio || "");
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("bio", bio);
    if (avatar) formData.append("avatar", avatar);
    try {
      await dispatch(updateMyProfile({ id: user._id, formData })).unwrap();
      toast.success("Profile updated");
      navigate(`/profile/${encodeURIComponent(user.username)}`);
    } catch (error) {
      toast.error(error?.message || "Update failed");
    }
  };

  return (
    <form className="card p-3" onSubmit={submit}>
      <h3>Edit Profile</h3>
      <input className="form-control mb-2" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
      <textarea className="form-control mb-2" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" />
      <input className="form-control mb-2" type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files[0])} />
      <button className="btn btn-primary">Save</button>
    </form>
  );
};

export default EditProfilePage;
