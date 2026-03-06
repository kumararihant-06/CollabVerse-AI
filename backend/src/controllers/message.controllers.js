import { getProjectMessageService } from "../services/message.services.js"

export const getProjectMessageController = async (req, res) => {
    console.log(req.params)
    const {projectId} = req.params;
    try {
        const messageResponse = await getProjectMessageService({projectId});
        return res.status(200).json({
            success: true,
            message: "Successfully fetched messages.",
            messages: messageResponse
        })
    } catch (error) {
        console.log("An error occurred while fetching messages: ", error)
        return res.status(500).json({
            success: false,
            message: `Error occurred while fetching message: ${error.message||error}`
        })
    }
}