import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from './Components/Navbar'
import Homepage from './Pages/Homepage'
import LoginSignup from './Pages/LoginSignup'
import Settings from './Pages/Settings'
import Profile from './Pages/Profile'
import { useAuthStore } from "./Store/useAuthStore";
import { useEffect } from "react";
import {Loader} from 'lucide-react'
import {Toaster} from 'react-hot-toast'
import { useThemeStore } from "./Store/useThemeStore";



const App = () => {
 
  const {authUser,checkAuth,isCheckingAuth,onlineUsers,}= useAuthStore()
  const {theme} = useThemeStore()
  

  console.log({onlineUsers})

  useEffect(()=>{
    checkAuth()
  },[checkAuth])

  
  useEffect(() => {
    if (theme) {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  

  console.log({authUser})
  if(isCheckingAuth && !authUser) return(
    <div className="flex items-center justify-center h-screen">
      <Loader className="size-10 animate-spin"/>
    </div>
  )
    
  
  return (
    
    <div>
      <Navbar/>
      <Routes>
        <Route path="/" element={authUser ? <Homepage/> : <Navigate to= '/login'/>}/>
        <Route path="/login" element={!authUser ? <LoginSignup/> : <Navigate to= '/'/>}/>
        <Route path="/settings" element={<Settings/>}/>
        <Route path="/profile" element={authUser ? <Profile/> : <Navigate to = '/login'/>}/>
      </Routes>
      
      
      <Toaster/>
    </div>
  );
};

export default App;
