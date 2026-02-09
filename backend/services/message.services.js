import Message from "../models/message.models.js";

export const getProjectMessageService = async ({projectId}) => {
    if(!projectId){
        throw new Error("Project Id is required.")
    }
    try {
        const messages = await Message.find({project: projectId})
                    .populate("sender", "username email")
                    .sort({ createdAt: 1 });
        return messages;
    } catch (error) {
        throw new Error("Error fetching project messages: ", error||error.message);
    }
}