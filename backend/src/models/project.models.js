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
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    collaborators: [
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

projectSchema.index({ owner: 1, name: 1 }, { unique: true })

const Project = mongoose.model("Project", projectSchema);

export default Project;