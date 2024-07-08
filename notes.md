# Chat App Features

## 1. Login and Register

### Backend (index.js)

#### Login

Endpoint: `/login` (POST).
Receives username and password in the request body.
Compares the provided credentials with the stored user data.
If credentials are valid, creates a JWT and sends it as a cookie.

```javascript
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const foundUser = await UserModel.findOne({ username });

    // Validating the user credentials
    if (foundUser) {
        const passOk = bcrypt.compareSync(password, foundUser.password);
        if (passOk) {
            // Creating and sending JWT as a cookie
            Jwt.sign({ userId: foundUser._id, username }, jwtSecret, {}, (err, token) => {
                if (err) throw err;
                res.cookie('token', token).status(201).json({
                    id: foundUser._id,
                });
            });
        }
    }
});
```
#### Register

Endpoint: `/register` (POST).
Receives username and password in the request body.
Hashes the password and stores the user data in the database.
Creates a JWT and sends it as a cookie.

```javascript
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt)
        const createdUser = await UserModel.create({
            username: username,
            password: hashedPassword
        });

        // Creating and sending JWT as a cookie
        Jwt.sign({ userId: createdUser._id, username }, jwtSecret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token).status(201).json({
                id: createdUser._id,
            });
        });

    } catch (error) {
        if (error) throw error;
        res.status(500).json('error')
    }
}
```
## 2. Authentication with Sockets (Related to Cookie)

### Backend (index.js)

Middleware function (`io.use`) checks for a valid token in cookies during socket connection.
Verifies the user based on the token and assigns `userId` and `username` to the socket.

```javascript
io.use((socket, next) => {
    const { headers } = socket.request;
    const cookies = headers.cookie;

    // Validating token in cookies
    if (cookies) {
        // Extracting and verifying the token
        const tokenCookieString = cookies.split(';').find(str => str.trim().startsWith('token='));
        if (tokenCookieString) {
            const token = tokenCookieString.split('=')[1].trim();
            if (token) {
                Jwt.verify(token, jwtSecret, {}, (err, userData) => {
                    if (err) {
                        console.log("Invalid token or expired");
                        return next(new Error('Invalid token'));
                    }

                    // Assigning userId and username to the socket
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
```
## 3. Show Who is Online

### Backend (index.js)

Emits an 'onlineUsers' event to all clients upon connection and disconnection.

```javascript
function notifyAboutOnlinePeople() {
    const onlineUsers = [...Array.from(io.sockets.sockets)].map(([id, s]) => ({ username: s.username, userId: s.userId }));
    io.emit('onlineUsers', onlineUsers);
}

io.on('connection', async (socket) => {
    console.log("connected with : ", socket.username)

    socket.on('disconnect', () => {
        notifyAboutOnlinePeople();
        console.log('disconnected');
    });

    notifyAboutOnlinePeople();
});
```
## Frontend (Chat.jsx)

Listens for 'onlineUsers' events and updates the online users state.

```javascript
useEffect(() => {
    if (socket) {
        socket.on('onlineUsers', (onlineUsers) => {
            console.log(onlineUsers)
            showOnlinePeople(onlineUsers)
        });
    }
}, [socket]);
```
## 4. Auto Scroll the Conversation Window

### Frontend (Chat.jsx)

Utilizes `scrollIntoView` on a hidden div at the bottom to scroll to the latest message.

```javascript
const messagesEndRef = useRef(null);

useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);

// Inside the render method
<div ref={messagesEndRef}></div>
```
## 5. Selecting a Conversation

### Frontend (Contact.jsx)

Contacts are rendered with an `onClick` event to set the selected user.

```javascript
<Contact
    key={userId}
    id={userId}
    online={true}
    username={onlinePeopleExclOurUser[userId]}
    onClick={() => { setSelectedUserId(userId); console.log({ userId }) }}
    selected={userId === selectedUserId} />

// useEffect for fetching messages when selectedUserId changes
useEffect(() => {
    if (selectedUserId) {
        axios.get('/messages/' + selectedUserId).then(res => {
            setMessages(res.data);
        });
    }
}, [selectedUserId]);
```
## 6. Online Indicator & Showing Offline People

### Frontend (Chat.jsx)

```javascript
// socket.on('onlineUsers') event
socket.on('onlineUsers', (onlineUsers) => {
    console.log(onlineUsers);
    showOnlinePeople(onlineUsers);
});
```
## Backend

```javascript
// notifyAboutOnlinePeople function
function notifyAboutOnlinePeople() {
    const onlineUsers = [...Array.from(io.sockets.sockets)].map(([id, s]) => ({ username: s.username, userId: s.userId }));
    io.emit('onlineUsers', onlineUsers);
}
```
## 7. logout
## Frontend (Chat.jsx)

```javascript
// logout function
function logout() {
    axios.post('/logout').then(() => {
        setSocket(null);
        setId(null);
        setUsername(null);
    });
}
```
## Backend
```javascript
// /logout route
app.post('/logout', (req, res) => {
    res.cookie('token', '').json('ok');
});
```
## 8. Attachments / File Upload

### Frontend (Chat.jsx)

```javascript
// sendFile function
function sendFile(ev) {
    const file = ev.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const fileData = {
            name: file.name,
            data: reader.result,
        };
        console.log("Inside sendFile:", fileData);
        sendMessage(null, fileData);
    };
}
```
## Backend

```javascript
// Handling file upload in socket.on('message')
socket.on('message', async (message) => {
    const messageData = JSON.parse(message);
    const { recipient, text, file } = messageData;
    let filename = null;
    if (file) {
        // ... Saving file logic
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

        // Broadcasting the message to the recipient
        const sockets = Array.from(io.sockets.sockets);
        sockets.forEach(([id, socket]) => {
            if (socket.userId === recipient) {
                io.to(socket.id).emit("message", JSON.stringify({
                    text,
                    sender: socket.userId,
                    recipient,
                    file: file ? filename : null,
                    _id: messageDoc._id,
                }))
            }
        });
    }
});
```


# Pros and Cons of Socket.IO

## Pros

- ### Broadcasting

- ### Multiplexing


- ### Auto Reconnection

Socket.IO provides automatic reconnection capabilities, allowing clients to reconnect to the server seamlessly.

- ### Heartbeat Mechanism (Ping/Pong)

Socket.IO uses a ping/pong mechanism for heartbeat checks to ensure the connection's health. 
### Below is a raw implementation of Ping/Pong mechanism:

```javascript
// Server-side
io.on('connection', async (socket) => {

  function notifyAboutOnlinePeople() {
    const onlineUsers = [...Array.from(io.sockets.sockets)].map(([id, s]) => ({ username: s.username, userId: s.userId }));
    io.emit('onlineUsers', onlineUsers);
  }

  socket.isAlive = true;

  socket.timer = setInterval(() => {
    socket.emit('ping');
    socket.deathTimer = setTimeout(() => {
      socket.isAlive = false;
      clearInterval(socket.timer);
      socket.disconnect(true);
      notifyAboutOnlinePeople();
      console.log('dead');
    }, 1000);
  }, 5000);

  socket.on('pong', () => {
    clearTimeout(socket.deathTimer);
  });

  socket.on('disconnect', () => {
    clearInterval(socket.timer);
    notifyAboutOnlinePeople();
    console.log('disconnected');
  });

  notifyAboutOnlinePeople();
});
```
```javascript
// Client-side ping/pong implementation:
socket.on('ping', () => {
  socket.emit('pong');
});
```


## Cons of Socket.IO

- In terms of memory usage, Socket.IO may perform poorly compared to a plain WebSocket server based on the ws package.
