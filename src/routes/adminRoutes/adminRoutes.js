import { Router } from "express";
import { adminLogin } from "../../controllers/admin/adminController.js";
import deleteAndCreateAdmin from "../../controllers/admin/createAdmin.js";

const adminRoutes = Router();

adminRoutes.get("/admin/create", deleteAndCreateAdmin);
adminRoutes.post("/admin/login", adminLogin);

export default adminRoutes;
