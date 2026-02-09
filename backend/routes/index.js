import {Router} from 'express'
import v1UserRouter from './v1/user.routes.js';
import v1ProjectRouter from './v1/project.routes.js';
import v1MessageRouter from './v1/message.routes.js';

const router = Router();

router.use("/v1/user",v1UserRouter)
router.use("/v1/project", v1ProjectRouter)
router.use("/v1/message", v1MessageRouter)

export default router