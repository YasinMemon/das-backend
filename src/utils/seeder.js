import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "../models/UserModel.js";
import Doctor from "../models/DoctorModel.js";
import Admin from "../models/adminModel.js";
import { ConnectDB } from "../config/db.js";

dotenv.config();

const seedData = async () => {
  try {
    await ConnectDB();

    // Clear existing data
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Admin.deleteMany({});

    console.log("Database cleared.");

    const saltRounds = 10;
    const commonPassword = "password123";
    const hashedPassword = await bcrypt.hash(commonPassword, saltRounds);

    // Create Admin
    const admin = new Admin({
      username: "admin",
      password: commonPassword, // adminModel has pre-save hook for hashing
    });
    await admin.save();
    console.log("Admin created: admin / password123");

    // Create Patients (Users)
    const patients = [
      {
        fullName: "John Doe",
        email: "john@example.com",
        password: hashedPassword,
      },
      {
        fullName: "Jane Smith",
        email: "jane@example.com",
        password: hashedPassword,
      },
    ];
    await User.insertMany(patients);
    console.log("Patients created: john@example.com, jane@example.com / password123");

    // Create Doctors
    const doctors = [
      {
        fullName: "Dr. Robert Wilson",
        email: "robert@example.com",
        phone: "1234567890",
        password: hashedPassword,
        specialty: "Cardiology",
        experience: 15,
        qualifications: ["MBBS", "MD"],
        registration_number: "REG12345",
        hospital_name: "City Heart Hospital",
        city: "New York",
        consulation_type: "Both",
        consulation_fee: 1000,
        available_days: ["Monday", "Wednesday", "Friday"],
        time_slots: ["morning", "afternoon"],
        conclusion_duration: 30,
        medical_license: "https://via.placeholder.com/150",
        goverment_id: "https://via.placeholder.com/150",
        profile_image: "https://via.placeholder.com/150",
        verified: "Verified",
        isActive: true,
      },
      {
        fullName: "Dr. Sarah Johnson",
        email: "sarah@example.com",
        phone: "0987654321",
        password: hashedPassword,
        specialty: "Dermatology",
        experience: 10,
        qualifications: ["MBBS", "DDVL"],
        registration_number: "REG67890",
        hospital_name: "Skin Care Clinic",
        city: "Los Angeles",
        consulation_type: "Clinic",
        consulation_fee: 800,
        available_days: ["Tuesday", "Thursday", "Saturday"],
        time_slots: ["afternoon", "evening"],
        conclusion_duration: 20,
        medical_license: "https://via.placeholder.com/150",
        goverment_id: "https://via.placeholder.com/150",
        profile_image: "https://via.placeholder.com/150",
        verified: "Verified",
        isActive: true,
      },
    ];

    for (const doc of doctors) {
        const newDoc = new Doctor(doc);
        await newDoc.save();
    }
    
    console.log("Doctors created: robert@example.com, sarah@example.com / password123");

    console.log("Seeding completed successfully.");
    process.exit();
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedData();
