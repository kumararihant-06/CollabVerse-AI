import {Router} from 'express'
import v1UserRouter from './v1/user.routes.js';
import v1ProjectRouter from './v1/project.routes.js';
import v1MessageRouter from './v1/message.routes.js';
import v1AiRouter from './v1/ai.routes.js';

const router = Router();

router.use("/v1/user",v1UserRouter)
router.use("/v1/project", v1ProjectRouter)
router.use("/v1/message", v1MessageRouter)
router.use("/v1/ai", v1AiRouter)

export default router