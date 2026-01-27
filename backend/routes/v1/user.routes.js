import {Router} from 'express';
import { createUserController, loginUserController, logoutUserController, profileUserController } from '../../controllers/user.controllers.js';
import {body} from 'express-validator'
import { authMiddleware } from "../../middlewares/auth.middleware.js";
const v1UserRouter = Router();

v1UserRouter.post("/register",
                body('email').isEmail().withMessage("Email must be a valid email address."),
                body('password').isLength({min:3}).withMessage('Password must be atleast 3 characters long.'),
                createUserController)

v1UserRouter.post("/login",
                body('email').isEmail().withMessage("Email must be a valid email address."),
                body('password').isLength({min:3}).withMessage('Password must be atleast 3 characters long.'),
                loginUserController)
v1UserRouter.get("/profile",
                authMiddleware,
                profileUserController)

v1UserRouter.post("/logout",
                authMiddleware,
                logoutUserController)                



export default v1UserRouter