import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    project:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    text:{
        type: String,
        required: true
    }
},{timestamps: true});

const Message =  mongoose.model("Message", messageSchema)

export default Message;