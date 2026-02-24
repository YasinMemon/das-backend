import jwt from "jsonwebtoken";
import Doctor from "../models/DoctorModel.js";

const verifyToken = (req, res, next) => {
  // Check tokens in order of priority: admin > doctor > user
  // This ensures the most specific role is used first
  const token =
    req.cookies.adminToken ||
    req.cookies.doctorToken ||
    req.cookies.userToken ||
    req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(400).json({ message: "Invalid token." });
  }
};

export default verifyToken;

const verifyAdmin = (req, res, next) => {
  console.log("\n=== verifyAdmin middleware ===");
  console.log("req.user:", req.user);
  console.log("req.user.role:", req.user?.role);
  
  if (!req.user || req.user.role !== "admin") {
    console.log("Access denied - role check failed");
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};

const verifyDoctor = (req, res, next) => {
  if (req.user.role !== "doctor") {
    return res.status(403).json({ message: "Access denied. Doctors only." });
  }
  next();
};

const ApprovedDoctor = async (req, res, next) => {
  const doctor = await Doctor.findById(req.user.id);
  if (!doctor || !doctor.isApproved) {
    return res
      .status(403)
      .json({ message: "Access denied. Doctor not approved." });
  }
  next();
};

export { verifyAdmin, verifyDoctor, ApprovedDoctor };
