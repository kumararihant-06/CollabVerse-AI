import Project from '../models/project.models.js';
import mongoose from 'mongoose';

export const createProjectService = async ({
    projectName,
    userId
}) => {
    if(!projectName){
        throw new Error("Project name is required.")
    }
    if(!userId){
        throw new Error("User ID is required.")
    }

    try {
       const project = await Project.create({
        name: projectName,
        owner: userId,
        collaborators: []
    })
        return project;
    } catch (error) {
        if(error.code === 11000){
            throw new Error("You already own a project with this name.")
        }
        throw error;
    }
}

export const getAllProjectsService = async ({userId}) => {
    if(!userId){
        throw new Error("User ID is required.")
    }

    try {
        const ownedProjects = await Project.find({ owner: userId })
        const collaboratingProjects = await Project.find({ collaborators: userId })

        return { ownedProjects, collaboratingProjects };
    } catch (error) {
        throw error;
    }
}

export const addUserToProjectService = async ({projectId, users, userId}) => {

    if(!projectId){
        throw new Error("Project ID is required.")
    }
    if(!mongoose.Types.ObjectId.isValid(projectId)){
        throw new Error("Invalid Project ID")
    }
    if(!users || !Array.isArray(users) || users.some(userId => !mongoose.Types.ObjectId.isValid(userId) || users.length === 0)){
        throw new Error("Users must be a non-empty array of valid User IDs.")
    } 

    if(!userId){
        throw new Error("User ID is required.");
    }

    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new Error("Invalid User ID.")
    }

    const project = await Project.findOne({
        _id: projectId,
        owner: userId
    });

    if(!project){
        throw new Error("Project not found or you do not have permission to modify this project.")
    }

    const updatedProject = await Project.findOneAndUpdate({
        _id: projectId
    },{
        $addToSet: {
            collaborators: {
                $each: users
            }
        }
    },{
        new: true
    }
    )
    return updatedProject;

}

export const getProjectByIdService = async ({projectId}) =>{
    if(!projectId){
        throw new Error("Project Id is required.");
    }

    if(!mongoose.Types.ObjectId.isValid(projectId)){
        throw new Error("Invalid Project ID.")
    }

    const project  = await Project.findOne({
        _id: projectId
    }).populate('owner', 'username email').populate('collaborators', 'username email')

    if(!project){
        throw new Error("Project not found.")
    }

    return project;
}