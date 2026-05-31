import Appointment from "../../models/AppointmentModel.js";
import Doctor from "../../models/DoctorModel.js";
import crypto from "crypto";
import sendEmail from "../../utils/sendEmail.js";
import { emailTemplates } from "../../utils/emailTemplates.js";

export const RazorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (signature !== digest) {
      return res.status(400).json({ message: "Invalid webhook signature." });
    }

    const event = req.body.event;

    // Handle payment captured
    if (event === "payment.captured") {
      const payment = req.body.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      const appointment = await Appointment.findOne({ paymentId: orderId });

      if (appointment && !["Confirmed", "Pending_Approval"].includes(appointment.status)) {
        const commissionPercent = parseInt(process.env.PLATFORM_COMMISSION) || 10;
        const platformFee = Math.round((appointment.fee * commissionPercent) / 100);
        const doctorEarnings = appointment.fee - platformFee;

        // KEY CHANGE: Set to Pending_Approval instead of Confirmed
        appointment.status = "Pending_Approval";
        appointment.paymentStatus = "Held";
        appointment.transactionId = paymentId;
        appointment.amountPaid = appointment.fee;
        appointment.platformFee = platformFee;
        appointment.doctorEarnings = doctorEarnings;
        appointment.settlementStatus = "Held";

        await appointment.save();
        console.log(`Webhook: Appointment ${appointment._id} set to Pending_Approval via payment ${paymentId}`);

        // Send notification to doctor about new pending appointment
        try {
          const populatedAppointment = await Appointment.findById(appointment._id)
            .populate("patient", "fullName email")
            .populate("doctor", "fullName email");

          if (populatedAppointment.doctor?.email) {
            await sendEmail(
              populatedAppointment.doctor.email,
              "New Appointment Request - Action Required",
              emailTemplates.newAppointmentRequest({
                patientName: populatedAppointment.patient.fullName,
                doctorName: populatedAppointment.doctor.fullName,
                date: new Date(appointment.appointmentDate).toLocaleDateString(),
                time: appointment.timeSlot,
                type: appointment.consulation_type,
                fee: appointment.fee,
              })
            );
          }
        } catch (emailError) {
          console.error("Webhook email error:", emailError);
        }
      }
    }

    // Handle refund processed
    if (event === "refund.processed" || event === "refund.created") {
      const refund = req.body.payload.refund.entity;
      const paymentId = refund.payment_id;

      const appointment = await Appointment.findOne({ transactionId: paymentId });

      if (appointment) {
        appointment.refundId = refund.id;
        appointment.refundStatus = refund.status === "processed" ? "Completed" : "Processing";
        appointment.refundAmount = refund.amount / 100; // Convert from paise
        
        if (refund.status === "processed") {
          appointment.refundedAt = new Date();
          appointment.paymentStatus = "Refunded";
        }

        await appointment.save();
        console.log(`Webhook: Refund ${refund.id} for appointment ${appointment._id} - Status: ${refund.status}`);

        // Send refund completion email to patient
        if (refund.status === "processed") {
          try {
            const populatedAppointment = await Appointment.findById(appointment._id)
              .populate("patient", "fullName email")
              .populate("doctor", "fullName email");

            if (populatedAppointment.patient?.email) {
              await sendEmail(
                populatedAppointment.patient.email,
                "Refund Processed Successfully",
                emailTemplates.refundCompleted({
                  patientName: populatedAppointment.patient.fullName,
                  doctorName: populatedAppointment.doctor?.fullName || "Doctor",
                  refundAmount: appointment.refundAmount,
                  refundId: refund.id,
                  date: new Date(appointment.appointmentDate).toLocaleDateString(),
                })
              );
            }
          } catch (emailError) {
            console.error("Webhook refund email error:", emailError);
          }
        }
      }
    }

    // Handle refund failed
    if (event === "refund.failed") {
      const refund = req.body.payload.refund.entity;
      const paymentId = refund.payment_id;

      const appointment = await Appointment.findOne({ transactionId: paymentId });

      if (appointment) {
        appointment.refundStatus = "Failed";
        await appointment.save();
        console.error(`Webhook: Refund FAILED for appointment ${appointment._id} - Refund ID: ${refund.id}`);
      }
    }

    // Handle transfer events
    if (event === "transfer.processed") {
      const transfer = req.body.payload.transfer.entity;
      console.log(`Webhook: Transfer ${transfer.id} processed - Amount: ${transfer.amount / 100}`);
    }

    if (event === "transfer.reversed") {
      const transfer = req.body.payload.transfer.entity;
      console.log(`Webhook: Transfer ${transfer.id} reversed`);
    }

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
