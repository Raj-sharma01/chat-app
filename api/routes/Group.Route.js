import express from 'express';
import groupController from '../controllers/Group.Controller.js'

const router = express.Router();
// Example endpoint in Chat.Router.js
router.post('/groups/create',groupController.createGroup);

router.get('/groups/userGroups',groupController.userGroups);

export default router;