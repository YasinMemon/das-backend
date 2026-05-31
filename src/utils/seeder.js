import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "../models/UserModel.js";
import Doctor from "../models/DoctorModel.js";
import Admin from "../models/adminModel.js";
import Appointment from "../models/AppointmentModel.js";
import { ConnectDB } from "../config/db.js";

dotenv.config();

const seedData = async () => {
  try {
    await ConnectDB();

    // Clear existing data
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Admin.deleteMany({});
    await Appointment.deleteMany({});

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

    const createdDoctors = [];
    for (const doc of doctors) {
      const newDoc = new Doctor(doc);
      await newDoc.save();
      createdDoctors.push(newDoc);
    }

    console.log("Doctors created: robert@example.com, sarah@example.com / password123");

    // Create a Test Appointment in Pending_Approval state for Dr. Robert (the first doctor)
    const firstUser = await User.findOne({ email: "john@example.com" });
    if (firstUser && createdDoctors.length > 0) {
      const testAppointment = new Appointment({
        patient: firstUser._id,
        doctor: createdDoctors[0]._id,
        appointmentDate: new Date(Date.now() + 86400000), // tomorrow
        timeSlot: "10:00 AM",
        consulation_type: "Clinic",
        status: "Pending_Approval",
        fee: createdDoctors[0].consulation_fee,
        paymentStatus: "Held",
        amountPaid: createdDoctors[0].consulation_fee,
        transactionId: "pay_test_12345",
        symptoms: "Mild fever and cough",
      });
      await testAppointment.save();
      console.log("Test Appointment created in Pending_Approval state for Dr. Robert.");
    }

    console.log("Seeding completed successfully.");
    process.exit();
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedData();
