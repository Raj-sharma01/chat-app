import express from 'express';
import chatController from '../controllers/Chat.Controller.js';

const router = express.Router();

router.get('/messages/:userId', chatController.getMessages);
router.get('/people', chatController.getPeople);
router.get('/profile', chatController.getProfile);

export default router;
