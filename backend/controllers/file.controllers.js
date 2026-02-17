import {  getProjectFilesService } from "../services/file.services.js";

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

