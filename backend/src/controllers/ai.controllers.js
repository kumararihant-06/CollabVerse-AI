import { generateResultService } from "../services/ai.services.js";

export const generateResultController = async(req,res) => {
    try {
         const prompt = req.query.prompt || req.body.prompt;

        // 1. Validate that the prompt actually exists
        if (!prompt) {
            return res.status(400).send({ error: "Prompt is required" });
        }
         const result = await generateResultService(prompt);
         res.send(result);
    } catch (error) {
        console.log(error);
        return res.status(500).send(error)
    }
}