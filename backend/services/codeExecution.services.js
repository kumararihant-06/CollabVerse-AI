import axios from 'axios';

const PISTON_API_URL = 'https://emkc.org/api/v2/piston';

const LANGUAGE_MAP = {
    'javascript':{lagnguage:'javascript', version: '18.15.0'},
    'python': { language: 'python', version: '3.10.0' },
    'cpp': { language: 'cpp', version: '10.2.0' },
    'c': { language: 'c', version: '10.2.0' },
    'java': { language: 'java', version: '15.0.2' },
};

export const executeCodeService = async (code, language ) => {
    try {
        const languageConfig = LANGUAGE_MAP[language.toLowerCase()];
        if(!languageConfig){
            throw new Error(`Unsupported language: ${language}`);
        }
        const response = await axios.post(`${PISTON_API_URL}/execute`, {
            language: languageConfig.language,
            version: languageConfig.version,
            files: [{
                name:`main.${language}`,
                content: code
            }]
        });

        return {
            success: true,
            output: response.data.run.stdout || `No output`,
            stderr: response.data.run.stderr || '',
            code: response.data.run.code
        };
    } catch (error) {
        console.log("Code Execution error: ", error);
        return{
            success: false,
            error: error.message
        }

    }
}