import { Router } from "express";
import {
  loginDoctor,
  logoutDoctor,
  registerDoctor,
} from "../../controllers/doctor/doctorController.js";

const doctorRoutes = Router();

doctorRoutes.post("/doctor/register", registerDoctor);
doctorRoutes.post("/doctor/login", loginDoctor);
doctorRoutes.post("/doctor/logout", logoutDoctor);

export default doctorRoutes;
