import Doctor from "../../models/DoctorModel.js";
import Appointment from "../../models/AppointmentModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary.js";

async function registerDoctor(req, res) {
  // Registration logic here
  try {
    const {
      fullName,
      email,
      phone,
      password,
      specialty,
      experience,
      qualifications,
      registration_number,
      hospital_name,
      city,
      consulation_type,
      consulation_fee,
      available_days,
      time_slots,
      conclusion_duration,
    } = req.body;

    // Parse JSON strings for arrays if they come from FormData
    let parsedAvailableDays = available_days;
    let parsedTimeSlots = time_slots;

    if (typeof available_days === "string") {
      try {
        parsedAvailableDays = JSON.parse(available_days);
      } catch (e) {
        // If not JSON, treat as single value array
        parsedAvailableDays = [available_days];
      }
    }

    if (typeof time_slots === "string") {
      try {
        parsedTimeSlots = JSON.parse(time_slots);
      } catch (e) {
        // If not JSON, treat as single value array
        parsedTimeSlots = [time_slots];
      }
    }

    const medical_license = req.files?.medical_license;
    const goverment_id = req.files?.goverment_id;
    const profile_image = req.files?.profile_image;
    const existingDoctor = await Doctor.findOne({ email });

    if (existingDoctor) {
      return res.status(409).json({ message: "Doctor already exists." });
    }

    if (!medical_license || !goverment_id) {
      return res
        .status(400)
        .json({ message: "Medical license and government ID are required." });
    }

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const medicalUpload = await uploadToCloudinary(
      medical_license[0].buffer,
      "doctor_documents",
    );

    const idUpload = await uploadToCloudinary(
      goverment_id[0].buffer,
      "doctor_documents",
    );

    const profileUpload = await uploadToCloudinary(
      profile_image[0].buffer,
      "doctor_profiles",
    );

    const doctorData = {
      fullName,
      email,
      phone,
      password,
      specialty,
      experience,
      qualifications,
      registration_number,
      hospital_name,
      city,
      consulation_type,
      consulation_fee,
      available_days: parsedAvailableDays,
      time_slots: parsedTimeSlots,
      conclusion_duration,
      medical_license: medicalUpload.secure_url,
      goverment_id: idUpload.secure_url,
      profile_image: profileUpload.secure_url,
    };

    const newDoctor = { ...doctorData };

    const hashedPassword = await bcrypt.hash(newDoctor.password, 10);
    newDoctor.password = hashedPassword;
    const doctor = new Doctor(newDoctor);

    const token = jwt.sign(
      { id: doctor._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      },
    );

    await doctor.save();
    return res
      .status(201)
      .cookie("doctorToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: "/",
      })
      .json({
        message: "Doctor registered successfully.",
        doctor,
        role: "doctor",
      });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
}

async function loginDoctor(req, res) {
  try {
    const { email, password } = req.body;

    const doctor = await Doctor.findOne({ email });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    const isPasswordValid = await bcrypt.compare(password, doctor.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: doctor._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      },
    );

    console.log("\n=== Doctor Login ===");
    console.log("Doctor ID:", doctor._id);
    console.log("Doctor ID toString:", doctor._id.toString());
    console.log("Doctor Name:", doctor.fullName);
    console.log("Doctor Email:", doctor.email);
    console.log("Token signed with ID:", doctor._id.toString());

    // Clear any existing cookies first
    res.clearCookie("doctorToken");
    res.clearCookie("userToken");
    res.clearCookie("adminToken");

    return res
      .cookie("doctorToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: "/",
      })
      .json({ message: "Login successful.", doctor, role: "doctor" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error." });
  }
}

const logoutDoctor = (req, res) => {
  try {
    const token =
      req.cookies.doctorToken || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(400).json({ message: "No token provided." });
    }
    res.clearCookie("doctorToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return res.json({ message: "Logout successful." });
  } catch (error) {
    return res.status(500).json({ message: "Server error." });
  }
};

const getAllAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;

    // Convert string ID to ObjectId
    const doctorObjectId = new mongoose.Types.ObjectId(doctorId);

    const appointments = await Appointment.find({ doctor: doctorObjectId })
      .populate("patient", "fullName email phone")
      .sort({ appointmentDate: -1 });

    return res
      .status(200)
      .json({ message: "Appointments fetched successfully.", appointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { available_days, time_slots } = req.body;

    // Parse JSON strings for arrays if they come from FormData
    let parsedAvailableDays = available_days;
    let parsedTimeSlots = time_slots;

    if (typeof available_days === "string") {
      try {
        parsedAvailableDays = JSON.parse(available_days);
      } catch (e) {
        // If not JSON, treat as single value array
        parsedAvailableDays = [available_days];
      }
    }

    if (typeof time_slots === "string") {
      try {
        parsedTimeSlots = JSON.parse(time_slots);
      } catch (e) {
        // If not JSON, treat as single value array
        parsedTimeSlots = [time_slots];
      }
    }

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    doctor.available_days = parsedAvailableDays || doctor.available_days;
    doctor.time_slots = parsedTimeSlots || doctor.time_slots;

    await doctor.save();

    return res
      .status(200)
      .json({ message: "Schedule updated successfully.", doctor });
  } catch (error) {
    console.error("Error updating schedule:", error);
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

export {
  registerDoctor,
  loginDoctor,
  logoutDoctor,
  getAllAppointments,
  updateSchedule,
};
