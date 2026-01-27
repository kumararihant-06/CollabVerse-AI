import Project from "../models/project.models.js";
import { validationResult } from "express-validator";
import { createProjectService} from "../services/index.js";

export const createProjectController = async (req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({
            error: errors.array()
        })
    }

    const {projectName} = req.body;
    console.log("User ID in project controller:", req.user.userId);
    const userId = req.user.userId;


    try {
        const project = await createProjectService({projectName, userId})
        res.status(201).json({
            success: true,
            message:"Successfully created new project.",
            project
        })
    } catch (error) {
        console.log("Error occurred while creating the project.",error);
        res.status(400).json({
            success: false,
            message:`An error occurred while creating project: ${error}`
        })
    }
    
}