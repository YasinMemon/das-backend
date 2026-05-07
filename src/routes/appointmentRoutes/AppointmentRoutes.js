import { Router } from "express";
import { 
  CreateAppointment,
  ApproveAppointment,
  RejectAppointment,
  InitiatePayment,
  ConfirmPayment,
  CompleteAppointment
} from "../../controllers/appointments/AppointmentController.js";
import verifyToken from "../../middlewares/authMiddleware.js";

const appointmentRoutes = Router();

appointmentRoutes.post("/appointment/create", verifyToken, CreateAppointment);
appointmentRoutes.post("/appointment/:appointmentId/approve", verifyToken, ApproveAppointment);
appointmentRoutes.post("/appointment/:appointmentId/reject", verifyToken, RejectAppointment);
appointmentRoutes.post("/appointment/:appointmentId/initiate-payment", verifyToken, InitiatePayment);
appointmentRoutes.post("/appointment/:appointmentId/confirm-payment", ConfirmPayment); // Usually webhook or direct call
appointmentRoutes.post("/appointment/:appointmentId/complete", verifyToken, CompleteAppointment);

export default appointmentRoutes;
