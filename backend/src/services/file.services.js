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

export const saveProjectFileService = async ({projectId, fileName, content, userId}) => {
    const update = {
        "files.$.content": content
    };
    if (userId) {
        update["files.$.lastEditedBy"] = userId;
        update["files.$.lastEditedAt"] = new Date();
    }

    const result = await Project.findOneAndUpdate(
        { _id: projectId, "files.name": fileName },
        { $set: update },
        { new: true }
    );

    if (!result) {
        throw new Error("File not found");
    }
    return result;
}