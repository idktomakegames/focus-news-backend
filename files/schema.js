import mongoose, { SchemaType } from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: "user"
    }
}, {timestamps: true})

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true 
    },
    category: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    likes: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}]
        
}, {timestamps: true})

export const User = mongoose.model("User", userSchema);
export const Article = mongoose.model("Article", articleSchema);