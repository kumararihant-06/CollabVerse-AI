import { Router} from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { executeCodeController } from "../../controllers/codeExecution.controllers.js";

const v1executeCodeRouter = Router();

v1executeCodeRouter.post('/execute',
                        authMiddleware,
                        executeCodeController
)

export default v1executeCodeRouter