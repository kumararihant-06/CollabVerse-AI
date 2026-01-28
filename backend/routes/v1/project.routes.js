import {Router} from 'express';
import {body} from 'express-validator';
import { addUserToProjectController, createProjectController, getAllProjectsController, getProjectByIdController } from '../../controllers/project.controllers.js';
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

v1ProjectRouter.put('/add-user',
                      authMiddleware,
                      body('projectId').isString().withMessage('Project ID is required.'),
                      body('users').isArray().withMessage('Users must be an array of string ').bail().custom((users)=> users.every(user => typeof user === 'string')).withMessage('Each user must be a string.'),
                      addUserToProjectController
                    )

v1ProjectRouter.get('/get-project/:projectId',
                      authMiddleware,
                      getProjectByIdController
)
export default v1ProjectRouter