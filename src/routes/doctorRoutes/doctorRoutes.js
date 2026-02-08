import { Router } from "express";
import {
  getAllAppointments,
  loginDoctor,
  logoutDoctor,
  registerDoctor,
} from "../../controllers/doctor/doctorController.js";
import uploads from "../../config/multer.js";
import verifyToken from "../../middlewares/authMiddleware.js";

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

export default doctorRoutes;
