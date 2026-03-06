import {Router} from 'express';
import { generateResultController } from '../../controllers/ai.controllers.js';


const v1AiRouter = Router();

v1AiRouter.get("/get-result",
                   generateResultController
)

export default v1AiRouter