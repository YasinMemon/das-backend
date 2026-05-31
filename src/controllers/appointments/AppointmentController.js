import Appointment from "../../models/AppointmentModel.js";
import Doctor from "../../models/DoctorModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import sendEmail from "../../utils/sendEmail.js";
import { emailTemplates } from "../../utils/emailTemplates.js";

// Platform Razorpay instance (for orders, refunds, etc.)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Helper: Get doctor-specific Razorpay instance or fallback to platform
 */
const getDoctorRazorpay = (doctor) => {
  if (doctor.razorpay_key_id && doctor.razorpay_key_secret) {
    return new Razorpay({
      key_id: doctor.razorpay_key_id,
      key_secret: doctor.razorpay_key_secret,
    });
  }
  // Fallback to platform Razorpay
  return razorpay;
};

/**
 * STEP 1: Patient creates appointment (status = Scheduled)
 * No payment yet, just booking the slot
 */
export const CreateAppointment = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { doctorId, appointmentDate, timeSlot, consultationType, symptoms, notes } = req.body;

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

    // Parse the date correctly to avoid timezone issues
    const selectedDate = new Date(appointmentDate + 'T00:00:00');
    const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" });

    if (!doctor.available_days.includes(dayName)) {
      return res
        .status(400)
        .json({ message: "Doctor is not available on the selected day." });
    }

    // Check if the time slot is available
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
        }
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

    // Check for conflicting appointments (any active status)
    const alreadyBooked = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      timeSlot: timeSlot,
      status: { $in: ["Scheduled", "Payment_Pending", "Pending_Approval", "Approved", "Confirmed"] },
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
      symptoms: symptoms || null,
      notes: notes || null,
    });

    await newAppointment.save();
    console.log("New appointment created:", {
      appointmentId: newAppointment._id,
      patient: patientId,
      doctor: doctorId,
      appointmentDate: appointmentDate,
      status: "Scheduled"
    });

    return res.status(201).json({
      message: "Appointment created successfully. Please proceed with payment.",
      appointment: newAppointment,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

/**
 * Get appointments for the logged-in patient
 */
export const GetAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const appointments = await Appointment.find({ patient: userId })
      .populate("doctor", "fullName email phone specialty city profile_image consulation_fee hospital_name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ appointments });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

/**
 * STEP 2: Patient initiates payment for a scheduled appointment
 * Creates Razorpay order — routes to doctor's account if available
 */
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

    // Only allow payment for Scheduled or Confirmed (approved) appointments
    if (appointment.status !== "Scheduled" && appointment.status !== "Confirmed") {
      return res.status(400).json({ 
        message: `Only scheduled or approved appointments can be paid for. Current status: ${appointment.status}` 
      });
    }

    // Get doctor details for Razorpay routing
    const doctor = await Doctor.findById(appointment.doctor);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    // Commission calculation
    const commissionPercent = parseInt(process.env.PLATFORM_COMMISSION) || 10;
    const platformFee = Math.round((appointment.fee * commissionPercent) / 100);

    // Build order options
    const orderOptions = {
      amount: appointment.fee * 100, // amount in paise
      currency: "INR",
      receipt: `receipt_${appointment._id}`,
      notes: {
        appointmentId: appointment._id.toString(),
        doctorId: doctor._id.toString(),
        patientId: patientId,
      },
    };

    // If doctor has Razorpay account, add transfer instructions for route-based splitting
    if (doctor.razorpay_account_id) {
      orderOptions.transfers = [
        {
          account: doctor.razorpay_account_id,
          amount: (appointment.fee - platformFee) * 100, // doctor's share in paise
          currency: "INR",
          notes: {
            purpose: "Doctor consultation fee",
            appointmentId: appointment._id.toString(),
          },
          on_hold: 1, // Hold transfer until appointment is approved
          on_hold_until: null, // Will be released manually on approval
        },
      ];
    }

    // Use doctor-specific Razorpay instance or platform
    const rzpInstance = getDoctorRazorpay(doctor);
    const order = await razorpay.orders.create(orderOptions);

    // Update appointment status
    appointment.status = "Payment_Pending";
    appointment.paymentId = order.id;
    appointment.platformFee = platformFee;
    appointment.doctorEarnings = appointment.fee - platformFee;
    await appointment.save();

    return res.status(200).json({
      message: "Payment initiated successfully.",
      order,
      appointmentId: appointment._id,
      status: appointment.status,
      razorpayKeyId: doctor.razorpay_key_id || process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    return res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};

/**
 * STEP 3: Payment verification — sets status to Pending_Approval (NOT Confirmed)
 * Payment is held until doctor approves
 */
export const ConfirmPayment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature using platform key secret
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

    // Commission calculation
    const commissionPercent = parseInt(process.env.PLATFORM_COMMISSION) || 10;
    const platformFee = Math.round((appointment.fee * commissionPercent) / 100);
    const doctorEarnings = appointment.fee - platformFee;

    // Status transitions to Completed after successful payment
    appointment.status = "Completed";
    appointment.paymentStatus = "Completed"; 
    appointment.transactionId = razorpay_payment_id;
    appointment.amountPaid = appointment.fee;
    appointment.platformFee = platformFee;
    appointment.doctorEarnings = doctorEarnings;
    appointment.settlementStatus = "Settled";

    console.log(`Payment confirmed for appointment ${appointmentId}. Status set to Completed.`);
    await appointment.save();

    // Update doctor earnings immediately since it's already approved
    await Doctor.findByIdAndUpdate(appointment.doctor, {
      $inc: {
        total_earnings: doctorEarnings,
      },
    });

    // Send notification emails
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

      // Email to Patient — Payment successful, appointment confirmed
      await sendEmail(
        populatedAppointment.patient.email,
        "Appointment Confirmed & Payment Successful",
        `Your payment of ₹${appointment.fee} for the appointment with Dr. ${populatedAppointment.doctor.fullName} has been received. Your appointment is now fully confirmed.`
      );

      // Email to Doctor — New appointment request
      await sendEmail(
        populatedAppointment.doctor.email,
        "New Appointment Request - Action Required",
        emailTemplates.newAppointmentRequest(emailDetails)
      );

      // Email to Admin
      if (process.env.SMTP_EMAIL) {
        await sendEmail(
          process.env.SMTP_EMAIL,
          "New Appointment Payment Received - Pending Approval",
          emailTemplates.adminPaymentNotification(emailDetails)
        );
      }
    } catch (emailError) {
      console.error("Error sending emails:", emailError);
      // Don't fail the request if email sending fails
    }

    return res.status(200).json({
      message: "Payment confirmed. Appointment is pending doctor approval.",
      appointment,
    });
  } catch (error) {
    console.error("Payment Confirmation Error:", error);
    return res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};

/**
 * STEP 4a: Doctor APPROVES the appointment
 * Payment released to doctor, appointment confirmed
 */
export const ApproveAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const doctorId = req.user.id;

    if (!appointmentId) {
      return res.status(400).json({ message: "Appointment ID is required." });
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate("patient", "fullName email phone")
      .populate("doctor", "_id fullName email");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (appointment.doctor._id.toString() !== doctorId) {
      return res.status(403).json({
        message: "You are not authorized to approve this appointment."
      });
    }

    // Only allow approving pending-approval or scheduled appointments
    if (appointment.status !== "Pending_Approval" && appointment.status !== "Scheduled") {
      return res.status(400).json({ 
        message: `Cannot approve an appointment with status: ${appointment.status}. Only appointments pending approval or scheduled can be approved.` 
      });
    }

    // Transition: Pending_Approval/Scheduled -> Confirmed (Awaiting Payment)
    appointment.status = "Confirmed";
    // paymentStatus remains "Pending" until patient pays
    appointment.approvedAt = new Date();
    await appointment.save();

    // Notify patient that appointment is approved and ready for payment
    try {
      await sendEmail(
        appointment.patient.email,
        "Appointment Approved - Payment Required",
        `Your appointment with Dr. ${appointment.doctor.fullName} has been approved. Please log in to your dashboard to complete the payment and secure your slot.`
      );
    } catch (e) {
      console.error("Email error:", e);
    }

    return res.status(200).json({
      message: "Appointment approved. Patient can now proceed with payment.",
      appointment,
    });

    // Update doctor earnings
    await Doctor.findByIdAndUpdate(doctorId, {
      $inc: {
        total_earnings: appointment.doctorEarnings,
        pending_settlement: appointment.doctorEarnings,
      },
    });

    // If doctor has Razorpay account, release held transfer
    try {
      const doctor = await Doctor.findById(doctorId);
      if (doctor.razorpay_account_id && appointment.transactionId) {
        // Modify transfer hold (release funds)
        const payment = await razorpay.payments.fetch(appointment.transactionId);
        if (payment.transfers && payment.transfers.items) {
          for (const transfer of payment.transfers.items) {
            if (transfer.on_hold) {
              await razorpay.transfers.edit(transfer.id, {
                on_hold: 0,
              });
              console.log(`Transfer ${transfer.id} released for appointment ${appointmentId}`);
            }
          }
        }
      }
    } catch (transferError) {
      console.error("Error releasing transfer hold:", transferError);
      // Non-critical: log but don't fail the approval
    }

    // Send confirmation emails
    try {
      const emailDetails = {
        patientName: appointment.patient.fullName,
        doctorName: appointment.doctor.fullName,
        date: new Date(appointment.appointmentDate).toLocaleDateString(),
        time: appointment.timeSlot,
        type: appointment.consulation_type,
        fee: appointment.fee,
        transactionId: appointment.transactionId,
      };

      // Email to Patient
      await sendEmail(
        appointment.patient.email,
        "Appointment Confirmed!",
        emailTemplates.appointmentConfirmation({ ...emailDetails, role: "patient" })
      );

      // Email to Doctor
      await sendEmail(
        appointment.doctor.email,
        "Appointment Confirmed",
        emailTemplates.appointmentConfirmation({ ...emailDetails, role: "doctor" })
      );
    } catch (emailError) {
      console.error("Error sending confirmation emails:", emailError);
    }

    console.log("Appointment approved:", {
      appointmentId: appointment._id,
      doctorId: doctorId,
      patientId: appointment.patient._id,
      newStatus: "Confirmed"
    });

    return res.status(200).json({
      message: "Appointment approved and confirmed successfully.",
      appointment,
    });
  } catch (error) {
    console.error("Error approving appointment:", error);
    return res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

/**
 * STEP 4b: Doctor REJECTS the appointment
 * Triggers automatic Razorpay refund, notifies patient
 */
export const RejectAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const doctorId = req.user.id;
    const { reason } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ message: "Appointment ID is required." });
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate("patient", "fullName email phone")
      .populate("doctor", "_id fullName email");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (appointment.doctor._id.toString() !== doctorId) {
      return res.status(403).json({
        message: "You are not authorized to reject this appointment."
      });
    }

    // Only allow rejecting pending-approval or scheduled appointments
    if (appointment.status !== "Pending_Approval" && appointment.status !== "Scheduled") {
      return res.status(400).json({ 
        message: `Cannot reject an appointment with status: ${appointment.status}. Only appointments pending approval or scheduled can be rejected.` 
      });
    }

    // Update appointment status to Rejected
    appointment.status = "Rejected";
    appointment.rejectionReason = reason || "Doctor unavailable";
    appointment.rejectedAt = new Date();

    // Trigger Razorpay refund
    let refundResult = null;
    if (appointment.transactionId) {
      try {
        refundResult = await razorpay.payments.refund(appointment.transactionId, {
          amount: appointment.amountPaid * 100, // Full refund in paise
          speed: "normal", // 'normal' or 'optimum'
          notes: {
            reason: reason || "Doctor rejected the appointment",
            appointmentId: appointment._id.toString(),
          },
        });

        appointment.refundId = refundResult.id;
        appointment.refundStatus = "Initiated";
        appointment.refundAmount = appointment.amountPaid;
        appointment.paymentStatus = "Refunded";
        appointment.settlementStatus = null;

        console.log("Refund initiated:", {
          refundId: refundResult.id,
          amount: appointment.amountPaid,
          appointmentId: appointment._id,
        });
      } catch (refundError) {
        console.error("Razorpay refund error:", refundError);
        // Still reject but mark refund as failed
        appointment.refundStatus = "Failed";
        // Don't fail the rejection — admin can manually process refund
      }
    }

    // If doctor has Razorpay account, reverse the transfer
    try {
      const doctor = await Doctor.findById(doctorId);
      if (doctor.razorpay_account_id && appointment.transactionId) {
        const payment = await razorpay.payments.fetch(appointment.transactionId);
        if (payment.transfers && payment.transfers.items) {
          for (const transfer of payment.transfers.items) {
            try {
              await razorpay.transfers.reverse(transfer.id, {
                amount: transfer.amount,
              });
              console.log(`Transfer ${transfer.id} reversed for appointment ${appointmentId}`);
            } catch (reverseError) {
              console.error("Transfer reversal error:", reverseError);
            }
          }
        }
      }
    } catch (transferError) {
      console.error("Error reversing transfers:", transferError);
    }

    await appointment.save();

    // Send rejection emails
    try {
      const emailDetails = {
        patientName: appointment.patient.fullName,
        doctorName: appointment.doctor.fullName,
        date: new Date(appointment.appointmentDate).toLocaleDateString(),
        time: appointment.timeSlot,
        type: appointment.consulation_type,
        fee: appointment.fee,
        reason: reason || "Doctor unavailable",
        refundId: appointment.refundId,
        refundAmount: appointment.refundAmount,
        refundStatus: appointment.refundStatus,
      };

      // Email to Patient — Rejection + Refund info
      await sendEmail(
        appointment.patient.email,
        "Appointment Rejected - Refund Initiated",
        emailTemplates.appointmentRejection(emailDetails)
      );

      // Email to Doctor — Confirmation of rejection
      await sendEmail(
        appointment.doctor.email,
        "Appointment Rejection Confirmed",
        emailTemplates.doctorRejectionConfirmation(emailDetails)
      );
    } catch (emailError) {
      console.error("Error sending rejection emails:", emailError);
    }

    console.log("Appointment rejected:", {
      appointmentId: appointment._id,
      doctorId: doctorId,
      patientId: appointment.patient._id,
      newStatus: "Rejected",
      reason: reason || "No reason provided",
      refundId: appointment.refundId,
    });

    return res.status(200).json({
      message: "Appointment rejected successfully. Refund has been initiated.",
      appointment,
      refund: refundResult ? {
        id: refundResult.id,
        amount: appointment.refundAmount,
        status: appointment.refundStatus,
      } : null,
    });
  } catch (error) {
    console.error("Error rejecting appointment:", error);
    return res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

/**
 * Mark confirmed appointment as completed
 */
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
        message: "Only confirmed (paid & approved) appointments can be completed."
      });
    }

    appointment.status = "Completed";
    appointment.settlementStatus = "Settled";
    await appointment.save();

    return res.status(200).json({
      message: "Appointment completed successfully.",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};

/**
 * Get pending approval appointments for a doctor
 */
export const GetPendingAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const appointments = await Appointment.find({
      doctor: doctorId,
      status: "Pending_Approval",
    })
      .populate("patient", "fullName email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Pending appointments fetched successfully.",
      appointments,
      count: appointments.length,
    });
  } catch (error) {
    console.error("Error fetching pending appointments:", error);
    return res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

/**
 * Get refund status for an appointment
 */
export const GetRefundStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    // Allow both patient and doctor to check refund status
    if (
      appointment.patient.toString() !== userId &&
      appointment.doctor.toString() !== userId
    ) {
      return res.status(403).json({ message: "Not authorized." });
    }

    if (!appointment.refundId) {
      return res.status(400).json({ message: "No refund found for this appointment." });
    }

    // Fetch latest refund status from Razorpay
    try {
      const refund = await razorpay.refunds.fetch(appointment.refundId);

      // Update local status if changed
      const statusMap = {
        created: "Initiated",
        processed: "Completed",
        failed: "Failed",
      };

      const newStatus = statusMap[refund.status] || appointment.refundStatus;
      if (newStatus !== appointment.refundStatus) {
        appointment.refundStatus = newStatus;
        if (newStatus === "Completed") {
          appointment.refundedAt = new Date();
        }
        await appointment.save();
      }

      return res.status(200).json({
        message: "Refund status fetched successfully.",
        refund: {
          id: refund.id,
          amount: refund.amount / 100, // Convert from paise
          status: newStatus,
          speed_requested: refund.speed_requested,
          created_at: refund.created_at,
        },
      });
    } catch (rzpError) {
      console.error("Error fetching refund from Razorpay:", rzpError);
      return res.status(200).json({
        message: "Refund status from local records.",
        refund: {
          id: appointment.refundId,
          amount: appointment.refundAmount,
          status: appointment.refundStatus,
        },
      });
    }
  } catch (error) {
    console.error("Error fetching refund status:", error);
    return res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

/**
 * Admin: Update platform commission percentage
 */
export const UpdateCommission = async (req, res) => {
  try {
    const { commissionPercent } = req.body;

    if (commissionPercent === undefined || commissionPercent < 0 || commissionPercent > 100) {
      return res.status(400).json({ message: "Commission must be between 0 and 100." });
    }

    // In a production system, this would be stored in a settings collection
    // For now we'll validate the request and suggest .env update
    return res.status(200).json({
      message: `Commission updated to ${commissionPercent}%. Update PLATFORM_COMMISSION in .env for persistence.`,
      commissionPercent,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};

/**
 * Admin: Get settlement and commission report
 */
export const GetSettlementReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const appointments = await Appointment.find({
      ...query,
      paymentStatus: { $in: ["Completed", "Refunded", "Held"] },
    })
      .populate("patient", "fullName email")
      .populate("doctor", "fullName email razorpay_account_id")
      .sort({ createdAt: -1 });

    const totalRevenue = appointments.reduce((sum, apt) => sum + (apt.amountPaid || 0), 0);
    const totalPlatformFee = appointments.reduce((sum, apt) => sum + (apt.platformFee || 0), 0);
    const totalDoctorEarnings = appointments.reduce((sum, apt) => sum + (apt.doctorEarnings || 0), 0);
    const totalRefunded = appointments
      .filter((apt) => apt.paymentStatus === "Refunded")
      .reduce((sum, apt) => sum + (apt.refundAmount || 0), 0);

    return res.status(200).json({
      message: "Settlement report generated.",
      report: {
        totalRevenue,
        totalPlatformFee,
        totalDoctorEarnings,
        totalRefunded,
        appointmentCount: appointments.length,
        commissionPercent: parseInt(process.env.PLATFORM_COMMISSION) || 10,
      },
      appointments,
    });
  } catch (error) {
    console.error("Error generating settlement report:", error);
    return res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};
