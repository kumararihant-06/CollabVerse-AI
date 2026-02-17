import {Router} from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import {  getProjectFilesController } from '../../controllers/file.controllers.js';

const v1FileRouter = Router();

v1FileRouter.get("/get-files/:projectId",
                authMiddleware,
                getProjectFilesController
);


export default v1FileRouter;