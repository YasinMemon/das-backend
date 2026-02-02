import { Router } from "express";
import {
  loginDoctor,
  logoutDoctor,
  registerDoctor,
} from "../../controllers/doctor/doctorController.js";
import uploads from "../../config/multer.js";

const doctorRoutes = Router();

doctorRoutes.post(
  "/doctor/register",
  uploads.fields([
    { name: "medical_license", maxCount: 1 },
    { name: "goverment_id", maxCount: 1 },
  ]),
  registerDoctor,
);
doctorRoutes.post("/doctor/login", loginDoctor);
doctorRoutes.post("/doctor/logout", logoutDoctor);

export default doctorRoutes;
