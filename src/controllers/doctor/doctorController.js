import Doctor from "../../models/DoctorModel.js";
import Appointment from "../../models/AppointmentModel.js";
import User from "../../models/UserModel.js";
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
      { id: doctor._id.toString(), role: "doctor" },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      },
    );

    await doctor.save();
    
    // Clear conflicting cookies
    res.clearCookie("userToken");
    res.clearCookie("adminToken");
    
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
        token,
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
      { id: doctor._id.toString(), role: "doctor" },
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
      .json({ message: "Login successful.", doctor, role: "doctor", token });
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

const getAvailability = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const doctor = await Doctor.findById(doctorId);

      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found." });
      }

      return res.status(200).json({
        available_days: doctor.available_days,
        time_slots: doctor.time_slots,
      });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
}

const markVerificationMessageShown = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { verificationMessageShown: true },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    return res.status(200).json({
      message: "Verification message marked as shown.",
      doctor,
    });
  } catch (error) {
    console.error("Error marking verification message:", error);
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

const createDoctorAppointment = async (req, res) => {
  try {
    const doctorId = new mongoose.Types.ObjectId(req.user.id);
    const { patientName, patientEmail, patientPhone, appointmentDate, timeSlot, consultationType, notes } = req.body;

    // Validate all required fields
    if (!patientName || !patientEmail || !appointmentDate || !timeSlot || !consultationType) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    if (!["Clinic", "Online"].includes(consultationType)) {
      return res.status(400).json({ message: "Invalid consultation type." });
    }

    // Verify doctor exists and is verified
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    if (doctor.verified !== "Verified") {
      return res.status(403).json({ message: "Only verified doctors can create appointments." });
    }

    // Check if doctor is available on the selected day
    const selectedDate = new Date(appointmentDate + 'T00:00:00');
    const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" });

    if (!doctor.available_days.includes(dayName)) {
      return res.status(400).json({ message: "Doctor is not available on the selected day." });
    }

    // Check if time slot is available
    const isTimeSlotAvailable = (slots, selectedTime) => {
      if (!slots || slots.length === 0) return false;

      const slotRanges = {
        morning: { start: 9, end: 12 },
        afternoon: { start: 12, end: 17 },
        evening: { start: 17, end: 21 }
      };

      const timeMatch = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeMatch) return false;

      let hour = parseInt(timeMatch[1]);
      const period = timeMatch[3].toUpperCase();

      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;

      for (const slot of slots) {
        const slotLower = slot.toLowerCase();
        if (slotRanges[slotLower]) {
          const range = slotRanges[slotLower];
          if (hour >= range.start && hour < range.end) {
            return true;
          }
        } else if (slot === selectedTime) {
          return true;
        }
      }
      return false;
    };

    if (!isTimeSlotAvailable(doctor.time_slots, timeSlot)) {
      return res.status(400).json({ message: "Selected time slot is not available for this doctor." });
    }

    // Check for overlapping appointments
    const appointmentDateObj = new Date(appointmentDate);
    const alreadyBooked = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: appointmentDateObj,
      timeSlot: timeSlot,
      status: { $in: ["Approved", "Scheduled"] }
    });

    if (alreadyBooked) {
      return res.status(400).json({ message: "The selected time slot is already booked." });
    }

    // Find or create patient
    let patient = await User.findOne({ email: patientEmail });
    
    if (!patient) {
      // Auto-create patient if doesn't exist
      patient = new User({
        fullName: patientName,
        email: patientEmail,
        password: "temporary_" + Math.random().toString(36).substr(2, 9) // Temporary password
      });
      await patient.save();
    }

    // Create the appointment with status "Approved"
    const newAppointment = new Appointment({
      patient: patient._id,
      doctor: doctorId,
      appointmentDate: appointmentDateObj,
      timeSlot,
      consulation_type: consultationType,
      fee: doctor.consulation_fee,
      status: "Approved", // Doctor-created appointments start as approved
      notes: notes || null
    });

    await newAppointment.save();

    // Populate the response with patient details
    const populatedAppointment = await Appointment.findById(newAppointment._id)
      .populate("patient", "fullName email phone")
      .populate("doctor", "fullName email specialty");

    console.log("Doctor-created appointment:", {
      appointmentId: newAppointment._id,
      doctorId,
      patientEmail,
      appointmentDate,
      timeSlot
    });

    return res.status(201).json({
      message: "Appointment created successfully.",
      appointment: populatedAppointment,
    });
  } catch (error) {
    console.error("Error creating doctor appointment:", error);
    return res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};

