import { Camera, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useAuthStore } from "../Store/useAuthStore";
import avatar from "../assets/avatar.png";
import clsx from "clsx";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { authUser, updateProfile, isUpdatingProfile,changePassword,logout } = useAuthStore();
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate(); 

  const [passwords, setPasswords] = useState({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});
const [showPw, setShowPw] = useState({
  current: false,
  new: false,
  confirm: false,
});

const handlePasswordChange = async () => {
  const { currentPassword, newPassword, confirmPassword } = passwords;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return toast.error("All password fields are required");
  }

  if (newPassword.length < 6) {
    return toast.error("New password must be at least 6 characters");
  }

  if (newPassword !== confirmPassword) {
    return toast.error("Passwords do not match");
  }

  try {
    await changePassword({ currentPassword, newPassword }); 
    toast.success("Password changed successfully");
    setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    await logout();
    navigate("/login");
  } catch (error) {
    toast.error(error?.message || "Failed to change password");
  }
};

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImage(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  return (
    <div className="min-h-screen pt-20 bg-base-200 text-base-content">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-100 rounded-xl p-6 shadow-lg border border-base-300 space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary">Profile</h1>
            <p className="mt-2 text-base-content text-lg">
              Your profile information
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImage || authUser.profilePic || avatar}
                alt="profile-pic"
                className="size-32 rounded-full object-cover border-4 border-primary"
              />
              <label
                htmlFor="avatar-upload"
                className={clsx(
                  "absolute bottom-0 right-0 bg-primary hover:bg-primary-focus p-2 rounded-full cursor-pointer transition-all duration-200",
                  isUpdatingProfile && "animate-pulse pointer-events-none"
                )}
              >
                <Camera className="w-5 h-5 text-primary-content" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-base text-base-content text-center">
              {isUpdatingProfile
                ? "Uploading..."
                : "Click the camera icon to update your profile"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-base font-medium flex items-center gap-2 text-base-content">
                <User className="size-5" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border border-base-300 text-base-content text-lg">
                {authUser?.fullName}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-base font-medium flex items-center gap-2 text-base-content">
                <Mail className="size-5" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border border-base-300 text-base-content text-lg">
                {authUser?.email}
              </p>
            </div>
            <div className="space-y-1.5">
  <div className="text-base font-medium flex items-center gap-2 text-base-content">
    <Lock className="size-5"/>
    Change Password
  </div>

  <div className="space-y-3 mt-2">
    {/* Current Password */}
    <div className="relative">
      <input
        type={showPw.current ? "text" : "password"}
        placeholder="Current Password"
        className="input input-bordered w-full pr-10"
        value={passwords.currentPassword}
        onChange={(e) =>
          setPasswords((prev) => ({ ...prev, currentPassword: e.target.value }))
        }
      />
      <button
        type="button"
        className="absolute top-1/2 right-3 -translate-y-1/2 text-base-content"
        onClick={() => setShowPw((prev) => ({ ...prev, current: !prev.current }))}
      >
        {showPw.current ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>

    {/* New Password */}
    <div className="relative">
      <input
        type={showPw.new ? "text" : "password"}
        placeholder="New Password"
        className="input input-bordered w-full pr-10"
        value={passwords.newPassword}
        onChange={(e) =>
          setPasswords((prev) => ({ ...prev, newPassword: e.target.value }))
        }
      />
      <button
        type="button"
        className="absolute top-1/2 right-3 -translate-y-1/2 text-base-content"
        onClick={() => setShowPw((prev) => ({ ...prev, new: !prev.new }))}
      >
        {showPw.new ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>

    {/* Confirm New Password */}
    <div className="relative">
      <input
        type={showPw.confirm ? "text" : "password"}
        placeholder="Confirm New Password"
        className="input input-bordered w-full pr-10"
        value={passwords.confirmPassword}
        onChange={(e) =>
          setPasswords((prev) => ({ ...prev, confirmPassword: e.target.value }))
        }
      />
      <button
        type="button"
        className="absolute top-1/2 right-3 -translate-y-1/2 text-base-content"
        onClick={() => setShowPw((prev) => ({ ...prev, confirm: !prev.confirm }))}
      >
        {showPw.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>

    <button
      onClick={handlePasswordChange}
      className="btn btn-primary w-full mt-1"
    >
      Change Password
    </button>
  </div>
</div>

          </div>

          <div className="mt-6 bg-base-300/30 rounded-xl p-6 border border-base-300">
            <h2 className="text-lg font-semibold text-base-content mb-4">
              Account Information
            </h2>
            <div className="space-y-3 text-sm text-base-content">
              <div className="flex items-center justify-between py-2 border-b border-base-300 text-lg">
                <span>Member Since</span>
                <span className="font-medium">
                  {authUser?.createdAt
                    ? new Date(authUser.createdAt).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 text-lg">
                <span>Account Status</span>
                <span className="text-success font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
