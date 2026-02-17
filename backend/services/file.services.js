import Project from "../models/project.models.js";

export const getProjectFilesService = async (projectId) => {
    const project = await Project.findById(projectId)
                    .populate('files.createdBy', 'username email')
                    .populate('files.lastEditedBy', 'username email')
                    .exec();

    if(!project){
        throw new Error("Project not found.")
    }

    return project.files || [];
}

