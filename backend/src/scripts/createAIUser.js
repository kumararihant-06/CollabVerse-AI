import dotenv from "dotenv"
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connectDB from "../config/db.config.js"
import User from "../models/user.models.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({path: join(__dirname, '../.env')});

const createAiUser = async () => {
    try {
        await connectDB();

        let aiUser = await User.findOne({email: "Ai@system.internal"});

        if(aiUser){
            console.log("AI user already exists.", aiUser._id);
            process.exit(0);
        }else{
            aiUser = await User.create({
                email: "Ai@system.internal",
                username: "AI",
                password:  Math.random().toString(36),
            });
             console.log('✅ AI user created successfully!');
        console.log('AI User ID:', aiUser._id);
        console.log('Add this to your .env file:');
        console.log(`AI_USER_ID=${aiUser._id}`);
        process.exit(0);
        }
        

    } catch (error) {
        console.error('Error creating AI user:', error);
        process.exit(1);
    }
}

createAiUser();