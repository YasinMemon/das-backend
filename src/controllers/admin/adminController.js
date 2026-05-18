import Admin from "../../models/adminModel.js";

import bcrypt from "bcrypt";
import Doctor from "../../models/DoctorModel.js";
import jwt from "jsonwebtoken";
import sendEmail from "../../utils/sendEmail.js";
import { emailTemplates } from "../../utils/emailTemplates.js";

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
      { id: "admin", username, role: "admin" },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );
    
    // Clear all other cookies to prevent token conflicts
    res.clearCookie("userToken");
    res.clearCookie("doctorToken");

    return res
      .status(200)
      .cookie("adminToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .json({ message: "Login successful", role: "admin", token });
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

    // Update verification status
    doctor.verified = "Verified";
    await doctor.save();

    // Send approval email to doctor
    try {
      const emailContent = emailTemplates.doctorApproval(doctor.fullName);
      const emailResult = await sendEmail(
        doctor.email,
        `Profile Verification Complete - ${process.env.APP_NAME}`,
        emailContent
      );

      if (emailResult.success) {
        console.log("Approval email sent successfully to:", doctor.email);
      } else {
        console.warn("Failed to send approval email:", emailResult.error);
        // Don't fail approval if email fails, just log it
      }
    } catch (emailError) {
      console.error("Error sending approval email:", emailError);
      // Don't fail approval if email fails
    }

    return res
      .status(200)
      .json({ 
        status: true, 
        message: "Doctor approved successfully and notification email sent",
        doctor
      });
  } catch (error) {
    console.error("Error approving doctor:", error);
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

async function adminLogout(req, res) {
  try {
    res.clearCookie("adminToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    });
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
}

export { adminLogin, adminLogout, GetAllDoctors, ApproveDoctor, RejectDoctor };
  