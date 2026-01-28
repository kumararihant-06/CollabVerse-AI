import {Router} from 'express';
import {body} from 'express-validator';
import { createProjectController, getAllProjectsController } from '../../controllers/project.controllers.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { get } from 'mongoose';

const v1ProjectRouter = Router();

v1ProjectRouter.post('/create',
                      authMiddleware,
                      body('projectName').isString().withMessage('Project name is required.'),
                      createProjectController
                    )
          
v1ProjectRouter.get('/all-projects',
                      authMiddleware,
                      getAllProjectsController
                    )
                    
export default v1ProjectRouter