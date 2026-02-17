import { executeCodeService } from "../services/codeExecution.services.js";

export const executeCodeController = async (req, res) => {
    try {
        const {code, language} = req.body;
        if(!code || !language){
            return res.status(400).json({
                success:false,
                message:"Code and Language are required."
            })
        }

        const result = await executeCodeService(code, language);
        return res.status(200).json(result)
    } catch (error) {
        console.log("Execute code controller error: ", error)
        return res.status(500).json({
            success:false,
            message:"Error executing code.",
            error: error.message
        })
    }
}