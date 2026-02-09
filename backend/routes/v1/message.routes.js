import {Router} from 'express';
import { getProjectMessageController } from '../../controllers/message.controllers.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const v1MessageRouter = Router();

v1MessageRouter.get("/get-message/:projectId",
                    authMiddleware,
                    getProjectMessageController
)

export default v1MessageRouter