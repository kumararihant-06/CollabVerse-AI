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

export const saveProjectFileService = async ({projectId, fileName, content}) => {
    const project = await Project.findById(projectId);
    const file = project.files.find(f => f.name === fileName);
    if(file){
        file.content = content;
        await project.save();
        return project;
    }else{
        throw new Error("File not found")
    }
}

