import { Schema } from "mongoose";
import mongoose from "mongoose";


const DoctorSchema = new Schema(
  {
    profile_image: {
      type: String,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    specialty: {
      type: String,
      required: true,
      trim: true,
    },
    experience: {
      type: Number,
      required: true,
      min: 0,
    },
    qualifications: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return v.length > 0;
        },
        message: "At least one qualification is required.",
      },
    },
    registration_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    hospital_name: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    consulation_type: {
      type: String,
      required: true,
      enum: ["Clinic", "Online", "Both"],
      trim: true,
    },
    consulation_fee: {
      type: Number,
      required: true,
      min: 0,
    },
    available_days: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return v.length > 0;
        },
        message: "At least one available day is required.",
      },
    },
    time_slots: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return v.length > 0;
        },
        message: "At least one time slot is required.",
      },
    },
    conclusion_duration: {
      type: Number,
      required: true,
      min: 5,
    },
    medical_license: {
      type: String,
      required: true,
      trim: true,
    },
    goverment_id: {
      type: String,
      required: true,
      trim: true,
    },
    verified: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },
    verificationMessageShown: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    // Razorpay Connect / Multi-vendor fields
    razorpay_account_id: {
      type: String,
      trim: true,
      default: null,
    },
    razorpay_key_id: {
      type: String,
      trim: true,
      default: null,
    },
    razorpay_key_secret: {
      type: String,
      trim: true,
      default: null,
    },
    kyc_status: {
      type: String,
      enum: ["Not_Started", "Pending", "Verified", "Failed"],
      default: "Not_Started",
    },
    bank_account_details: {
      account_number: { type: String, trim: true, default: null },
      ifsc_code: { type: String, trim: true, default: null },
      beneficiary_name: { type: String, trim: true, default: null },
      bank_name: { type: String, trim: true, default: null },
    },
    onboarding_status: {
      type: String,
      enum: ["Not_Started", "In_Progress", "Completed", "Failed"],
      default: "Not_Started",
    },
    // Earnings tracking
    total_earnings: {
      type: Number,
      default: 0,
    },
    pending_settlement: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const Doctor = mongoose.model("Doctor", DoctorSchema);

export default Doctor;
