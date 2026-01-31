import { Router } from "express";
import { UserLogin, UserRegister } from "../../controllers/userControllers.js";

const UserAuthRouter = Router();

UserAuthRouter.post("/user/register", UserRegister);
UserAuthRouter.post("/user/login", UserLogin);

export default UserAuthRouter;
