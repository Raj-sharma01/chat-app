import { getUserDataFromRequest } from "../utils/helper.js";
import { GroupModel } from "../models/Group.Model.js";
import { UserModel } from "../models/User.Model.js";
import mongoose from "mongoose";
import { GroupChatModel } from "../models/GroupChat.Model.js";

const groupController = {
    // Existing code...

    createGroup: async (req, res) => {
        try {
          
            const userData = await getUserDataFromRequest(req); 
            const { groupName, members } = req.body;
    console.log("req body ",req.body)
            // , userData._id
            // Ensure the creator is included in the members list
            console.log("user Data = ",userData)
            const uniqueMembers = [...new Set([...members,userData.username])];
            console.log("members = ",uniqueMembers)
            const membersData=await UserModel.find({username :{$in:uniqueMembers}})

            const membersUserIds=membersData.map(member=>member._id)

            const createdGroup = await GroupModel.create({ 
                name: groupName,  
                creator: userData.userId, 
                members: membersUserIds, 
            });
            console.log("model created")
            // res.json(createdGroup);
            //set group name in each member document
            const updateResult = await UserModel.updateMany(
                { _id: { $in: membersUserIds } },
                { $push: { groups: createdGroup._id } }
            );

            res.json(createdGroup);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    //get all groups where user is a member
   userGroups:async(req,res)=>{
     try {   
        // console.log("trying")    
        const userData = await getUserDataFromRequest(req);
        const groups = await GroupModel.find({ members: userData.userId });
        res.json(groups)
     } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
     }
   }
    // Existing code... 
};

export default groupController;