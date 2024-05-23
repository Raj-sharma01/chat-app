import express from 'express';
import authController from '../controllers/Auth.Controller.js';

const router = express.Router();

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/register', authController.register);

export default router;
