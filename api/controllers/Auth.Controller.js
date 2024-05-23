import Jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {UserModel} from '../models/User.Model.js';

const jwtSecret = process.env.JWT_SECRET_KEY;
const bcryptSalt = bcrypt.genSaltSync(10);

const authController = {
    login: async (req, res) => {
        const { username, password } = req.body;
        const foundUser = await UserModel.findOne({ username });
        if (foundUser) {
            const passOk = bcrypt.compareSync(password, foundUser.password);
            if (passOk) {
                Jwt.sign({ userId: foundUser._id, username }, jwtSecret, {}, (err, token) => {
                    if (err) throw err;
                    res.cookie('token', token).status(201).json({
                        id: foundUser._id,
                    });
                });
            }
        }
        //else send notification for access denied 
    },

    logout: async (req, res) => {
        res.cookie('token', '').json('ok');
    },

    register: async (req, res) => {
        const { username, password } = req.body;
        try {
            const hashedPassword = bcrypt.hashSync(password, bcryptSalt)
            const createdUser = await UserModel.create({
                username: username,
                password: hashedPassword
            })
            //Jwt.sign -- is async function
            Jwt.sign({ userId: createdUser._id, username }, jwtSecret, {}, (err, token) => {
                if (err) throw err;
                console.log("signing a cookie")
                // , { secure: process.env.NODE_ENV === 'production', sameSite: 'None' }
                res.cookie('token', token).status(201).json({
                    id: createdUser._id,
                });

            })

        } catch (error) {
            if (error) throw error;
            res.status(500).json('error')
        }
    },
};

export default authController;
