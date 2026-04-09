import { Router } from "express";
import { 
  CreateAppointment,
  ApproveAppointment,
  RejectAppointment 
} from "../../controllers/appointments/AppointmentController.js";
import verifyToken from "../../middlewares/authMiddleware.js";

const appointmentRoutes = Router();

appointmentRoutes.post("/appointment/create", verifyToken, CreateAppointment);
appointmentRoutes.post("/appointment/:appointmentId/approve", verifyToken, ApproveAppointment);
appointmentRoutes.post("/appointment/:appointmentId/reject", verifyToken, RejectAppointment);

export default appointmentRoutes;
