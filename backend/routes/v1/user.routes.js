import {Router} from 'express';
import { createUserController } from '../../controllers/user.controllers.js';

const v1router = Router();

v1router.post("/register", createUserController)

export default v1router