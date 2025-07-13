import bcrypt from 'bcryptjs'
import User from '../models/users.model.js'
import { generateToken } from '../lib/utils.js'
import cloudinary from '../lib/cloudinary.js'

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Format fullName to Title Case
    const formattedFullName = fullName
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const normalizedEmail = email.toLowerCase();

    // Check for existing email
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Case-insensitive username check
    const existingUsername = await User.findOne({
      fullName: { $regex: `^${formattedFullName}$`, $options: "i" },
    });

    if (existingUsername) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName: formattedFullName,
      email: normalizedEmail,
      password: hashedPassword,
    });

    await newUser.save();
    generateToken(newUser._id, res);

    return res.status(201).json({
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      profilePic: newUser.profilePic,
    });
  } catch (error) {
    console.log("Signup error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const login = async (req, res) => {
  const { email, password } = req.body;
  console.log("Login payload:", req.body);

  if (!email || !password) {
    console.log("Missing email or password");
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log("User not found");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      console.log("Password incorrect");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    console.log("Login successful for:", user.email);
    return res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      createdAt:user.createdAt,
    });
  } catch (error) {
    console.log("Login error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};



export const logout =(req,res)=>{
    try {
        res.cookie("jwt","",{maxAge:0})
        res.status(200).json({message:"Logout successfully"})
    } catch (error) {
        console.log("error in logout controller",error.message)
        res.status(500).json({message:"Internal server error"})
    }
    
}

export const updateProfile = async (req,res)=>{
  try {
    const {profilePic} = req.body;
    const userId = req.user._id;

    if(!profilePic){
        return res.status(400).json({message:"Profile pic is required"});
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(userId,{profilePic:uploadResponse.secure_url}, {new:true});

    res.status(200).json(updatedUser)

  } catch (error) {
    console.log("error in update profile", error);
    res.status(500).json({error:"Internal Server Error"});
  }
}

export const changePassword = async (req, res) => {
  const userId = req.user._id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Both current and new passwords are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters" });
  }

  try {
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error in changePassword:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const checkAuth = (req,res)=>{
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth controller" ,error.message);
        res.status(500).json({error:"Internal Server Error"})
    }
}

