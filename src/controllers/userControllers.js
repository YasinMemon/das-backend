import { hash } from "bcrypt";
import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Doctor from "../models/DoctorModel.js";
import Appointment from "../models/AppointmentModel.js";
import axios from "axios"
import { OAuth2Client } from "google-auth-library";

async function UserRegister(req, res) {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const hashedPassword = await hash(password, 10);

    const user = {
      fullName,
      email,
      password: hashedPassword,
    };

    const UserModel = await User.create(user);
    const token = jwt.sign({ id: UserModel._id, role: "user" }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    console.log("user registration token:", token);

    // Clear conflicting cookies
    res.clearCookie("doctorToken");
    res.clearCookie("adminToken");

    // Registration logic goes here
    res
      .status(201)
      .cookie("userToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .json({ message: "User registered successfully", user: UserModel, token });
  } catch (error) {
    console.error("Error registering user:", error);
  }
}

async function UserLogin(req, res) {
  // Login logic to be implemented
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  // Further password verification and token generation logic goes here
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  // Clear conflicting cookies
  res.clearCookie("doctorToken");
  res.clearCookie("adminToken");

  res
    .status(200)
    .cookie("userToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    })
    .json({ message: "User logged in successfully", user, role: "user", token });
}

async function GoogleLogin(req, res) {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: "ID token is required" });
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    // Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { name, email, picture } = payload;

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        fullName: name,
        email,
        password: "", // No password for Google users
        profile_image: picture,
      });
    }

    const appToken = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    
    // Clear conflicting cookies
    res.clearCookie("doctorToken");
    res.clearCookie("adminToken");
    
    res
      .status(200)
      .cookie("userToken", appToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .json({ 
        message: "User logged in with Google successfully", 
        user: { 
          _id: user._id, 
          fullName: user.fullName, 
          email: user.email, 
          profile_image: user.profile_image || picture
        }, 
        role: "user", 
        token: appToken 
      });
      
  } catch (error) {
    console.error("Error logging in with Google:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

async function GetAllVerifiedDoctors(req, res) {
  try {
    const doctors = await Doctor.find({ verified: "Verified" });
    return res
      .status(200)
      .json({ status: true, doctors, message: "Doctors fetched successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
}

async function GetVerifiedDoctorsBySpecialization(req, res) {
  try {
    const { specialization } = req.params;

    const doctors = await Doctor.find({
      specialty: { $regex: new RegExp(`^${specialization}$`, "i") },
      verified: "Verified",
    });

    return res.json({
      status: true,
      doctors,
      message: "Doctors fetched successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
}

async function GetMyAppointments(req, res) {
  try {
    const userId = req.user.id;
    const appointments = await Appointment.find({ patient: userId })
      .populate("doctor", "fullName specialty profile_image city phone experience consulation_fee")
      .sort({ appointmentDate: -1 });

    if (!appointments) {
      return res
        .status(404)
        .json({ status: false, message: "No appointments found" });
    }

    return res.status(200).json({
      status: true,
      appointments,
      message: "Appointments fetched successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
}

export {
  UserRegister,
  UserLogin,
  GoogleLogin,
  GetAllVerifiedDoctors,
  GetVerifiedDoctorsBySpecialization,
  GetMyAppointments,
};
