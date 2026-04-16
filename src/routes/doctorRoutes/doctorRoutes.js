import { Router } from "express";
import {
  getAllAppointments,
  getAvailability,
  loginDoctor,
  logoutDoctor,
  registerDoctor,
  updateSchedule,
  markVerificationMessageShown,
  createDoctorAppointment,
} from "../../controllers/doctor/doctorController.js";
import uploads from "../../config/multer.js";
import verifyToken, { verifyDoctor } from "../../middlewares/authMiddleware.js";

const doctorRoutes = Router();

doctorRoutes.post(
  "/doctor/register",
  uploads.fields([
    { name: "medical_license", maxCount: 1 },
    { name: "goverment_id", maxCount: 1 },
    { name: "profile_image", maxCount: 1 },
  ]),
  registerDoctor,
);
doctorRoutes.post("/doctor/login", loginDoctor);
doctorRoutes.post("/doctor/logout", logoutDoctor);
doctorRoutes.get("/doctor/appointments", verifyToken, getAllAppointments);
doctorRoutes.put("/doctor/schedule", verifyToken, updateSchedule);
doctorRoutes.get("/doctor/availability", verifyToken, getAvailability);
doctorRoutes.post("/doctor/mark-verification-message-shown", verifyToken, markVerificationMessageShown);
doctorRoutes.post("/doctor/create-appointment", verifyToken, createDoctorAppointment);

export default doctorRoutes;