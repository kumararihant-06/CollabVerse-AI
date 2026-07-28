import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// export function loadConfig(){
//     console.log("Loading env variables...");
//     dotenv.config({path: join(__dirname,'../.env')});
//     console.log("Env variables loaded successfully.");
// }

//loadConfig();

export const ServerConfig = {
    PORT: Number(process.env.PORT) || 3001,
    MONGODB_URI: process.env.MONGODB_URI
}