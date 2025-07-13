import {create }from 'zustand'
import { api } from '../lib/Axios.js';
import toast from "react-hot-toast";
import {io} from "socket.io-client"




const BASE_URL= import.meta.env.MODE === "development"?"http://localhost:5000" :"/"

export const useAuthStore = create((set,get)=>({
  
    authUser:null,
    isSigningUp:false,
    isLoginingIn:false,
    isUpdatingProfile:false,
    isCheckingAuth:true,
    onlineUsers:[],
    users:[],
    socket:null,

    checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const [authRes, usersRes] = await Promise.all([
        api.get("/auth/check"),
        api.get("/message/users"),
      ]);
      set({ authUser: authRes.data, users: usersRes.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in CheckAuth", error);
      localStorage.removeItem("token");
      set({ authUser: null, users: [] });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signUp: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await api.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
      const usersRes = await api.get("/message/users"); // Update users after signup
      set({ users: usersRes.data });
      return res.data;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Signup failed");
      throw error;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoginingIn: true });
    try {
      const res = await api.post("/auth/login", data);
      const token = res.headers["authorization"]?.split(" ")[1] || res.data.token; // Adjust based on API response
      if (token) localStorage.setItem("token", token);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
      const usersRes = await api.get("/message/users"); 
      set({ users: usersRes.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      set({ isLoginingIn: false });
    }
  },
     
   logout:async()=>{
    try {
      await  api.post("/auth/logout")
      set({authUser:null})
      toast.success("Logged out successfully")
      get().disconnectSocket()
    } catch (error) {
        toast.error(error.response.data.message)
    }
   },
   updateProfile:async(data)=>{
     set({isUpdatingProfile:true});
     try {
        const res = await api.put("/auth/update-profile",data)
        set({authUser:res.data})
        toast.success("Profile updated successfully")
        
     } catch (error) {
        console.log("error in updating profile",error)
        toast.error(error.response.data.message)
     }finally{
        set({isUpdatingProfile:false});
     }
   },

   changePassword: async ({ currentPassword, newPassword }) => {
    try {
      const res = await api.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      toast.success("Password changed successfully");
      return res.data;
    } catch (error) {
      console.error("Password change error:", error);
      toast.error(error?.response?.data?.message || "Failed to change password");
      throw error;
    }
  },
connectSocket:()=>{
   const { authUser } = get();
    if (!authUser || get().socket?.connected) return
   const socket = io(BASE_URL,{
    query:{
      userId: authUser._id,
      fullName: authUser.fullName,
    }
   })
   socket.connect()

   set({socket:socket})

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
},
disconnectSocket:()=>{
  if (get().socket?.connected) get().socket.disconnect();
},



}))