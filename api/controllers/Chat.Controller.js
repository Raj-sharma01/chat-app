import Jwt from 'jsonwebtoken';
import { MessageModel } from '../models/Message.Model.js';
import { UserModel } from '../models/User.Model.js';
import { getUserDataFromRequest } from '../utils/helper.js';
import { decrypt } from '../utils/cryptoUtils.js';

const jwtSecret = process.env.JWT_SECRET_KEY;

const chatController = {
  getMessages: async (req, res) => {
    try {
      const { userId } = req.params;
      const userData = await getUserDataFromRequest(req);
      const ourUserId = userData.userId;

      // const messages = await MessageModel.find({
      //   sender: { $in: [userId, ourUserId] },
      //   recipient: { $in: [userId, ourUserId] },
      // }).sort({ createdAt: 1 });
      // res.json(messages);
      // Retrieve encrypted messages from the database
      const encryptedMessages = await MessageModel.find({
        sender: { $in: [userId, ourUserId] },
        recipient: { $in: [userId, ourUserId] },
      }).sort({ createdAt: 1 });

      // Decrypt the messages before sending them to the client
      const decryptedMessages = encryptedMessages.map(message => ({
        ...message._doc,
        text: decrypt({ encryptedText: message.encryptedText, iv: message.iv }),
      }));

      res.json(decryptedMessages);
    } catch (error) {
      console.log("got an error - ", error)
      res.status(500).send({ message: `error in getting message ${error.message}` })
    }

  },

  getPeople: async (req, res) => {
    try {
      const users = await UserModel.find({}, { '_id': 1, username: 1 });
      res.json(users);
    } catch (error) {
      console.log("got an error - ", error)
      res.status(500).send({ message: `error in getting people ${error.message}` })
    }

  },

  getProfile: async (req, res) => {
    try {
      const token = req.cookies?.token;
      if (token) {
        Jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) throw err;
          res.json(userData);
        });
      } else {
        res.status(401).json('no token');
      }
    } catch (error) {
      console.log("got an error - ", error)
      res.status(500).send({ message: `error in getting profile ${error.message}` })
    }

  },
};

export default chatController;
