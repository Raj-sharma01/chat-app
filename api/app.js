import express from 'express';
import 'dotenv/config';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { cwd } from 'process';
import Jwt from 'jsonwebtoken';
import fs from 'fs'
import colors from 'colors'
import authRoutes from './routes/Auth.Route.js';
import chatRoutes from './routes/Chat.Route.js';
import groupRoutes from './routes/Group.Route.js';
import { MessageModel } from './models/Message.Model.js';
import { encrypt, decrypt } from './utils/cryptoUtils.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: [process.env.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
        methods: ["GET", "POST"],
        credentials: true,
    },
});
const __dirname = cwd()

app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(express.json());
app.use(cookieParser());//cookieparse must be above cors

// CORS configuration
const corsOptions = {
    origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
};

app.use(cors(corsOptions));

app.options('*', cors(corsOptions)); // Handle preflight requests



mongoose.connect(process.env.MONGO_URL);

mongoose.connection.once('open', () => {
    console.log("Database connected successfully".bgCyan.white);
});

mongoose.connection.on('error', (error) => {
    console.log('oops error ', error);
    console.log('mongoose error');
});

app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    next();
});

app.use('', authRoutes);
app.use('', chatRoutes);
app.use('', groupRoutes)

httpServer.listen(4040, () => {
    console.log("server is running on port 4040".bgGreen);
});

// Socket.IO setup
const jwtSecret = process.env.JWT_SECRET_KEY;


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
        // if (recipient && (text || file)) {
        //     const messageDoc = await MessageModel.create({
        //         sender: socket.userId,
        //         recipient,
        //         text,
        //         file: file ? filename : null,
        //     });

        if (recipient && (text || file)) {
            const { encryptedText, iv } = encrypt(text || ''); // Encrypt the message
            const messageDoc = await MessageModel.create({
                sender: socket.userId,
                recipient,
                encryptedText,
                iv,
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
