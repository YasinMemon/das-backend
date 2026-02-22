import { Router } from "express";
import {
  GetAllVerifiedDoctors,
  GetMyAppointments,
  GetVerifiedDoctorsBySpecialization,
  UserLogin,
  UserRegister,
} from "../../controllers/userControllers.js";
import verifyToken from "../../middlewares/authMiddleware.js";

const UserAuthRouter = Router();

UserAuthRouter.post("/user/register", UserRegister);
UserAuthRouter.post("/user/login", UserLogin);
UserAuthRouter.get("/user/verified/doctors", GetAllVerifiedDoctors);
UserAuthRouter.get(
  "/user/verified/doctors/:specialization",
  GetVerifiedDoctorsBySpecialization,
);
UserAuthRouter.get("/user/appointments", verifyToken, GetMyAppointments);

export default UserAuthRouter;
