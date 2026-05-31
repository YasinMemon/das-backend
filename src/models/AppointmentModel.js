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
        "Payment_Pending",
        "Pending_Approval",
        "Approved",
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
      enum: ["Pending", "Completed", "Failed", "Refunded", "Held"],
      default: "Pending",
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    // Refund tracking
    refundId: {
      type: String,
      default: null,
    },
    refundStatus: {
      type: String,
      enum: [null, "Initiated", "Processing", "Completed", "Failed"],
      default: null,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    // Appointment details
    symptoms: {
      type: String,
      trim: true,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },
    // Doctor approval tracking
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    // Settlement tracking
    settlementStatus: {
      type: String,
      enum: [null, "Held", "Released", "Settled"],
      default: null,
    },
    settlementId: {
      type: String,
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
