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
        users: [userId]
    })
        return project;
    } catch (error) {
        if(error.code === 11000){
            throw new Error("Project name must be unique.")
        }
        throw error;
    }
    
    
}

export const getAllProjectsService = async ({userId}) => {
    if(!userId){
        throw new Error("User ID is required.")
    }

    try {
        const projects = await Project.find({
            users: userId
        })

        return projects;
    } catch (error) {
        
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
        users: userId
    });

    if(!project){
        throw new Error("Project not found or you do not have permission to modify this project.")
    }

    const updatedProject = await Project.findOneAndUpdate({
        _id: projectId
    },{
        $addToSet: {
            users: {
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

    // populate user references with basic fields (username, email)
    const project  = await Project.findOne({
        _id: projectId
    }).populate('users', 'username email')

    if(!project){
        throw new Error("Project not found.")
    }

    return project;
}