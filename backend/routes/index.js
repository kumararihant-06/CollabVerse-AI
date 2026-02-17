import {Router} from 'express'
import v1UserRouter from './v1/user.routes.js';
import v1ProjectRouter from './v1/project.routes.js';
import v1MessageRouter from './v1/message.routes.js';
import v1AiRouter from './v1/ai.routes.js';
import v1executeCodeRouter from './v1/codeExecution.routes.js';
import v1FileRouter from './v1/file.routes.js';

const router = Router();

router.use("/v1/user",v1UserRouter)
router.use("/v1/project", v1ProjectRouter)
router.use("/v1/message", v1MessageRouter)
router.use("/v1/ai", v1AiRouter)
router.use("/v1/code",v1executeCodeRouter)
router.use("/v1/file",v1FileRouter)

export default router