import mongoose from 'mongoose'
import { ServerConfig } from './enviornment.config.js';

const connectDB = async() =>{
    try {
        const connection = await mongoose.connect(`${ServerConfig.MONGODB_URI}`);
        console.log(`MONGO DB Connected Successfully at ${connection.connection.host} `)
    } catch (error) {
        console.log('MongoDb Connection failed. An error occurred: ',error );
        process.exit(1);
    }
}

export default connectDB;