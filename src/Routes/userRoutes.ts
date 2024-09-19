import { Router } from "express";
import UserController from "../Controller/userController";

const router = Router();
router.post("/users", UserController.userRegister);
router.post("/auth/login", UserController.userLogin);

export default router;
