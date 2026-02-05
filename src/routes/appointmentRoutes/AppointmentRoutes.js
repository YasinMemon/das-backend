import { Router } from "express";
import { CreateAppointment } from "../../controllers/appointments/AppointmentController.js";
import verifyToken from "../../middlewares/authMiddleware.js";

const appointmentRoutes = Router();

appointmentRoutes.post("/appointment/create", verifyToken, CreateAppointment);

export default appointmentRoutes;
