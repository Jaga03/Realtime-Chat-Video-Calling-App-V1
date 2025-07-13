import { useState } from "react";
import clsx from "clsx";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
  MessageCircle,
  User,
  UserPlus,
} from "lucide-react";
import Typewriter from "typewriter-effect";
import { useAuthStore } from "../Store/useAuthStore";
import toast from "react-hot-toast";

const LoginSignup = () => {
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const { signUp, isSigningUp } = useAuthStore();
  const { login, isLoginingIn } = useAuthStore();

  const toggleMode = () =>
    setMode((prev) => (prev === "login" ? "signup" : "login"));

  const validateForm = () => {
    if (mode === "signup" && !formData.fullName.trim())
      return toast.error("Full name is required");

    if (!formData.email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(formData.email))
      return toast.error("Invalid email format");
    if (!formData.password) return toast.error("Password is required");

    if (mode === "signup" && formData.password.length < 6)
      return toast.error("Password must be at least 6 characters");

    return true;
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = validateForm();
    if (!isValid) return;

    try {
      if (mode === "login") {
        await login({
          email: formData.email,
          password: formData.password,
        });
        setFormData({ email: "", password: "" });
      } else {
        await signUp({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
        });
        setFormData({ fullName: "", email: "", password: "" });
        setMode("login");
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-base-100 z-0"></div>

      <div className="relative w-full max-w-5xl h-[600px] bg-base-100/90 backdrop-blur-lg rounded-3xl overflow-hidden border border-base-300 z-10">
        {/* Logo + Tagline */}
        <div className="absolute top-6 left-6 z-20">
          <h1 className="text-2xl font-bold text-base-content">
            Chatz<span className="text-base-content">Up</span>
          </h1>
          <div className="text-base-content text-lg mt-1">
            <Typewriter
              options={{
                strings: [
                  "Connect with friends",
                  "Share moments",
                  "Stay in touch with your loved ones",
                  "Secure. Fast. Simple.",
                ],
                autoStart: true,
                loop: true,
              }}
            />
          </div>
        </div>

        {/* Chat Icon */}
        <MessageCircle
          className="absolute top-5 right-5 text-accent animate-bounce z-20"
          size={32}
        />

        {/* Sliding Form Panel */}
        <div
          className={clsx(
            "absolute top-0 w-1/2 h-full bg-base-100 p-10 transition-all duration-700 ease-in-out z-20",
            mode === "login" ? "left-0" : "translate-x-full left-0"
          )}
        >
          <form
            onSubmit={handleSubmit}
            className="space-y-6 h-full flex flex-col justify-center"
          >
            <h2 className="text-4xl font-bold text-center text-base-content mb-4">
              {mode === "login" ? (
                <>
                  Login to Chatz<span className="text-accent">Up</span>
                </>
              ) : (
                <>
                  Create Your Chatz<span className="text-accent">Up</span> Account
                </>
              )}
            </h2>

            {/* Full Name */}
            {mode === "signup" && (
              <div className="relative h-12">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content" size={20} />
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  className="w-full h-full pl-10 pr-4 rounded-md text-base-content border border-base-content focus:outline-none focus:ring-accent text-lg placeholder:text-base-content/70"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            {/* Email */}
            <div className="relative h-12">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content" size={20} />
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="w-full h-full pl-10 pr-4 rounded-md border text-base-content border-base-content focus:outline-none focus:ring-accent text-lg placeholder:text-base-content/70"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password */}
            <div className="relative h-12">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                className="w-full h-full pl-10 pr-10 rounded-md text-base-content border border-base-content focus:outline-none focus:ring-accent text-lg placeholder:text-base-content/70"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={mode === "login" ? isLoginingIn : isSigningUp}
              className="btn btn-accent h-12 text-xl transition flex items-center justify-center"
            >
              {(mode === "login" && isLoginingIn) || (mode === "signup" && isSigningUp) ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary-content" />
              ) : mode === "login" ? (
                "Log In"
              ) : (
                "Sign Up"
              )}
            </button>
          </form>
        </div>

        {/* Info Panel */}
        <div
          className={clsx(
            "absolute top-0 right-0 w-1/2 h-full bg-accent text-accent-content flex flex-col justify-center items-center text-center p-10 transition-transform duration-700 ease-in-out z-10",
            mode === "signup" && "-translate-x-full"
          )}
        >
          <h3 className="text-3xl font-semibold mb-4">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}
          </h3>
          <p className="mb-6 text-lg">
            {mode === "login"
              ? "Sign up to start chatting!"
              : "Log in to continue your conversations."}
          </p>
          <button
            onClick={toggleMode}
            className="btn btn-outline text-lg text-accent-content border-accent-content rounded-full hover:animate-pulse"
          >
            {mode === "login" ? (
              <>
                <UserPlus className="mr-2" size={18} />
                Sign Up
              </>
            ) : (
              <>
                <LogIn className="mr-2" size={18} />
                Log In
              </>
            )}
          </button>
        </div>

        {/* Sliding panel background */}
        <div
          className={clsx(
            "absolute top-0 w-1/2 h-full bg-base-200 z-0 shadow-lg transition-transform duration-700 ease-in-out",
            mode === "signup" ? "translate-x-full left-1/2" : "translate-x-0 left-0"
          )}
        ></div>
      </div>
    </div>
  );
};

export default LoginSignup;
