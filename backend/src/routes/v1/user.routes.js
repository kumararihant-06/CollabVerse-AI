import {Router} from 'express';
import { createUserController, getUserInfoController, loginUserController, logoutUserController, profileUserController } from '../../controllers/user.controllers.js';
import {body} from 'express-validator'
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { get } from 'mongoose';
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

v1UserRouter.post("/user-info",
                 body('email').isEmail().withMessage("Email must be a valid email address."),
                 authMiddleware,
                 getUserInfoController
)


export default v1UserRouter