// Get booked appointments for a doctor on a specific date
const getBookedAppointmentsForDate = async (req, res) => {
  try {
    const { doctorId, date } = req.params;

    // Validate doctorId format
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "Invalid doctor ID." });
    }

    // Validate date format
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }

    // Verify doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    // Parse the date
    const selectedDate = new Date(date + 'T00:00:00');
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Find all appointments for this doctor on this date with blocking statuses
    const bookedAppointments = await Appointment.find({
      doctor: new mongoose.Types.ObjectId(doctorId),
      appointmentDate: {
        $gte: selectedDate,
        $lt: nextDate,
      },
      status: { $in: ["Scheduled", "Payment_Pending", "Pending_Approval", "Confirmed"] }
    })
      .select("timeSlot status")
      .lean();

    // Extract just the time slots
    const bookedSlots = bookedAppointments.map(apt => apt.timeSlot);

    return res.status(200).json({
      message: "Booked appointments retrieved successfully.",
      date,
      bookedSlots,
      bookedCount: bookedSlots.length,
    });
  } catch (error) {
    console.error("Error fetching booked appointments:", error);
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
};

/**
 * Update doctor's Razorpay onboarding details
 */
const updateRazorpayOnboarding = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { razorpay_account_id, razorpay_key_id, razorpay_key_secret } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    if (razorpay_account_id) doctor.razorpay_account_id = razorpay_account_id;
    if (razorpay_key_id) doctor.razorpay_key_id = razorpay_key_id;
    if (razorpay_key_secret) doctor.razorpay_key_secret = razorpay_key_secret;
    doctor.onboarding_status = "In_Progress";

    // If all fields are present, mark as completed
    if (doctor.razorpay_account_id && doctor.razorpay_key_id && doctor.razorpay_key_secret) {
      doctor.onboarding_status = "Completed";
    }

    await doctor.save();

    return res.status(200).json({
      message: "Razorpay onboarding details updated successfully.",
      onboarding_status: doctor.onboarding_status,
    });
  } catch (error) {
    console.error("Error updating Razorpay onboarding:", error);
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
};

/**
 * Update doctor's bank account details
 */
const updateBankDetails = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { account_number, ifsc_code, beneficiary_name, bank_name } = req.body;

    if (!account_number || !ifsc_code || !beneficiary_name) {
      return res.status(400).json({ message: "Account number, IFSC code, and beneficiary name are required." });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    doctor.bank_account_details = {
      account_number,
      ifsc_code,
      beneficiary_name,
      bank_name: bank_name || null,
    };

    await doctor.save();

    return res.status(200).json({
      message: "Bank account details updated successfully.",
      bank_account_details: {
        ...doctor.bank_account_details.toObject(),
        account_number: "****" + account_number.slice(-4), // Mask account number
      },
    });
  } catch (error) {
    console.error("Error updating bank details:", error);
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
};

/**
 * Get doctor's payment/onboarding info
 */
const getDoctorPaymentInfo = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const doctor = await Doctor.findById(doctorId).select(
      "razorpay_account_id kyc_status bank_account_details onboarding_status total_earnings pending_settlement"
    );

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    // Mask sensitive data
    const bankDetails = doctor.bank_account_details ? {
      account_number: doctor.bank_account_details.account_number
        ? "****" + doctor.bank_account_details.account_number.slice(-4)
        : null,
      ifsc_code: doctor.bank_account_details.ifsc_code,
      beneficiary_name: doctor.bank_account_details.beneficiary_name,
      bank_name: doctor.bank_account_details.bank_name,
    } : null;

    return res.status(200).json({
      razorpay_account_id: doctor.razorpay_account_id ? "****" + doctor.razorpay_account_id.slice(-4) : null,
      kyc_status: doctor.kyc_status,
      bank_account_details: bankDetails,
      onboarding_status: doctor.onboarding_status,
      total_earnings: doctor.total_earnings,
      pending_settlement: doctor.pending_settlement,
    });
  } catch (error) {
    console.error("Error fetching payment info:", error);
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
};

export {
  registerDoctor,
  loginDoctor,
  logoutDoctor,
  getAllAppointments,
  updateSchedule,
  getAvailability,
  markVerificationMessageShown,
  createDoctorAppointment,
  getBookedAppointmentsForDate,
  updateRazorpayOnboarding,
  updateBankDetails,
  getDoctorPaymentInfo,
};
