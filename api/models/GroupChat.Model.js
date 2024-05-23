import mongoose from "mongoose";

const GroupChatSchema = new mongoose.Schema({
    groupId:{type: mongoose.Schema.Types.ObjectId, ref: 'Group'},
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    encryptedText: String,
    iv: String,
    file: String,
}, { timestamps: true });

export const GroupChatModel = mongoose.model('GroupChat', GroupChatSchema);

