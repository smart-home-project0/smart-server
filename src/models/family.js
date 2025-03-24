import mongoose from "mongoose";

// Define Family Schema
const familySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true, // Removes extra spaces
        },
        devices: {
            type: [String], // Array of device IDs
            default: [], // Default is an empty array
        },
        createdAt: {
            type: Date,
            default: Date.now, // Automatically sets the creation date
        },
    },
    { versionKey: false }
);

//  Create Family Model
export const familyModel = mongoose.model("Family", familySchema);
