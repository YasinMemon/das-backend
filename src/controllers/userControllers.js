import { hash } from "bcrypt";
import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Doctor from "../models/DoctorModel.js";

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
    const token = jwt.sign({ id: UserModel._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    console.log("user registration token:", token);

    // Registration logic goes here
    res
      .status(201)
      .json({ message: "User registered successfully", user: UserModel })
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });
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

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res
    .status(200)
    .cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    })
    .json({ message: "User logged in successfully", user, role: "user" });
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

export { UserRegister, UserLogin, GetAllVerifiedDoctors };
