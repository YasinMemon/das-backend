import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    consulation_type: {
      type: String,
      required: true,
      trim: true,
      enum: ["Clinic", "Online"],
    },
    status: {
      type: String,
      enum: [
        "Scheduled",
        "Approved",
        "Payment_Pending",
        "Confirmed",
        "Rejected",
        "Completed",
        "Cancelled",
      ],
      default: "Scheduled",
    },
    fee: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    doctorEarnings: {
      type: Number,
      default: 0,
    },
    paymentId: {
      type: String,
      default: null,
    },
    transactionId: {
      type: String,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Refunded"],
      default: "Pending",
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const Appointment = mongoose.model("Appointment", AppointmentSchema);

export default Appointment;
