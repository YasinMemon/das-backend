import { Router } from "express";
import {
  adminLogin,
  GetAllDoctors,
} from "../../controllers/admin/adminController.js";
import deleteAndCreateAdmin from "../../controllers/admin/createAdmin.js";
import verifyToken, { verifyAdmin } from "../../middlewares/authMiddleware.js";

const adminRoutes = Router();

adminRoutes.get("/admin/create", deleteAndCreateAdmin);
adminRoutes.post("/admin/login", adminLogin);
adminRoutes.get("/admin/doctors", verifyToken, verifyAdmin, GetAllDoctors);

export default adminRoutes;