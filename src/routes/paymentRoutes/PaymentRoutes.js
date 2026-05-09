import { Router } from "express";
import { RazorpayWebhook } from "../../controllers/payments/WebhookController.js";

const paymentRoutes = Router();

paymentRoutes.post("/payments/webhook", RazorpayWebhook);

export default paymentRoutes;
