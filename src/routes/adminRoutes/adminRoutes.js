import { Router } from "express";
import {
  adminLogin,
  ApproveDoctor,
  RejectDoctor,
  GetAllDoctors,
} from "../../controllers/admin/adminController.js";
import deleteAndCreateAdmin from "../../controllers/admin/createAdmin.js";
import verifyToken, { verifyAdmin } from "../../middlewares/authMiddleware.js";

const adminRoutes = Router();

adminRoutes.get("/admin/create", deleteAndCreateAdmin);
adminRoutes.post("/admin/login", adminLogin);
adminRoutes.get("/admin/doctors", verifyToken, verifyAdmin, GetAllDoctors);
adminRoutes.patch(
  "/admin/approve/:doctorId",
  verifyToken,
  verifyAdmin,
  ApproveDoctor,
);
adminRoutes.patch(
  "/admin/reject/:doctorId",
  verifyToken,
  verifyAdmin,
  RejectDoctor,
);

export default adminRoutes;
