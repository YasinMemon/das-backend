import Appointment from "../../models/AppointmentModel.js";
import Doctor from "../../models/DoctorModel.js";
import Admin from "../../models/adminModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import sendEmail from "../../utils/sendEmail.js";
import { emailTemplates } from "../../utils/emailTemplates.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const CreateAppointment = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { doctorId, appointmentDate, timeSlot, consultationType } = req.body;

    if (!doctorId || !appointmentDate || !timeSlot || !consultationType) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!["Clinic", "Online"].includes(consultationType)) {
      return res.status(400).json({ message: "Invalid consultation type." });
    }

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    // Additional logic to create and save the appointment would go here
    // Parse the date correctly to avoid timezone issues
    // appointmentDate format is "YYYY-MM-DD", append time to ensure correct day
    const selectedDate = new Date(appointmentDate + 'T00:00:00');
    const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" });
    
    if (!doctor.available_days.includes(dayName)) {
      return res
        .status(400)
        .json({ message: "Doctor is not available on the selected day." });
    }

    // Check if the time slot is available
    // Time slots can be stored as ranges (morning, afternoon, evening) or specific times
    const isTimeSlotAvailable = (slots, selectedTime) => {
      if (!slots || slots.length === 0) return false;
      
      // Define time ranges for slot names
      const slotRanges = {
        morning: { start: 9, end: 12 },    // 9 AM - 12 PM
        afternoon: { start: 12, end: 17 }, // 12 PM - 5 PM
        evening: { start: 17, end: 21 }    // 5 PM - 9 PM
      };
      
      // Extract hour from selected time (e.g., "10:00 AM" -> 10)
      const timeMatch = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeMatch) return false;
      
      let hour = parseInt(timeMatch[1]);
      const period = timeMatch[3].toUpperCase();
      
      // Convert to 24-hour format
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      
      // Check if selected time falls within any available slot
      for (const slot of slots) {
        const slotLower = slot.toLowerCase();
        
        // If slot is a range name (morning/afternoon/evening)
        if (slotRanges[slotLower]) {
          const range = slotRanges[slotLower];
          if (hour >= range.start && hour < range.end) {
            return true;
          }
        }
        // If slot is a specific time, check for exact match
        else if (slot === selectedTime) {
          return true;
        }
      }
      
      return false;
    };

    if (!isTimeSlotAvailable(doctor.time_slots, timeSlot)) {
      return res
        .status(400)
        .json({ message: "Selected time slot is not available." });
    }

    const alreadyBooked = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      timeSlot: timeSlot,
      status: "Scheduled",
    });

    if (alreadyBooked) {
      return res
        .status(400)
        .json({ message: "The selected time slot is already booked." });
    }

    const newAppointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      consulation_type: consultationType,
      fee: doctor.consulation_fee,
    });

    await newAppointment.save();
    console.log("New appointment created:", {
      appointmentId: newAppointment._id,
      patient: patientId,
      doctor: doctorId,
      appointmentDate: appointmentDate
    });
    
    return res.status(201).json({
      message: "Appointment created successfully.",
      appointment: newAppointment,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

export const GetAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const appointments = await Appointment.find({ patient: userId });

    return res.status(200).json({ appointments });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

export const ApproveAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const doctorId = req.user.id;

    if (!appointmentId) {
      return res.status(400).json({ message: "Appointment ID is required." });
    }

    // Verify the appointment belongs to the doctor
    const appointment = await Appointment.findById(appointmentId)
      .populate("patient", "fullName email phone")
      .populate("doctor", "_id fullName");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (appointment.doctor._id.toString() !== doctorId) {
      return res.status(403).json({ 
        message: "You are not authorized to approve this appointment." 
      });
    }

    // Only allow approving scheduled appointments
    if (appointment.status !== "Scheduled") {
      return res.status(400).json({ 
        message: `Cannot approve an appointment with status: ${appointment.status}` 
      });
    }

    // Update appointment status to Approved
    appointment.status = "Approved";
    await appointment.save();

    console.log("Appointment approved:", {
      appointmentId: appointment._id,
      doctorId: doctorId,
      patientId: appointment.patient._id,
      newStatus: "Approved"
    });

    return res.status(200).json({
      message: "Appointment approved successfully.",
      appointment,
    });
  } catch (error) {
    console.error("Error approving appointment:", error);
    return res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

export const RejectAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const doctorId = req.user.id;
    const { reason } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ message: "Appointment ID is required." });
    }

    // Verify the appointment belongs to the doctor
    const appointment = await Appointment.findById(appointmentId)
      .populate("patient", "fullName email phone")
      .populate("doctor", "_id fullName");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (appointment.doctor._id.toString() !== doctorId) {
      return res.status(403).json({ 
        message: "You are not authorized to reject this appointment." 
      });
    }

    // Only allow rejecting scheduled appointments
    if (appointment.status !== "Scheduled") {
      return res.status(400).json({ 
        message: `Cannot reject an appointment with status: ${appointment.status}` 
      });
    }

    // Update appointment status to Rejected
    appointment.status = "Rejected";
    // Optionally store the rejection reason if provided
    if (reason) {
      appointment.rejectionReason = reason;
    }
    await appointment.save();

    console.log("Appointment rejected:", {
      appointmentId: appointment._id,
      doctorId: doctorId,
      patientId: appointment.patient._id,
      newStatus: "Rejected",
      reason: reason || "No reason provided"
    });

    return res.status(200).json({
      message: "Appointment rejected successfully.",
      appointment,
    });
  } catch (error) {
    console.error("Error rejecting appointment:", error);
    return res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

export const InitiatePayment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const patientId = req.user.id;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (appointment.patient.toString() !== patientId) {
      return res.status(403).json({ message: "Not authorized." });
    }

    if (!["Approved", "Scheduled"].includes(appointment.status)) {
      return res.status(400).json({ 
        message: "Only approved or scheduled appointments can be paid for." 
      });
    }

    // Create Razorpay Order
    const options = {
      amount: appointment.fee * 100, // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_${appointment._id}`,
    };

    const order = await razorpay.orders.create(options);

    // Update status to Payment_Pending
    appointment.status = "Payment_Pending";
    appointment.paymentId = order.id;
    await appointment.save();

    return res.status(200).json({
      message: "Payment initiated successfully.",
      order,
      appointmentId: appointment._id,
      status: appointment.status
    });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    return res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};

