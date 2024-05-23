import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema({
    name: { type: String, unique: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to the creator
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Other group-related fields can be added here
}, { timestamps: true });

export const GroupModel = mongoose.model('Group', GroupSchema);
