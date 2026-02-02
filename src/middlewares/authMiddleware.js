import jwt from "jsonwebtoken";
import Doctor from "../models/DoctorModel.js";

const verifyToken = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

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
  if (req.user.role !== "admin") {
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