export const ConfirmPayment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ message: "Invalid payment signature." });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    // Platform fee (e.g., from .env or default 10%)
    const commissionPercent = parseInt(process.env.PLATFORM_COMMISSION) || 10;
    const platformFee = (appointment.fee * commissionPercent) / 100;
    const doctorEarnings = appointment.fee - platformFee;

    appointment.status = "Confirmed";
    appointment.paymentStatus = "Completed";
    appointment.transactionId = razorpay_payment_id;
    appointment.amountPaid = appointment.fee;
    appointment.platformFee = platformFee;
    appointment.doctorEarnings = doctorEarnings;


    await appointment.save();

    // Send emails to Patient, Doctor and Admin
    try {
      const populatedAppointment = await Appointment.findById(appointmentId)
        .populate("patient", "fullName email")
        .populate("doctor", "fullName email");

      const emailDetails = {
        patientName: populatedAppointment.patient.fullName,
        doctorName: populatedAppointment.doctor.fullName,
        date: new Date(appointment.appointmentDate).toLocaleDateString(),
        time: appointment.timeSlot,
        type: appointment.consulation_type,
        fee: appointment.fee,
        transactionId: razorpay_payment_id,
      };

      console.log("Sending confirmation emails to:", {
        patient: populatedAppointment.patient.email,
        doctor: populatedAppointment.doctor.email,
        admin: process.env.SMTP_EMAIL
      });

      // Email to Patient
      await sendEmail(
        populatedAppointment.patient.email,
        "Appointment Confirmation - Paid",
        emailTemplates.appointmentConfirmation({ ...emailDetails, role: "patient" })
      );

      // Email to Doctor
      await sendEmail(
        populatedAppointment.doctor.email,
        "New Confirmed Appointment",
        emailTemplates.appointmentConfirmation({ ...emailDetails, role: "doctor" })
      );

      // Email to Admin (using SMTP_EMAIL as fallback since Admin model lacks email)
      if (process.env.SMTP_EMAIL) {
        await sendEmail(
          process.env.SMTP_EMAIL,
          "New Appointment Payment Received",
          emailTemplates.appointmentConfirmation({ ...emailDetails, role: "admin" })
        );
      }
    } catch (emailError) {
      console.error("Error sending confirmation emails:", emailError);
      // Don't fail the request if email sending fails
    }

    return res.status(200).json({
      message: "Payment confirmed. Appointment is now Confirmed.",
      appointment,
    });
  } catch (error) {
    console.error("Payment Confirmation Error:", error);
    return res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};

export const CompleteAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const doctorId = req.user.id;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (appointment.doctor.toString() !== doctorId) {
      return res.status(403).json({ message: "Not authorized." });
    }

    if (appointment.status !== "Confirmed") {
      return res.status(400).json({ 
        message: "Only confirmed (paid) appointments can be completed." 
      });
    }

    appointment.status = "Completed";
    await appointment.save();

    return res.status(200).json({
      message: "Appointment completed successfully.",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};
