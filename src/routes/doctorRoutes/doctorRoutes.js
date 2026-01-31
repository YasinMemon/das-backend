import { Router } from "express";
import { registerDoctor } from "../../controllers/doctor/doctorController.js";

const doctorRoutes = Router();

doctorRoutes.post("/doctor/register", registerDoctor);

export default doctorRoutes;
