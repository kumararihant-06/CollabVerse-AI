import { BadRequestError, NotFoundError } from "../errors/AppError.js";
import Project from "../models/project.models.js";

export const getProjectFilesService = async (projectId) => {
    const project = await Project.findById(projectId)
                    .populate('files.createdBy', 'username email')
                    .populate('files.lastEditedBy', 'username email')
                    .exec();

    if(!project){
        throw new NotFoundError("Project not found.")
    }

    return project.files || [];
}

export const saveProjectFileService = async ({projectId, fileName, content, userId}) => {
    if(!projectId) throw new BadRequestError("Project ID is required.");
    if(!fileName) throw new BadRequestError("File name is required");

    const project = await Project.findById(projectId);
    if(!project) throw new NotFoundError("Project not found.");

    const file = project.files.find(f => f.name === filename);
    if (!file) throw new NotFoundError(`File ${filename} not found in project.`);

    file.content = content;
    if(userId){
        file.lastEditedBy = userId;
        file.lastEditedAt = new Date();
    }
    await project.save();
    return project;
}

