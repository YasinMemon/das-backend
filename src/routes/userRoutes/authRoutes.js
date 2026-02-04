import { Router } from "express";
import {
  GetAllVerifiedDoctors,
  UserLogin,
  UserRegister,
} from "../../controllers/userControllers.js";

const UserAuthRouter = Router();

UserAuthRouter.post("/user/register", UserRegister);
UserAuthRouter.post("/user/login", UserLogin);
UserAuthRouter.get("/user/verified/doctors", GetAllVerifiedDoctors);

export default UserAuthRouter;
