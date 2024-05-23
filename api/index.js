import express from 'express'
import 'dotenv/config'
import mongoose from 'mongoose';
import { UserModel } from './models/User.Model.js';
import { MessageModel } from './models/Message.Model.js';
import Jwt from 'jsonwebtoken';
import cors from 'cors'
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import { createServer } from "http";
import { Server } from "socket.io";
import fs from 'fs'
import { cwd } from 'process';

// const httpServer
const app = express();

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
        methods: ["GET", "POST"],
        credentials: true
    },
    // pingInterval:25000,
    // pingTimeout:20000,
});

const jwtSecret = process.env.JWT_SECRET_KEY;
const bcryptSalt = bcrypt.genSaltSync(10);

const __dirname = cwd()
app.use('/uploads', express.static(__dirname + '/uploads'));

app.use(express.json())
//Parse Cookie header and populate req.cookies with an object keyed by the cookie names.
app.use(cookieParser())

const corsOptions = {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
};

app.use(cors(corsOptions));


mongoose.connect(process.env.MONGO_URL)

mongoose.connection.once('open', () => {
    console.log("Database connected successfully")
})

mongoose.connection.on('error', (error) => {
    console.log('oops error ', error)
    console.log('mongoose error')
})

app.get('/test', (req, res) => {
    res.json('test, ok');
})

async function getUserDataFromRequest(req) {
    return new Promise((resolve, reject) => {
        const token = req.cookies?.token;
        if (token) {
            Jwt.verify(token, jwtSecret, {}, (err, userData) => {
                if (err) throw err;
                resolve(userData);
            });
        } else {
            reject('no token');
        }
    });
}


app.get('/messages/:userId', async (req, res) => {
    const { userId } = req.params;
    const userData = await getUserDataFromRequest(req);
    const ourUserId = userData.userId;
    const messages = await MessageModel.find({
        sender: { $in: [userId, ourUserId] },
        recipient: { $in: [userId, ourUserId] },
    }).sort({ createdAt: 1 });
    res.json(messages);
});

app.get('/people', async (req, res) => {
    const users = await UserModel.find({}, { '_id': 1, username: 1 });
    res.json(users);
});

app.get('/profile', (req, res) => {
    const token = req.cookies?.token;
    if (token) {
        Jwt.verify(token, jwtSecret, {}, (err, userData) => {
            if (err) throw err;
            res.json(userData); 
        });
    } else {
        res.status(401).json('no token');
    }
})

app.post('/login', async (req, res) => {
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
});

app.post('/logout', (req, res) => {
    res.cookie('token', '').json('ok');
});

app.post('/register', async (req, res) => {
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
            res.cookie('token', token).status(201).json({
                id: createdUser._id,
            });

        })

    } catch (error) {
        if (error) throw error;
        res.status(500).json('error')
    }


})


httpServer.listen(4040, () => {
    console.log("server is running on port 4040");
})

io.use((socket, next) => {
    const { headers } = socket.request;
    const cookies = headers.cookie;

    if (cookies) {
        const tokenCookieString = cookies.split(';').find(str => str.trim().startsWith('token='));

        if (tokenCookieString) {
            const token = tokenCookieString.split('=')[1].trim();

            if (token) {
                Jwt.verify(token, jwtSecret, {}, (err, userData) => {
                    if (err) {
                        console.log("Invalid token or expired");
                        return next(new Error('Invalid token'));
                    }
                    const { userId, username } = userData;
                    socket.userId = userId;
                    socket.username = username;
                    console.log("Token verified successfully");
                    return next();
                });
            } else {
                console.log("No token provided");
                return next(new Error('Unauthorized'));
            }
        } else {
            console.log("No token found in cookies");
            return next(new Error('Unauthorized'));
        }
    } else {
        console.log("No cookies found");
        return next(new Error('Unauthorized'));
    }
});



io.on('connection', async (socket) => {
    console.log("connected with : ", socket.username)
    console.log(socket.id, socket.userId)

    function notifyAboutOnlinePeople() {
        const onlineUsers = [...Array.from(io.sockets.sockets)].map(([id, s]) => ({ username: s.username, userId: s.userId }));
        io.emit('onlineUsers', onlineUsers);
    }

    socket.on('disconnect', () => {
        notifyAboutOnlinePeople();
        console.log('disconnected');
    });

    notifyAboutOnlinePeople();

    socket.on('message', async (message) => {
        console.log("got a message", message)
        const messageData = JSON.parse(message)
        const { recipient, text, file } = messageData;
        let filename = null;
        if (file) {
            console.log('size', file.data.length);
            const parts = file.name.split('.');
            const ext = parts[parts.length - 1];
            filename = Date.now() + '.' + ext;
            const path = __dirname + '/uploads/' + filename;
            const bufferData = Buffer.from(file.data.split(',')[1], 'base64');
            fs.writeFile(path, bufferData, () => {
                console.log('file saved:' + path);
            });
        }
        if (recipient && (text || file)) {
            const messageDoc = await MessageModel.create({
                sender: socket.userId,
                recipient,
                text,
                file: file ? filename : null,
            });


            const sockets = Array.from(io.sockets.sockets)
            sockets.forEach(([id, socket]) => {
                // console.log(`Socket ID: ${socket.userId} and recipent : ${recipient}`);
                if (socket.userId === recipient) {
                    console.log("got it")
                    console.log(`Socket ID: ${socket.userId} and recipent : ${recipient}`);
                    io.to(socket.id).emit("message", JSON.stringify({
                        text,
                        sender: socket.userId,
                        recipient,
                        file: file ? filename : null,
                        _id: messageDoc._id,
                    }))
                    // return false;
                }
            });

        }


    })

})


