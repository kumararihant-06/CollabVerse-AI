import Project from "../models/project.models.js";
import { validationResult } from "express-validator";
import { addUserToProjectService, createProjectService, getAllProjectsService, getProjectByIdService} from "../services/index.js";
import User from "../models/user.models.js";

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
        return project;
    } catch (error) {
        console.log("Error occurred while creating the project.",error);
        res.status(400).json({
            success: false,
            message:`An error occurred while creating project: ${error}`
        })
    }
    
}

export const getAllProjectsController = async (req, res) => {
    try {
        const loggedInUser = await User.findOne({
            email: req.user.email
        })

        const allUserProjects = await getAllProjectsService({
            userId: loggedInUser._id
        })
        
        return res.status(200).json({
            success: true,
            projects: allUserProjects
        })
        
    } catch (error) {
        console.log("Error occurred while fetching Projects.", error);
        res.status(500).json({
            success: false,
            message: `An error occurred while fetching projects: ${error}`
        })
    }
}

export const addUserToProjectController = async (req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({
            error: errors.array()
        })
    }

    try {
        const {projectId, users} = req.body;
        const loggedInUserId = await User.findOne({
            email: req.user.email
        });
        const userId = loggedInUserId._id;
        const updatedProject = await addUserToProjectService({
            projectId,
            users,
            userId
        })

        return res.status(200).json({
            success: true,
            message: "Users added to project successfully.",
            project: updatedProject
        })
    } catch (error) {
        console.log("Error occurred while adding user to project.", error);
        res.status(500).json({
            success: false,
            message: `An error occurred while adding user to project: ${error}`
        })
    }
}

export const getProjectByIdController = async (req, res) =>{
    const {projectId} = req.params;

    try {
        const project = await getProjectByIdService({projectId});

        return res.status(200).json({
            success: true,
            project
        })
    } catch (error) {
        console.log("Error occurred while fetching project by ID.", error);
        res.status(500).json({
            success: false,
            message:` An error occurred while fetching project: ${error}`
        })
    }
}