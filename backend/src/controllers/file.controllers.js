import e from "express";
import {  getProjectFilesService, saveProjectFileService } from "../services/file.services.js";

export const getProjectFilesController = async (req, res) => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: 'Project ID is required'
            });
        }

        const files = await getProjectFilesService(projectId);

        return res.status(200).json({
            success: true,
            files: files
        });
    } catch (error) {
        console.error('Get files error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error fetching files'
        });
    }
};

export const saveProjectFileController = async (req, res) => {
    try {
        const {projectId, fileName, content} = req.body;
        if(!projectId || !fileName ) return res.status(400).json({message: "project ID and file name are required."})
        const result = await saveProjectFileService({projectId, fileName, content});
        return req.status(200).json({message: "Success"})
    } catch (error) {
        res.status(404).json({message: `Error occurred: ${error.message}`})
    }
}
