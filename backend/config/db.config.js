import mongoose from 'mongoose'

const connectDB = async() =>{
    try {
        console.log(process.env.MONGODB_URI)
        const connection = await mongoose.connect(`${process.env.MONGODB_URI}`);
        console.log(`MONGO DB Connected Successfully at ${connection.connection.host} `)
    } catch (error) {
        console.log('MongoDb Connection failed. An error occurred: ',error );
        process.exit(1);
    }
}

export default connectDB;