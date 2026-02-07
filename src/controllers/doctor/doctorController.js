import Doctor from "../../models/DoctorModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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
      available_days,
      time_slots,
      conclusion_duration,
      medical_license: medicalUpload.secure_url,
      goverment_id: idUpload.secure_url,
      profile_image: profileUpload.secure_url,
    };

    const newDoctor = { ...doctorData };

    const hashedPassword = await bcrypt.hash(newDoctor.password, 10);
    newDoctor.password = hashedPassword;
    const doctor = new Doctor(newDoctor);

    const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    await doctor.save();
    return res
      .status(201)
      .cookie("doctorToken", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 1000, // 1 hour
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

    const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return res
      .json({ message: "Login successful.", doctor, role: "doctor" })
      .cookie("doctorToken", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 1000, // 1 hour
      });
  } catch (error) {
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
      secure: true,
      sameSite: "strict",
    });
    return res.json({ message: "Logout successful." });
  } catch (error) {
    return res.status(500).json({ message: "Server error." });
  }
};

export { registerDoctor, loginDoctor, logoutDoctor };
