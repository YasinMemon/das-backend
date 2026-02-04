import Admin from "../../models/adminModel.js";
import bcrypt from "bcrypt";
import Doctor from "../../models/DoctorModel.js";
import jwt from "jsonwebtoken";

async function adminLogin(req, res) {
  try {
    const { username, password } = req.body;

    if (
      username !== process.env.ADMIN_USERNAME ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const token = jwt.sign(
      { username, role: "admin" },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    return res
      .status(200)
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .json({ message: "Login successful", role: "admin" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
}

async function GetAllDoctors(req, res) {
  try {
    const doctors = await Doctor.find();
    return res
      .status(200)
      .json({ status: true, doctors, message: "Doctors fetched successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
}

async function ApproveDoctor(req, res) {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    doctor.verified = "Verified";
    await doctor.save();
    return res
      .status(200)
      .json({ status: true, message: "Doctor approved successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
}

async function RejectDoctor(req, res) {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    doctor.verified = "Rejected";
    await doctor.save();
    return res
      .status(200)
      .json({ status: true, message: "Doctor rejected successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
}

export { adminLogin, GetAllDoctors, ApproveDoctor, RejectDoctor };
  