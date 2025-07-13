import { useChatStore } from "../Store/useChatStore";
import { useEffect, useState } from "react";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { PhoneCall, Users, } from "lucide-react";
import avatar from "../assets/avatar.png";
import { useAuthStore } from "../Store/useAuthStore";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, initiateCall,isUserLoading } = useChatStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

    if (isUserLoading) return <SidebarSkeleton/>

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200 shadow-[8px_0_20px_rgba(0,0,0,0.15)] dark:shadow-[8px_0_20px_rgba(255,255,255,0.2)]">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">
            ({onlineUsers.length - 1} online)
          </span>
        </div>
      </div>
      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => (
          <div
            key={user._id}
            className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${
              selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""
            }`}
          >
            <button
              onClick={() => setSelectedUser(user)}
              className="flex items-center gap-3 flex-1"
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.profilePic || avatar}
                  alt={user.fullName}
                  className="size-12 object-cover rounded-full"
                />
                <span
                  className={`absolute bottom-0 right-0 size-3 rounded-full ring-2 ring-zinc-900 ${
                    onlineUsers.includes(user._id) ? "bg-green-500" : "bg-red-500"
                  }`}
                />
              </div>
              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">{user.fullName}</div>
                <div className="text-sm text-zinc-400">
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
              </div>
            </button>
            {onlineUsers.includes(user._id) && (
              <button
                onClick={() => initiateCall(user._id, "video")}
                className="btn btn-sm btn-circle btn-primary"
                title={`Call ${user.fullName}`}
              >
                <PhoneCall className="size-4" />
              </button>
            )}
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No online users</div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;