import {Router} from 'express';
import {body} from 'express-validator';
import { createProjectController } from '../../controllers/project.controllers.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const v1ProjectRouter = Router();

v1ProjectRouter.post('/create',
                      authMiddleware,
                      body('projectName').isString().withMessage('Project name is required.'),
                      createProjectController
                    )
          
                    
export default v1ProjectRouter