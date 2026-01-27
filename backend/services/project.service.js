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

    const project  = await Project.create({
        name: projectName,
        users: [userId]
    })

    return project
}