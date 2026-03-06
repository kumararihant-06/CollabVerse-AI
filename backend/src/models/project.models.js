import mongoose from 'mongoose';
const fileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    content: {
        type: String,
        default: ''
    },
    language: {
        type: String,
        default: 'javascript'
    },
    lastEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastEditedAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });


const projectSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true,
        unique: [true, 'Project name must be unique.']
    },
    users: [
        {
             type: mongoose.Schema.Types.ObjectId,
             ref: 'User'
        }
    ],
    files: [fileSchema],
    activeUsers: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            username: String,
            currentFile: String,
            cursorPosition: {
                line: Number,
                column: Number
            },
            lastActive: {
                type: Date,
                default: Date.now
            }
        }
    ]
}) 

const Project = mongoose.model("Project", projectSchema);

export default Project;