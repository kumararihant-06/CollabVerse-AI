import {Router} from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import {  getProjectFilesController, saveProjectFileController } from '../../controllers/file.controllers.js';

const v1FileRouter = Router();

v1FileRouter.get("/get-files/:projectId",
                authMiddleware,
                getProjectFilesController
);

v1FileRouter.post("/save-content",
                    authMiddleware,
                    saveProjectFileController
);


export default v1FileRouter;