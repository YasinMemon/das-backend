import Appointment from "../../models/AppointmentModel.js";
import crypto from "crypto";

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

    if (event === "payment.captured") {
      const payment = req.body.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      const appointment = await Appointment.findOne({ paymentId: orderId });

      if (appointment && appointment.status !== "Confirmed") {
        const commissionPercent = parseInt(process.env.PLATFORM_COMMISSION) || 10;
        const platformFee = (appointment.fee * commissionPercent) / 100;
        const doctorEarnings = appointment.fee - platformFee;

        appointment.status = "Confirmed";
        appointment.paymentStatus = "Completed";
        appointment.transactionId = paymentId;
        appointment.amountPaid = appointment.fee;
        appointment.platformFee = platformFee;
        appointment.doctorEarnings = doctorEarnings;

        await appointment.save();
        console.log(`Webhook: Appointment ${appointment._id} confirmed via payment ${paymentId}`);
      }
    }

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
