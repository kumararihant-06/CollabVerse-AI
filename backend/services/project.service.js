import Project from '../models/project.models.js';

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