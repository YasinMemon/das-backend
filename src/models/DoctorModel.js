import { Schema } from "mongoose";
import mongoose from "mongoose";

const DoctorSchema = new Schema(
  {
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
      type: Boolean,
      default: false,
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
